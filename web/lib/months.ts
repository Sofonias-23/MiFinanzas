export function currentMonthKey() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
}

export function normalizeMonthKey(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-01$/.test(value)) return currentMonthKey();

  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1
  ) {
    return currentMonthKey();
  }

  return value;
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
