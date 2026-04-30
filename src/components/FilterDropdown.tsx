import React, { useRef, useEffect } from 'react';
import { FilterState } from '../types';

interface FilterDropdownProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

const DAYS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Convert hours + minutes + ampm → total minutes from midnight
const toMinutes = (h: number, m: number, ampm: 'AM' | 'PM'): number => {
  let hours = h % 12;
  if (ampm === 'PM') hours += 12;
  return hours * 60 + m;
};

// Parse total minutes back to { h, m, ampm }
const fromMinutes = (total: number | null): { h: number; m: number; ampm: 'AM' | 'PM' } => {
  if (total === null) return { h: 8, m: 0, ampm: 'AM' };
  const ampm: 'AM' | 'PM' = total >= 720 ? 'PM' : 'AM';
  const h24 = Math.floor(total / 60);
  const h = h24 % 12 || 12;
  const m = total % 60;
  return { h, m, ampm };
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({ filters, onFiltersChange, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const start = fromMinutes(filters.startTime);
  const end   = fromMinutes(filters.endTime);

  const setStart = (h: number, m: number, ampm: 'AM' | 'PM') =>
    onFiltersChange({ ...filters, startTime: toMinutes(h, m, ampm) });

  const setEnd = (h: number, m: number, ampm: 'AM' | 'PM') =>
    onFiltersChange({ ...filters, endTime: toMinutes(h, m, ampm) });

  const toggleDay = (day: string) => {
    const days = filters.selectedDays.includes(day)
      ? filters.selectedDays.filter(d => d !== day)
      : [...filters.selectedDays, day];
    onFiltersChange({ ...filters, selectedDays: days });
  };

  const handleClear = () => {
    onFiltersChange({
      searchQuery: filters.searchQuery, // keep search
      startTime: 360,
      endTime: 1380,
      selectedDays: [],
      modality: 'Select...',
      campus: 'Select...',
      sortBy: filters.sortBy,
    });
  };

  const clampH = (v: number) => Math.max(1, Math.min(12, v));
  const clampM = (v: number) => Math.max(0, Math.min(59, v));

  return (
    <div className="filter-dropdown show" ref={ref}>

      {/* Clear */}
      <button className="btn-clear-filters" onClick={handleClear}>
        Clear All Filters
      </button>

      {/* Start time */}
      <div className="filter-row">
        <span className="filter-label">Start:</span>
        <div className="time-inputs">
          <input
            type="number"
            className="time-input"
            value={start.h}
            min={1} max={12}
            onChange={e => setStart(clampH(+e.target.value), start.m, start.ampm)}
          />
          <span style={{ fontWeight: 700, color: '#aaa' }}>:</span>
          <input
            type="number"
            className="time-input"
            value={String(start.m).padStart(2, '0')}
            min={0} max={59}
            onChange={e => setStart(start.h, clampM(+e.target.value), start.ampm)}
          />
          <div className="am-pm-toggle">
            <button
              className={`ampm-btn${start.ampm === 'AM' ? ' active' : ''}`}
              onClick={() => setStart(start.h, start.m, 'AM')}
            >AM</button>
            <button
              className={`ampm-btn${start.ampm === 'PM' ? ' active' : ''}`}
              onClick={() => setStart(start.h, start.m, 'PM')}
            >PM</button>
          </div>
        </div>
      </div>

      {/* End time */}
      <div className="filter-row">
        <span className="filter-label">End:</span>
        <div className="time-inputs">
          <input
            type="number"
            className="time-input"
            value={end.h}
            min={1} max={12}
            onChange={e => setEnd(clampH(+e.target.value), end.m, end.ampm)}
          />
          <span style={{ fontWeight: 700, color: '#aaa' }}>:</span>
          <input
            type="number"
            className="time-input"
            value={String(end.m).padStart(2, '0')}
            min={0} max={59}
            onChange={e => setEnd(end.h, clampM(+e.target.value), end.ampm)}
          />
          <div className="am-pm-toggle">
            <button
              className={`ampm-btn${end.ampm === 'AM' ? ' active' : ''}`}
              onClick={() => setEnd(end.h, end.m, 'AM')}
            >AM</button>
            <button
              className={`ampm-btn${end.ampm === 'PM' ? ' active' : ''}`}
              onClick={() => setEnd(end.h, end.m, 'PM')}
            >PM</button>
          </div>
        </div>
      </div>

      {/* Day toggles */}
      <div className="days-container">
        <div className="day-labels">
          {DAYS.map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="day-toggles">
          {DAY_FULL.map(day => (
            <button
              key={day}
              className={`day-btn${filters.selectedDays.includes(day) ? ' active' : ''}`}
              onClick={() => toggleDay(day)}
            />
          ))}
        </div>
      </div>

      {/* Modality */}
      <div className="filter-select-row">
        <span className="filter-label" style={{ width: 'auto', marginBottom: '2px' }}>Modality</span>
        <select
          className="filter-select"
          value={filters.modality}
          onChange={e => onFiltersChange({ ...filters, modality: e.target.value })}
        >
          <option>Select...</option>
          <option>In-Person</option>
          <option>Online</option>
          <option>Hybrid</option>
        </select>
      </div>

      {/* Campus */}
      <div className="filter-select-row">
        <span className="filter-label" style={{ width: 'auto', marginBottom: '2px' }}>Campus</span>
        <select
          className="filter-select"
          value={filters.campus}
          onChange={e => onFiltersChange({ ...filters, campus: e.target.value })}
        >
          <option>Select...</option>
          <option>Fairfax</option>
          <option>Arlington</option>
          <option>Science and Tech</option>
          <option>Online</option>
        </select>
      </div>

    </div>
  );
};

export default FilterDropdown;