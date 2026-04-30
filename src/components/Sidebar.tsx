import React, { useState, useMemo } from 'react';
import { Course, ScheduledCourse, FilterState } from '../types';
import CourseCard from './CourseCard';
import FilterDropdown from './FilterDropdown';
import { parseSchedule } from '../utils';

interface SidebarProps {
  courses: Course[];
  loading: boolean;
  onAddCourse: (course: Course) => void;
  scheduledCourses: ScheduledCourse[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const DAY_CODE_MAP: Record<string, string> = {
  Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'Th', Friday: 'F',
};

const Sidebar: React.FC<SidebarProps> = ({
  courses,
  loading,
  onAddCourse,
  scheduledCourses,
  filters,
  onFiltersChange,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredCourses = useMemo(() => {
    let result = courses;

    // Search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.professor.toLowerCase().includes(q)
      );
    }

    // Modality
    if (filters.modality !== 'Select...') {
      result = result.filter(c => c.modality === filters.modality);
    }

    // Campus
    if (filters.campus !== 'Select...') {
      result = result.filter(c => c.campus === filters.campus);
    }

    // Days filter
    if (filters.selectedDays.length > 0) {
      result = result.filter(c => {
        const parsed = parseSchedule(c.schedule);
        if (!parsed.days.length) return false;
        // Course must run on ALL selected days
        return filters.selectedDays.every(day => {
          const code = DAY_CODE_MAP[day];
          return parsed.days.includes(code);
        });
      });
    }

    // Start time filter — course must start at or after the filter startTime
    if (filters.startTime !== null) {
      result = result.filter(c => {
        const parsed = parseSchedule(c.schedule);
        if (parsed.startMin === null) return false;
        return parsed.startMin >= filters.startTime!;
      });
    }

    // End time filter — course must end at or before the filter endTime
    if (filters.endTime !== null) {
      result = result.filter(c => {
        const parsed = parseSchedule(c.schedule);
        if (parsed.endMin === null) return false;
        return parsed.endMin <= filters.endTime!;
      });
    }

    // Sort
    if (filters.sortBy !== 'Sort by') {
      result = [...result].sort((a, b) => {
        if (filters.sortBy === 'Course #') return a.code.localeCompare(b.code);
        if (filters.sortBy === 'Professor') return a.professor.localeCompare(b.professor);
        if (filters.sortBy === 'Time') return a.schedule.localeCompare(b.schedule);
        return 0;
      });
    }

    return result;
  }, [courses, filters]);

  // Count active filters (excluding search and sort)
  const filterCount = [
    filters.modality !== 'Select...' ? 1 : 0,
    filters.campus !== 'Select...' ? 1 : 0,
    filters.selectedDays.length > 0 ? 1 : 0,
    filters.startTime !== null ? 1 : 0,
    filters.endTime !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <aside className="sidebar">
      <div className="search-group">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search classes, professors..."
            value={filters.searchQuery}
            onChange={e => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>
        <button
          className={`btn-filter${filterCount > 0 ? ' active' : ''}`}
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Filter
          {filterCount > 0 && <span className="filter-badge">{filterCount}</span>}
        </button>

        {showFilterDropdown && (
          <FilterDropdown
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClose={() => setShowFilterDropdown(false)}
          />
        )}
      </div>

      <div className="results-bar">
        <span className="results-count">{filteredCourses.length} sections found</span>
        <select
          className="sort-select"
          value={filters.sortBy}
          onChange={e => onFiltersChange({ ...filters, sortBy: e.target.value })}
        >
          <option>Sort by</option>
          <option>Course #</option>
          <option>Professor</option>
          <option>Time</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>Loading courses...</div>
      ) : (
        <ul className="card-list">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onAdd={onAddCourse}
              isAdded={!!scheduledCourses.find(c => c.id === course.id)}
            />
          ))}
          {filteredCourses.length === 0 && (
            <li className="empty-state show">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#bbb" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No sections match your filters</p>
              <span>Try adjusting your search or filters</span>
            </li>
          )}
        </ul>
      )}
    </aside>
  );
};

export default Sidebar;