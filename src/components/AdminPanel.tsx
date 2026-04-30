import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { parseSchedule } from '../utils';

interface AdminPanelProps {
  onCourseAdded: () => void;
}

const EMPTY_FORM: Partial<Course> = {
  code: '', title: '', crn: '', professor: '', schedule: '',
  location: '', campus: 'Fairfax', credits: 3,
  modality: 'In-Person', seats: 50, seatsAvailable: 50,
  color: '#16A085', description: '',
};

const PRESET_COLORS = [
  '#16A085','#1A7A4A','#006633','#2471A3',
  '#7D3C98','#C0392B','#D68910','#1ABC9C',
];

const DAY_LABELS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_CODES  = ['M', 'T', 'W', 'R', 'F'];

function buildSchedule(
  days: string[], sH: number, sM: number, sAp: 'AM'|'PM',
  eH: number, eM: number, eAp: 'AM'|'PM'
): string {
  if (!days.length) return '';
  const fmt = (h: number, m: number, ap: string) =>
    `${h}:${String(m).padStart(2, '0')} ${ap}`;
  return `${days.join('')} ${fmt(sH, sM, sAp)} - ${fmt(eH, eM, eAp)}`;
}

function parseScheduleParts(schedule: string) {
  const defaults = {
    days: [] as string[], sH: 8, sM: 0, sAp: 'AM' as 'AM'|'PM',
    eH: 9, eM: 0, eAp: 'AM' as 'AM'|'PM',
  };
  if (!schedule) return defaults;
  const parsed = parseSchedule(schedule);
  if (!parsed.startMin || !parsed.endMin) return defaults;
  const toHM = (mins: number) => {
    const h24 = Math.floor(mins / 60);
    const ap: 'AM'|'PM' = h24 >= 12 ? 'PM' : 'AM';
    return { h: h24 % 12 || 12, m: mins % 60, ap };
  };
  const s = toHM(parsed.startMin);
  const e = toHM(parsed.endMin);
  return { days: parsed.days, sH: s.h, sM: s.m, sAp: s.ap, eH: e.h, eM: e.m, eAp: e.ap };
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onCourseAdded }) => {
  const [courses, setCourses]     = useState<Course[]>([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [formData, setFormData]   = useState<Partial<Course>>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [search,         setSearch]         = useState('');
  const [filterCampus,   setFilterCampus]   = useState('All');
  const [filterModality, setFilterModality] = useState('All');
  const [schedDays, setSchedDays] = useState<string[]>([]);
  const [sH, setSH] = useState(8);  const [sM, setSM] = useState(0);  const [sAp, setSAp] = useState<'AM'|'PM'>('AM');
  const [eH, setEH] = useState(9);  const [eM, setEM] = useState(0);  const [eAp, setEAp] = useState<'AM'|'PM'>('AM');

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'courses'));
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    } catch { alert('Error loading courses. Check Firebase config.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setFormData(EMPTY_FORM); setEditingId(null); setErrors({});
    setSchedDays([]); setSH(8); setSM(0); setSAp('AM'); setEH(9); setEM(0); setEAp('AM');
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setFormData({ ...course }); setEditingId(course.id); setErrors({});
    const p = parseScheduleParts(course.schedule);
    setSchedDays(p.days); setSH(p.sH); setSM(p.sM); setSAp(p.sAp);
    setEH(p.eH); setEM(p.eM); setEAp(p.eAp);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };
  const toggleDay = (code: string) =>
    setSchedDays(d => d.includes(code) ? d.filter(x => x !== code) : [...d, code]);
  const clampH = (v: number) => Math.max(1, Math.min(12, isNaN(v) ? 1 : v));
  const clampM = (v: number) => Math.max(0, Math.min(59, isNaN(v) ? 0 : v));

  const handleSubmit = async () => {
    const builtSchedule = buildSchedule(schedDays, sH, sM, sAp, eH, eM, eAp);
    const dataToSave = { ...formData, schedule: builtSchedule };
    const e: Record<string, string> = {};
    if (!dataToSave.code?.trim())      e.code      = 'Required';
    if (!dataToSave.title?.trim())     e.title     = 'Required';
    if (!dataToSave.crn?.trim())       e.crn       = 'Required';
    if (!dataToSave.professor?.trim()) e.professor = 'Required';
    if (!schedDays.length)             e.schedule  = 'Select at least one day';
    if (!dataToSave.location?.trim())  e.location  = 'Required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setSaving(true);
      if (editingId) {
        await updateDoc(doc(db, 'courses', editingId), dataToSave);
        setCourses(cs => cs.map(c => c.id === editingId ? { ...c, ...dataToSave } as Course : c));
      } else {
        const ref = await addDoc(collection(db, 'courses'), dataToSave);
        setCourses(cs => [...cs, { id: ref.id, ...dataToSave } as Course]);
      }
      onCourseAdded(); closeModal();
    } catch { alert('Error saving course'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'courses', deleteId));
      setCourses(cs => cs.filter(c => c.id !== deleteId));
    } catch { alert('Error deleting course'); }
    finally { setDeleteId(null); }
  };

  const set = (k: keyof Course, v: any) => setFormData(f => ({ ...f, [k]: v }));

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let coursesData: Partial<Course>[] = [];

      if (file.name.endsWith('.json')) {
        coursesData = JSON.parse(text);
      } else if (file.name.endsWith('.txt')) {
        // Parse TXT as JSON array or comma-separated lines
        try {
          coursesData = JSON.parse(text);
        } catch {
          // Fallback: assume each line is a JSON object
          coursesData = text
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        }
      } else {
        alert('Only JSON and TXT files are supported.');
        return;
      }

      if (!Array.isArray(coursesData)) {
        alert('File must contain an array of courses.');
        return;
      }

      let added = 0;
      for (const courseData of coursesData) {
        if (!courseData.code || !courseData.title || !courseData.crn) {
          console.warn('Skipping invalid course:', courseData);
          continue;
        }

        const course = {
          code: courseData.code,
          title: courseData.title,
          crn: courseData.crn,
          professor: courseData.professor || 'TBA',
          schedule: courseData.schedule || 'Online',
          location: courseData.location || 'TBA',
          campus: courseData.campus || 'Fairfax',
          credits: courseData.credits || 3,
          modality: courseData.modality || 'In-Person',
          seats: courseData.seats || 50,
          seatsAvailable: courseData.seatsAvailable || 50,
          color: courseData.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
          description: courseData.description || '',
        };

        try {
          const ref = await addDoc(collection(db, 'courses'), course);
          setCourses(cs => [...cs, { id: ref.id, ...course } as Course]);
          added++;
        } catch (err) {
          console.error('Error adding course:', err);
        }
      }

      alert(`✅ Successfully added ${added} course(s)!`);
      fetchCourses();
      e.target.value = '';
    } catch (err) {
      console.error(err);
      alert('Error parsing file. Make sure it\'s valid JSON.');
    }
  };

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    const ms = !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.professor.toLowerCase().includes(q);
    const mc = filterCampus === 'All' || c.campus === filterCampus;
    const mm = filterModality === 'All' || c.modality === filterModality;
    return ms && mc && mm;
  });

  const totalSeats     = courses.reduce((s, c) => s + (c.seats || 0), 0);
  const availableSeats = courses.reduce((s, c) => s + (c.seatsAvailable || 0), 0);
  const campuses       = [...new Set(courses.map(c => c.campus))].length;
  const schedPreview   = schedDays.length ? buildSchedule(schedDays, sH, sM, sAp, eH, eM, eAp) : '';

  return (
    <div className="adm-root">
      <div className="adm-topbar">
        <div className="adm-topbar-left">
          <h1 className="adm-heading">Admin Dashboard</h1>
          <span className="adm-sub">Manage courses, seats &amp; scheduling</span>
        </div>
        <div className="adm-topbar-right">
          <input
            type="file"
            id="bulkUploadInput"
            accept=".json,.txt"
            style={{ display: 'none' }}
            onChange={handleBulkUpload}
          />
          <button
            className="adm-btn-refresh"
            onClick={() => document.getElementById('bulkUploadInput')?.click()}
            title="Upload courses from JSON or TXT file"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Bulk Import
          </button>
          <input
            type="file"
            id="bulkUploadInput"
            accept=".json,.txt"
            style={{ display: 'none' }}
            onChange={handleBulkUpload}
          />
          <button
            className="adm-btn-refresh"
            onClick={() => document.getElementById('bulkUploadInput')?.click()}
            title="Upload courses from JSON or TXT file"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Bulk Import
          </button>
          <button className="adm-btn-refresh" onClick={fetchCourses}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
          <button className="adm-btn-add" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Course
          </button>
        </div>
      </div>

      <div className="adm-stats">
        {[
          { label: 'Total Courses', value: courses.length,  icon: '📚', color: '#006633' },
          { label: 'Total Seats',   value: totalSeats,       icon: '🪑', color: '#2471A3' },
          { label: 'Open Seats',    value: availableSeats,   icon: '✅', color: '#1A7A4A' },
          { label: 'Campuses',      value: campuses,         icon: '🏛️', color: '#7D3C98' },
        ].map(s => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-icon" style={{ background: s.color + '18', color: s.color }}>{s.icon}</div>
            <div>
              <div className="adm-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <svg className="adm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="adm-search" placeholder="Search courses, professors…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="adm-filter-select" value={filterCampus} onChange={e => setFilterCampus(e.target.value)}>
          <option value="All">All Campuses</option>
          <option>Fairfax</option><option>Arlington</option>
          <option>Science and Tech</option><option>Online</option>
        </select>
        <select className="adm-filter-select" value={filterModality} onChange={e => setFilterModality(e.target.value)}>
          <option value="All">All Modalities</option>
          <option>In-Person</option><option>Online</option><option>Hybrid</option>
        </select>
        <span className="adm-count">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="adm-table-wrap">
        {loading ? (
          <div className="adm-empty"><div className="adm-spinner" /><p>Loading courses…</p></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <span style={{ fontSize: '2.5rem' }}>📭</span>
            <p>{search ? 'No courses match your search.' : 'No courses yet. Add your first one!'}</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Course</th><th>Professor</th><th>Schedule</th>
                <th>Campus</th><th>Modality</th><th>Credits</th><th>Seats</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(course => {
                const fill = (course.seatsAvailable / course.seats) * 100;
                const fillColor = fill > 50 ? '#16A085' : fill > 20 ? '#D68910' : '#C0392B';
                return (
                  <tr key={course.id}>
                    <td>
                      <div className="adm-course-cell">
                        <span className="adm-color-dot" style={{ background: course.color }} />
                        <div>
                          <span className="adm-code">{course.code}</span>
                          <span className="adm-title-cell">{course.title}</span>
                          <span className="adm-crn">CRN {course.crn}</span>
                        </div>
                      </div>
                    </td>
                    <td className="adm-td-muted">{course.professor}</td>
                    <td className="adm-td-mono">{course.schedule}</td>
                    <td><span className="adm-badge">{course.campus}</span></td>
                    <td><span className={`adm-badge adm-badge--${course.modality.toLowerCase().replace('-','')}`}>{course.modality}</span></td>
                    <td className="adm-td-center">{course.credits}</td>
                    <td>
                      <div className="adm-seats-cell">
                        <span style={{ color: fillColor, fontWeight: 700 }}>{course.seatsAvailable}</span>
                        <span className="adm-td-muted">/ {course.seats}</span>
                        <div className="adm-seat-bar">
                          <div className="adm-seat-bar-fill" style={{ width: `${fill}%`, background: fillColor }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button className="adm-btn-icon" title="Edit" onClick={() => openEdit(course)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="adm-btn-icon adm-btn-icon--danger" title="Delete" onClick={() => setDeleteId(course.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <div>
                <h2 className="adm-modal-title">{editingId ? 'Edit Course' : 'Add New Course'}</h2>
                <p className="adm-modal-sub">{editingId ? 'Update course details below' : 'Fill in the details to create a new course'}</p>
              </div>
              <button className="adm-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="adm-modal-body">
              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Course Code <span className="adm-req">*</span></label>
                  <input placeholder="e.g., IT 104" value={formData.code || ''} onChange={e => set('code', e.target.value)} className={errors.code ? 'error' : ''} />
                  {errors.code && <span className="adm-err">{errors.code}</span>}
                </div>
                <div className="adm-field adm-field--wide">
                  <label>Title <span className="adm-req">*</span></label>
                  <input placeholder="Course title" value={formData.title || ''} onChange={e => set('title', e.target.value)} className={errors.title ? 'error' : ''} />
                  {errors.title && <span className="adm-err">{errors.title}</span>}
                </div>
                <div className="adm-field">
                  <label>CRN <span className="adm-req">*</span></label>
                  <input placeholder="CRN number" value={formData.crn || ''} onChange={e => set('crn', e.target.value)} className={errors.crn ? 'error' : ''} />
                  {errors.crn && <span className="adm-err">{errors.crn}</span>}
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Professor <span className="adm-req">*</span></label>
                  <input placeholder="Professor name" value={formData.professor || ''} onChange={e => set('professor', e.target.value)} className={errors.professor ? 'error' : ''} />
                  {errors.professor && <span className="adm-err">{errors.professor}</span>}
                </div>
                <div className="adm-field adm-field--wide">
                  <label>Location <span className="adm-req">*</span></label>
                  <input placeholder="Building & room" value={formData.location || ''} onChange={e => set('location', e.target.value)} className={errors.location ? 'error' : ''} />
                  {errors.location && <span className="adm-err">{errors.location}</span>}
                </div>
              </div>

              {/* ── Schedule Builder ── */}
              <div className="adm-sched-block">
                <label className="adm-sched-title">Schedule <span className="adm-req">*</span></label>

                <div className="adm-sched-days">
                  {DAY_LABELS.map((label, i) => (
                    <button key={label} type="button"
                      className={`adm-day-btn${schedDays.includes(DAY_CODES[i]) ? ' active' : ''}`}
                      onClick={() => toggleDay(DAY_CODES[i])}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="adm-sched-times">
                  <span className="adm-sched-lbl">Start</span>
                  <div className="adm-time-group">
                    <input type="number" className="adm-time-inp" value={sH} min={1} max={12}
                      onChange={e => setSH(clampH(+e.target.value))} />
                    <span className="adm-colon">:</span>
                    <input type="number" className="adm-time-inp" value={String(sM).padStart(2,'0')} min={0} max={59}
                      onChange={e => setSM(clampM(+e.target.value))} />
                    <div className="adm-ampm">
                      <button type="button" className={`adm-ampm-btn${sAp==='AM'?' active':''}`} onClick={() => setSAp('AM')}>AM</button>
                      <button type="button" className={`adm-ampm-btn${sAp==='PM'?' active':''}`} onClick={() => setSAp('PM')}>PM</button>
                    </div>
                  </div>
                  <span className="adm-sched-lbl">End</span>
                  <div className="adm-time-group">
                    <input type="number" className="adm-time-inp" value={eH} min={1} max={12}
                      onChange={e => setEH(clampH(+e.target.value))} />
                    <span className="adm-colon">:</span>
                    <input type="number" className="adm-time-inp" value={String(eM).padStart(2,'0')} min={0} max={59}
                      onChange={e => setEM(clampM(+e.target.value))} />
                    <div className="adm-ampm">
                      <button type="button" className={`adm-ampm-btn${eAp==='AM'?' active':''}`} onClick={() => setEAp('AM')}>AM</button>
                      <button type="button" className={`adm-ampm-btn${eAp==='PM'?' active':''}`} onClick={() => setEAp('PM')}>PM</button>
                    </div>
                  </div>
                </div>

                {schedPreview && (
                  <div className="adm-sched-preview">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {schedPreview}
                  </div>
                )}
                {errors.schedule && <span className="adm-err">{errors.schedule}</span>}
              </div>

              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Campus</label>
                  <select value={formData.campus} onChange={e => set('campus', e.target.value)}>
                    <option>Fairfax</option><option>Arlington</option>
                    <option>Science and Tech</option><option>Online</option>
                  </select>
                </div>
                <div className="adm-field">
                  <label>Modality</label>
                  <select value={formData.modality} onChange={e => set('modality', e.target.value)}>
                    <option>In-Person</option><option>Online</option><option>Hybrid</option>
                  </select>
                </div>
                <div className="adm-field">
                  <label>Credits</label>
                  <input type="number" min="1" max="12" value={formData.credits || 3} onChange={e => set('credits', +e.target.value)} />
                </div>
                <div className="adm-field">
                  <label>Total Seats</label>
                  <input type="number" min="1" value={formData.seats || 50} onChange={e => set('seats', +e.target.value)} />
                </div>
                <div className="adm-field">
                  <label>Available Seats</label>
                  <input type="number" min="0" value={formData.seatsAvailable || 50} onChange={e => set('seatsAvailable', +e.target.value)} />
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-field">
                  <label>Card Color</label>
                  <div className="adm-color-row">
                    {PRESET_COLORS.map(c => (
                      <button key={c} type="button"
                        className={`adm-color-swatch${formData.color === c ? ' active' : ''}`}
                        style={{ background: c }} onClick={() => set('color', c)} />
                    ))}
                    <input type="color" className="adm-color-custom"
                      value={formData.color || '#16A085'} onChange={e => set('color', e.target.value)} title="Custom color" />
                  </div>
                </div>
                <div className="adm-field adm-field--wide">
                  <label>Description</label>
                  <textarea placeholder="Optional course description…" value={formData.description || ''} onChange={e => set('description', e.target.value)} rows={2} />
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="adm-btn-save" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="adm-confirm">
            <div className="adm-confirm-icon">🗑️</div>
            <h3>Delete this course?</h3>
            <p>This action cannot be undone. The course will be permanently removed.</p>
            <div className="adm-confirm-actions">
              <button className="adm-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="adm-btn-delete" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;