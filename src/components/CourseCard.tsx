import React, { useState } from 'react';
import { Course } from '../types';
import CourseModal from './CourseModal';

interface CourseCardProps {
  course: Course;
  onAdd: (course: Course) => void;
  isAdded: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onAdd, isAdded }) => {
  const [showModal, setShowModal] = useState(false);

  const seatPercentage = (course.seatsAvailable / course.seats) * 100;
  let seatStatus = 'open';
  if (seatPercentage < 10) seatStatus = 'closed';
  else if (seatPercentage < 25) seatStatus = 'limited';

  return (
    <>
      <li className={`card ${isAdded ? 'added' : ''}`}>
        <span className="card-stripe" style={{ background: course.color }} />
        <div className="card-body">
          <div className="card-head">
            <div>
              <span className="card-badge">{course.code}</span>
              <span className="card-crn">CRN: {course.crn}</span>
            </div>
            <button className="btn-dots" onClick={() => setShowModal(true)} title="Course details">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
          <h3 className="card-title">{course.title}</h3>
          <div className="card-meta">
            <div className="meta-row">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{course.professor}</span>
            </div>
            <div className="meta-row">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
              <span>{course.schedule}</span>
            </div>
            <div className="meta-row">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{course.location}</span>
            </div>
            <div className="meta-row">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11 L12 3 L21 11 L21 21 L3 21 Z" />
              </svg>
              <span>{course.campus}</span>
            </div>
          </div>
          <div className="card-foot">
            <span className={`seats-tag ${seatStatus}`}>
              {course.seatsAvailable} / {course.seats} seats
            </span>
            <button
              className={`btn-add ${isAdded ? 'added-state disabled' : ''}`}
              onClick={() => onAdd(course)}
              disabled={isAdded}
            >
              {isAdded ? (
                <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </li>

      {showModal && <CourseModal course={course} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default CourseCard;
