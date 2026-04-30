import React from 'react';
import { ScheduledCourse } from '../types';

interface CourseListViewProps {
  scheduledCourses: ScheduledCourse[];
  onRemoveCourse: (courseId: string) => void;
  totalCredits: number;
}

const getCampusBadgeClass = (campus: string): string => {
  if (campus === 'Arlington') return 'arlington';
  if (campus === 'Science and Tech') return 'scitech';
  if (campus === 'Online') return 'online-campus';
  return 'fairfax';
};

const getCampusLabel = (campus: string): string => {
  if (campus === 'Science and Tech') return 'Sci-Tech';
  return campus;
};

const CourseListView: React.FC<CourseListViewProps> = ({
  scheduledCourses,
  onRemoveCourse,
  totalCredits,
}) => {
  const creditWarningColor = totalCredits > 18 ? '#b91c1c' : 'var(--green)';

  return (
    <div className="list-view">
      {scheduledCourses.length === 0 ? (
        <div className="list-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>No courses added yet</h3>
          <p>
            Search for classes on the left and click <strong>Add</strong> to build your schedule.
          </p>
        </div>
      ) : (
        <>
          <table className="list-table show">
            <thead>
              <tr>
                <th className="lt-color">
                  <span style={{ width: '6px', height: '100%', display: 'block' }} />
                </th>
                <th className="lt-course">Course</th>
                <th className="lt-title">Title</th>
                <th className="lt-crn">CRN</th>
                <th className="lt-prof">Professor</th>
                <th className="lt-schedule">Schedule</th>
                <th className="lt-location">Location</th>
                <th className="lt-credits">Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scheduledCourses.map(course => (
                <tr key={course.id}>
                  <td className="lt-color">
                    <div className="lt-dot" style={{ background: course.color }} />
                  </td>
                  <td className="lt-course">{course.code}</td>
                  <td className="lt-title">{course.title}</td>
                  <td className="lt-crn">{course.crn}</td>
                  <td className="lt-prof">{course.professor}</td>
                  <td className="lt-schedule">
                    {course.schedule === 'Online' ? (
                      <span className="lt-online-badge">Online</span>
                    ) : (
                      course.schedule
                    )}
                  </td>
                  <td className="lt-location">
                    {course.location}{' '}
                    <span className={`lt-campus-badge ${getCampusBadgeClass(course.campus)}`}>
                      {getCampusLabel(course.campus)}
                    </span>
                  </td>
                  <td className="lt-credits">{course.credits}</td>
                  <td>
                    <button
                      className="btn-remove-list"
                      onClick={() => {
                        if (window.confirm(`Remove ${course.code} from your schedule?`)) {
                          onRemoveCourse(course.id);
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="list-summary show">
            <span>{scheduledCourses.length === 1 ? '1 course' : `${scheduledCourses.length} courses`}</span>
            <span className="list-divider">•</span>
            <span style={{ color: creditWarningColor }}>
              {totalCredits} credits {totalCredits > 18 && '⚠️ Over limit'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseListView;
