export function currentMonthKey() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
}

export function normalizeMonthKey(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{4}-\d{2}-01$/.test(raw)) return currentMonthKey();

  const [year, month] = raw.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1
  ) {
    return currentMonthKey();
  }

  return raw;
}

export function monthDate(monthKey: string) {
  const [year, month] = normalizeMonthKey(monthKey).split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function shiftMonthKey(monthKey: string, offset: number) {
  const date = monthDate(monthKey);
  date.setMonth(date.getMonth() + offset);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-01';
}

export function isInMonth(value: string, monthKey: string) {
  const date = new Date(value);
  const selected = monthDate(monthKey);
  return (
    date.getFullYear() === selected.getFullYear() &&
    date.getMonth() === selected.getMonth()
  );
}

export function monthLabel(monthKey: string, includeYear = true) {
  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  }).format(monthDate(monthKey));
}

export function isCurrentMonthKey(monthKey: string) {
  return normalizeMonthKey(monthKey) === currentMonthKey();
}

export function editableDateTime(value: string) {
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function parseEditableDateTime(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  const date = new Date(year, month - 1, day, hour, minute);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}
