import { Course, ScheduledCourse } from '../types';
import { parseSchedule, isOnlineCourse } from '../utils';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Represents a parsed course schedule with timing information
 */
export interface ParsedSchedule {
  days: string[];
  startMin: number | null;
  endMin: number | null;
  isOnline: boolean;
}

/**
 * Represents a time slot conflict between two courses
 */
export interface ScheduleConflict {
  course1: ScheduledCourse;
  course2: ScheduledCourse;
  conflictReason: string;
}

/**
 * Detects conflicts between course schedules
 */
export class ScheduleConflictDetector {
  /**
   * Check if two courses have overlapping schedules
   */
  static hasConflict(course1: ScheduledCourse, course2: ScheduledCourse): boolean {
    // Online courses don't conflict with anything
    if (isOnlineCourse(course1.schedule, course1.location) || 
        isOnlineCourse(course2.schedule, course2.location)) {
      return false;
    }

    const schedule1 = parseSchedule(course1.schedule);
    const schedule2 = parseSchedule(course2.schedule);

    // If either is online, no conflict
    if (schedule1.isOnline || schedule2.isOnline) {
      return false;
    }

    // Check if they share any days
    const commonDays = schedule1.days.filter(day => schedule2.days.includes(day));
    if (commonDays.length === 0) {
      return false;
    }

    // Check if times overlap
    if (schedule1.startMin === null || schedule1.endMin === null ||
        schedule2.startMin === null || schedule2.endMin === null) {
      return false;
    }

    // Times overlap if: start1 < end2 AND start2 < end1
    const timesOverlap = schedule1.startMin < schedule2.endMin && 
                         schedule2.startMin < schedule1.endMin;

    return timesOverlap;
  }

  /**
   * Find all conflicts in a schedule
   */
  static findAllConflicts(courses: ScheduledCourse[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        if (this.hasConflict(courses[i], courses[j])) {
          conflicts.push({
            course1: courses[i],
            course2: courses[j],
            conflictReason: `${courses[i].code} and ${courses[j].code} overlap in schedule`,
          });
        }
      }
    }

    return conflicts;
  }
}

/**
 * Manages user's course schedule with persistence
 */
export class CourseSchedule {
  private courses: ScheduledCourse[];
  private userId: string;
  private localStorageKey: string;

  constructor(userId: string, courses: ScheduledCourse[] = []) {
    this.userId = userId;
    this.localStorageKey = `gm_schedule_${userId}`;
    this.courses = courses;
  }

  /**
   * Get all scheduled courses
   */
  getCourses(): ScheduledCourse[] {
    return [...this.courses];
  }

  /**
   * Add a course to the schedule with conflict detection
   */
  addCourse(course: Course): { success: boolean; conflict?: ScheduleConflict } {
    // Check if course already exists
    if (this.courses.find(c => c.id === course.id)) {
      return { success: false, conflict: undefined };
    }

    const newScheduledCourse: ScheduledCourse = {
      ...course,
      addedAt: Date.now(),
    };

    // Check for conflicts
    const conflicts = ScheduleConflictDetector.findAllConflicts([
      ...this.courses,
      newScheduledCourse,
    ]);

    if (conflicts.length > 0) {
      return {
        success: false,
        conflict: conflicts[0],
      };
    }

    this.courses.push(newScheduledCourse);
    return { success: true };
  }

  /**
   * Remove a course from the schedule
   */
  removeCourse(courseId: string): boolean {
    const initialLength = this.courses.length;
    this.courses = this.courses.filter(c => c.id !== courseId);
    return this.courses.length < initialLength;
  }

  /**
   * Get current conflicts in the schedule
   */
  getConflicts(): ScheduleConflict[] {
    return ScheduleConflictDetector.findAllConflicts(this.courses);
  }

  /**
   * Check if a course can be added without conflicts
   */
  canAddCourse(course: Course): boolean {
    const newScheduledCourse: ScheduledCourse = {
      ...course,
      addedAt: Date.now(),
    };

    const conflicts = ScheduleConflictDetector.findAllConflicts([
      ...this.courses,
      newScheduledCourse,
    ]);

    return conflicts.length === 0;
  }

  /**
   * Get total credits
   */
  getTotalCredits(): number {
    return this.courses.reduce((sum, c) => sum + c.credits, 0);
  }

  /**
   * Save to localStorage (synchronous, fast)
   */
  saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        this.localStorageKey,
        JSON.stringify(
          this.courses.map(c => ({ id: c.id, addedAt: c.addedAt }))
        )
      );
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  /**
   * Load from localStorage
   */
  static loadFromLocalStorage(
    userId: string,
    allCourses: Course[]
  ): ScheduledCourse[] {
    try {
      const key = `gm_schedule_${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];

      const saved = JSON.parse(raw) as { id: string; addedAt: number }[];
      return saved
        .map(s => {
          const course = allCourses.find(x => x.id === s.id);
          return course ? { ...course, addedAt: s.addedAt } : null;
        })
        .filter(Boolean) as ScheduledCourse[];
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      return [];
    }
  }

  /**
   * Save to Firestore (asynchronous, cross-device sync)
   */
  async saveToFirestore(): Promise<boolean> {
    try {
      await setDoc(doc(db, 'userSchedules', this.userId), {
        courseIds: this.courses.map(c => c.id),
        addedAt: Object.fromEntries(this.courses.map(c => [c.id, c.addedAt])),
        updatedAt: Date.now(),
      });
      return true;
    } catch (e) {
      console.warn('Failed to save to Firestore:', e);
      return false;
    }
  }

  /**
   * Load from Firestore
   */
  static async loadFromFirestore(
    userId: string,
    allCourses: Course[]
  ): Promise<ScheduledCourse[]> {
    try {
      const schedSnap = await getDoc(doc(db, 'userSchedules', userId));
      if (!schedSnap.exists()) {
        return [];
      }

      const data = schedSnap.data() as {
        courseIds: string[];
        addedAt: Record<string, number>;
      };

      const entries = (data.courseIds || []).map(id => ({
        id,
        addedAt: data.addedAt?.[id] ?? Date.now(),
      }));

      return entries
        .map(s => {
          const course = allCourses.find(x => x.id === s.id);
          return course ? { ...course, addedAt: s.addedAt } : null;
        })
        .filter(Boolean) as ScheduledCourse[];
    } catch (e) {
      console.warn('Failed to load from Firestore:', e);
      return [];
    }
  }
}

/**
 * Service for managing course data and schedule operations
 */
export class ScheduleService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Load all courses from Firestore or use defaults
   */
  static async loadAllCourses(defaultCourses: Course[]): Promise<Course[]> {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      if (snap.size > 0) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      }
    } catch (e) {
      console.warn('Failed to load courses from Firestore:', e);
    }
    return defaultCourses;
  }

  /**
   * Initialize user schedule from storage sources
   */
  async initializeSchedule(allCourses: Course[]): Promise<CourseSchedule> {
    // Load from both sources
    const lsEntries = CourseSchedule.loadFromLocalStorage(this.userId, allCourses);
    const fsEntries = await CourseSchedule.loadFromFirestore(this.userId, allCourses);

    // Use whichever has more entries (Firestore wins on tie for cross-device sync)
    const entries = fsEntries.length >= lsEntries.length ? fsEntries : lsEntries;

    const schedule = new CourseSchedule(this.userId, entries);
    
    // Keep localStorage in sync
    schedule.saveToLocalStorage();

    return schedule;
  }

  /**
   * Get the user ID
   */
  getUserId(): string {
    return this.userId;
  }
}

/**
 * Generates a stable anonymous user ID
 */
export function getOrCreateUserId(): string {
  const key = 'gm_planner_uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, uid);
  }
  return uid;
}
