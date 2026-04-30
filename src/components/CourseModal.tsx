import React from 'react';
import { Course } from '../types';

interface CourseModalProps {
  course: Course;
  onClose: () => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ course, onClose }) => {
  return (
    <div className="modal-overlay show">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-course-title">{course.code}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>
            {course.title}
          </h3>
          <div className="modal-meta">
            <span>{course.credits} Credits</span> • <span>{course.modality}</span>
          </div>
          <p className="modal-desc">
            {course.description || 'No description available.'}
          </p>
          <div className="modal-section">
            <strong>Professor:</strong>
            <p>{course.professor}</p>
          </div>
          <div className="modal-section">
            <strong>Schedule:</strong>
            <p>{course.schedule}</p>
          </div>
          <div className="modal-section">
            <strong>Location:</strong>
            <p>{course.location}</p>
          </div>
          <div className="modal-section">
            <strong>CRN:</strong>
            <p>{course.crn}</p>
          </div>
          <div className="modal-section">
            <strong>Seats Available:</strong>
            <p>
              {course.seatsAvailable} / {course.seats}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
