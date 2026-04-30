export function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

export function detectCampus(location: string): string {
  if (/arlington|van\s*metre|founders\s*hall|vernon\s*smith|scalia/i.test(location)) {
    return 'Arlington';
  }
  if (/sci\s*tech|science.+tech|bull\s*run|beacon|occoquan/i.test(location)) {
    return 'Science and Tech';
  }
  return 'Fairfax';
}

export function isOnlineCourse(schedule: string, location: string): boolean {
  return /distance|online|asynchronous/i.test(schedule + ' ' + location);
}

export function parseSchedule(scheduleStr: string) {
  if (isOnlineCourse(scheduleStr, '')) {
    return { days: [], startMin: null, endMin: null, isOnline: true };
  }

  const match = scheduleStr.match(/^([MTWRF]+)\s+(.+)$/i);
  if (!match) return { days: [], startMin: null, endMin: null, isOnline: false };

  const days = match[1].toUpperCase().split('');
  const timeRange = match[2];
  const times = timeRange.split(/[–\-]/).map(t => t.trim());

  return {
    days,
    startMin: parseTime(times[0]),
    endMin: parseTime(times[1]),
    isOnline: false,
  };
}

export function gridRow(timeStr: string): number {
  const timeInMinutes = parseTime(timeStr);
  if (timeInMinutes === null) return 0;
  return Math.round((timeInMinutes - 360) / 30) + 1;
}
