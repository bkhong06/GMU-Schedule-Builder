import React, { useState, useEffect } from 'react';
import { ScheduledCourse } from '../types';
import { parseSchedule } from '../utils';

interface ScheduleCalendarProps {
  scheduledCourses: ScheduledCourse[];
  onRemoveCourse: (courseId: string) => void;
  totalCredits: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_CODES = ['M', 'T', 'W', 'R', 'F'];

// Grid constants — must match CSS variables
const ROW_H = 30;    // --row-h: 30px  (each row = 30 minutes)
const START_HOUR = 6; // 6 AM baseline

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  scheduledCourses,
  onRemoveCourse,
}) => {
  // Live clock — updates every 30 seconds so the line moves smoothly
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const times = Array.from({ length: 17 }, (_, i) => {
    const hour = START_HOUR + i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${ampm}`;
  });

  // -------------------------------------------------------------------
  // Event grid positioning — uses Math.round so 10:30 AM hits the
  // correct half-hour row instead of snapping to the nearest hour.
  // -------------------------------------------------------------------
  const getEventGridPosition = (course: ScheduledCourse, dayIdx: number) => {
    const parsed = parseSchedule(course.schedule);
    if (!parsed.startMin || !parsed.endMin || parsed.isOnline) return null;

    const startRow = Math.round((parsed.startMin - START_HOUR * 60) / 30) + 1;
    const endRow   = Math.round((parsed.endMin   - START_HOUR * 60) / 30) + 1;

    return {
      gridColumn: dayIdx + 2,
      gridRowStart: startRow,
      gridRowEnd: endRow,
    };
  };

  // -------------------------------------------------------------------
  // Current-time line — pixel-precise, NOT snapped to grid rows.
  // We calculate the exact pixel offset from the top of the grid so
  // the red ball sits at the exact minute, not the nearest 30-min slot.
  // -------------------------------------------------------------------
  const getTimeLineTop = (): number | null => {
    const hours   = now.getHours();
    const minutes = now.getMinutes();

    if (hours < START_HOUR || hours >= 23) return null;

    const totalMinutes = hours * 60 + minutes;
    // Pixels from the top of the grid
    return ((totalMinutes - START_HOUR * 60) / 30) * ROW_H;
  };

  // -------------------------------------------------------------------
  // Today detection — 0 = Sunday, 6 = Saturday → map to Mon–Fri index
  // -------------------------------------------------------------------
  const getTodayIndex = (): number => {
    const day = new Date().getDay(); // 0=Sun,1=Mon…5=Fri,6=Sat
    if (day === 0 || day === 6) return -1; // weekend
    return day - 1; // Mon=0 … Fri=4
  };

  const todayIdx   = getTodayIndex();
  const timeLineTop = getTimeLineTop();

  return (
    <div className="schedule-scroll">
      <div className="grid-wrapper" style={{ position: 'relative' }}>
        {/* Time Gutter */}
        <div className="time-gutter">
          {times.map((time, idx) => (
            <div key={idx} className="time-label" style={{ top: `${idx * 60}px` }}>
              {time}
            </div>
          ))}
        </div>

        {/* Day column backgrounds — today gets the .today class */}
        {DAYS.map((_, dayIdx) => (
          <div
            key={dayIdx}
            className={`day-col-bg${dayIdx === todayIdx ? ' today' : ''}`}
            style={{ gridColumn: dayIdx + 2 }}
          />
        ))}

        {/* Course event blocks */}
        {scheduledCourses.map(course => {
          const parsed = parseSchedule(course.schedule);
          const dayIndices: number[] = [];
          
          parsed.days.forEach(day => {
            const idx = DAY_CODES.indexOf(day);
            if (idx !== -1) dayIndices.push(idx);
          });

          return dayIndices.map(dayIdx => {
            const pos = getEventGridPosition(course, dayIdx);
            if (!pos) return null;

            return (
              <div
                key={`${course.id}-${dayIdx}`}
                className="event"
                style={{
                  background: course.color,
                  ...pos,
                }}
                onClick={() => {
                  if (window.confirm(`Remove ${course.code} from your schedule?`)) {
                    onRemoveCourse(course.id);
                  }
                }}
              >
                <strong>{course.code}</strong>
                <span>{course.schedule}</span>
              </div>
            );
          });
        })}

        {/* Horizontal grid lines */}
        <div className="h-lines">
          {Array.from({ length: 34 }).map((_, idx) => (
            <span key={idx} />
          ))}
        </div>

        {/* ── Current-time indicator ────────────────────────────────────
            Absolutely positioned so it sits at the *exact* pixel for
            the current minute, spanning all 5 day columns.
            The red dot (::before) is on the left edge of column 2.
        ─────────────────────────────────────────────────────────────── */}
        {timeLineTop !== null && (
          <div
            className="current-time-line"
            style={{
              position: 'absolute',
              top: `${timeLineTop}px`,
              // Stretch from the start of column 2 to the end of column 6.
              // Column 1 (time gutter) is var(--time-gutter) = 64px wide.
              left: 'var(--time-gutter)',
              right: 0,
              height: '2px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ScheduleCalendar;