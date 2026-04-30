import React, { useState } from 'react';
import { Course, ScheduledCourse } from '../types';
import ScheduleCalendar from './ScheduleCalendar';
import CourseListView from './CourseListView';

interface MainContentProps {
  courses: Course[];
  scheduledCourses: ScheduledCourse[];
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (courseId: string) => void;
  totalCredits: number;
}

const MainContent: React.FC<MainContentProps> = ({
  scheduledCourses,
  onRemoveCourse,
  totalCredits,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

  return (
    <section className="main-content">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Calendar
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          My Courses
          {scheduledCourses.length > 0 && (
            <span className="tab-badge">{scheduledCourses.length}</span>
          )}
        </button>
      </div>

      <div className={`tab-panel ${activeTab === 'calendar' ? 'active' : ''}`}>
        <ScheduleCalendar
          scheduledCourses={scheduledCourses}
          onRemoveCourse={onRemoveCourse}
          totalCredits={totalCredits}
        />
      </div>

      <div className={`tab-panel ${activeTab === 'list' ? 'active' : ''}`}>
        <CourseListView
          scheduledCourses={scheduledCourses}
          onRemoveCourse={onRemoveCourse}
          totalCredits={totalCredits}
        />
      </div>
    </section>
  );
};

export default MainContent;
