export interface Course {
  id: string;
  code: string;
  title: string;
  crn: string;
  professor: string;
  schedule: string;
  location: string;
  campus: 'Fairfax' | 'Arlington' | 'Science and Tech' | 'Online';
  credits: number;
  modality: 'In-Person' | 'Online' | 'Hybrid';
  seats: number;
  seatsAvailable: number;
  color: string;
  description?: string;
  prerequisites?: string;
  corequisites?: string;
}

export interface ScheduledCourse extends Course {
  addedAt: number;
}

export interface FilterState {
  searchQuery: string;
  startTime: number | null;
  endTime: number | null;
  selectedDays: string[];
  modality: string;
  campus: string;
  sortBy: string;
}
