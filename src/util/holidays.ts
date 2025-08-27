// US Federal holidays utilities (actual calendar dates, not observed substitutions).
// Functions return a map of ISO date (YYYY-MM-DD) -> holiday name.
// Observed-date shifting (e.g., Monday if holiday on Sunday) can be layered later if needed.

function pad(n: number) { return String(n).padStart(2,'0'); }

function nthWeekdayOfMonth(year: number, month0: number, weekday: number, nth: number): Date {
  const firstWeekday = new Date(year, month0, 1).getDay();
  const offset = (7 + weekday - firstWeekday) % 7; // days from day 1 to first desired weekday
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(year, month0, day);
}

function lastWeekdayOfMonth(year: number, month0: number, weekday: number): Date {
  const last = new Date(year, month0 + 1, 0); // last day in month
  const back = (7 + last.getDay() - weekday) % 7;
  return new Date(year, month0, last.getDate() - back);
}

export function getUsFederalHolidays(year: number): Record<string,string> {
  const map: Record<string,string> = {};
  const add = (d: Date, name: string) => {
    const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    map[iso] = name;
  };
  add(new Date(year,0,1), "New Year's Day");
  add(nthWeekdayOfMonth(year,0,1,3), 'Martin Luther King Jr. Day'); // 3rd Monday Jan
  add(nthWeekdayOfMonth(year,1,1,3), 'Presidents Day'); // 3rd Monday Feb
  add(lastWeekdayOfMonth(year,4,1), 'Memorial Day'); // Last Monday May
  add(new Date(year,5,19), 'Juneteenth');
  add(new Date(year,6,4), 'Independence Day');
  add(nthWeekdayOfMonth(year,8,1,1), 'Labor Day'); // 1st Monday Sep
  add(nthWeekdayOfMonth(year,9,1,2), 'Columbus Day'); // 2nd Monday Oct
  add(new Date(year,10,11), 'Veterans Day');
  add(nthWeekdayOfMonth(year,10,4,4), 'Thanksgiving Day'); // 4th Thursday Nov
  add(new Date(year,11,25), 'Christmas Day');
  return map;
}

export function collectHolidayMap(startMonth0: number, startYear: number, months: number): Record<string,string> {
  const endOffset = startMonth0 + months - 1;
  const endYear = startYear + Math.floor(endOffset / 12);
  const all: Record<string,string> = {};
  for (let y = startYear; y <= endYear; y++) Object.assign(all, getUsFederalHolidays(y));
  const startDate = new Date(startYear, startMonth0, 1);
  const endDate = new Date(startYear, startMonth0 + months, 0);
  const filtered: Record<string,string> = {};
  for (const iso of Object.keys(all)) {
    const [yy, mm, dd] = iso.split('-').map(Number);
    const dt = new Date(yy!, mm!-1, dd!);
    if (dt >= startDate && dt <= endDate) filtered[iso] = all[iso];
  }
  return filtered;
}
