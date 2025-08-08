import { getISOWeek } from 'date-fns';

export interface CalendarDayCell {
  date: Date | null; // null for blank
  day: number | null; // 1..31 or null
  inMonth: boolean;
  isoWeek?: number; // for first day of week if needed
}

export interface MonthGridResult {
  weeks: CalendarDayCell[][]; // 6 weeks x 7 days
  year: number;
  month: number; // 0-based
}

// Generate a month grid with blanks for leading / trailing days (no spillover days numbers unless inMonth true)
export function generateMonthGrid(year: number, month: number): MonthGridResult {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: CalendarDayCell[][] = [];
  let dayCounter = 1;
  for (let w = 0; w < 6; w++) {
    const week: CalendarDayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellIndex = w * 7 + d;
      if (cellIndex < firstWeekday || dayCounter > daysInMonth) {
        week.push({ date: null, day: null, inMonth: false });
      } else {
        const date = new Date(year, month, dayCounter);
        week.push({ date, day: dayCounter, inMonth: true });
        dayCounter++;
      }
    }
    weeks.push(week);
  }
  return { weeks, year, month };
}

export function isoWeekNumber(date: Date): number { return getISOWeek(date); }
