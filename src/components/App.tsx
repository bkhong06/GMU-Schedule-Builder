import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Course, ScheduledCourse, FilterState } from '../types';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import AdminPanel from './AdminPanel';
import '../styles.css';
import {
  ScheduleService,
  CourseSchedule,
  ScheduleConflict,
  getOrCreateUserId,
} from '../services/ScheduleService';

const SAMPLE_COURSES: Course[] = [
  {
    id: '1',
    code: 'IT 104',
    title: 'Introduction to Computing',
    crn: '12345',
    professor: 'Dr. Smith',
    schedule: 'M T W R 10:00 AM - 11:30 AM',
    location: 'Innovation Hall 201',
    campus: 'Fairfax',
    credits: 3,
    modality: 'In-Person',
    seats: 50,
    seatsAvailable: 5,
    color: '#16A085',
    description: 'Provides a foundation in computing and technology.',
  },
  {
    id: '2',
    code: 'IT 213',
    title: 'Multimedia and Web Design',
    crn: '12346',
    professor: 'Dr. Johnson',
    schedule: 'T R 1:00 PM - 2:30 PM',
    location: 'Tech Center 105',
    campus: 'Fairfax',
    credits: 3,
    modality: 'In-Person',
    seats: 40,
    seatsAvailable: 12,
    color: '#E67E22',
    description: 'Covers multimedia concepts and responsive web design.',
  },
  {
    id: '3',
    code: 'ECON 103',
    title: 'Contemporary Microeconomic Principles',
    crn: '12347',
    professor: 'Dr. Williams',
    schedule: 'Online',
    location: 'Distance Learning',
    campus: 'Online',
    credits: 3,
    modality: 'Online',
    seats: 100,
    seatsAvailable: 85,
    color: '#27AE60',
    description: 'Principles of microeconomics including supply and demand.',
  },
];

const USER_ID = getOrCreateUserId();
const scheduleService = new ScheduleService(USER_ID);

const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(SAMPLE_COURSES);
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
  const [schedule, setSchedule] = useState<CourseSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [conflict, setConflict] = useState<ScheduleConflict | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    startTime: 360,
    endTime: 1380,
    selectedDays: [],
    modality: 'Select...',
    campus: 'Select...',
    sortBy: 'Sort by',
  });

  // Initialize schedule and load courses
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load all courses
        const allCourses = await ScheduleService.loadAllCourses(SAMPLE_COURSES);
        setCourses(allCourses);

        // Initialize user schedule
        const userSchedule = await scheduleService.initializeSchedule(allCourses);
        setSchedule(userSchedule);
        setScheduledCourses(userSchedule.getCourses());
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const addCourseToSchedule = async (course: Course) => {
    if (!schedule) return;

    const result = schedule.addCourse(course);

    if (result.success) {
      setScheduledCourses(schedule.getCourses());
      schedule.saveToLocalStorage();
      await schedule.saveToFirestore();
      setConflict(null);
    } else {
      setConflict(result.conflict || null);
    }
  };

  const removeCourseFromSchedule = async (courseId: string) => {
    if (!schedule) return;

    schedule.removeCourse(courseId);
    setScheduledCourses(schedule.getCourses());
    schedule.saveToLocalStorage();
    await schedule.saveToFirestore();
    setConflict(null);
  };

  const totalCredits = schedule ? schedule.getTotalCredits() : 0;

  return (
    <BrowserRouter basename="/GMU-Schedule-Builder/">
      <div className="app">
        <Header />
        {conflict && (
          <div
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px 16px',
              margin: '0 0 12px 0',
              borderLeft: '4px solid #c33',
              fontSize: '14px',
            }}
          >
            <strong>Schedule Conflict:</strong> {conflict.conflictReason}
            <button
              onClick={() => setConflict(null)}
              style={{
                marginLeft: '12px',
                padding: '4px 8px',
                backgroundColor: 'transparent',
                color: '#c33',
                border: '1px solid #c33',
                cursor: 'pointer',
                borderRadius: '3px',
              }}
            >
              Dismiss
            </button>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              <div className="body">
                <Sidebar
                  courses={courses}
                  loading={loading}
                  onAddCourse={addCourseToSchedule}
                  scheduledCourses={scheduledCourses}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
                <MainContent
                  courses={courses}
                  scheduledCourses={scheduledCourses}
                  onAddCourse={addCourseToSchedule}
                  onRemoveCourse={removeCourseFromSchedule}
                  totalCredits={totalCredits}
                />
              </div>
            }
          />
          <Route path="/admin" element={<AdminPanel onCourseAdded={() => {}} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
