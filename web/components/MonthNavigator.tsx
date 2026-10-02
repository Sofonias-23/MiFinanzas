'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  currentMonthKey,
  isCurrentMonthKey,
  monthLabel,
  shiftMonthKey,
} from '@/lib/months';

type Props = {
  month: string;
};

export default function MonthNavigator({ month }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextMonth === currentMonthKey()) params.delete('month');
    else params.set('month', nextMonth);

    const query = params.toString();
    router.replace(query ? pathname + '?' + query : pathname);
  }

  const previousMonth = shiftMonthKey(month, -1);
  const nextMonth = shiftMonthKey(month, 1);
  const disableNext = isCurrentMonthKey(month);

  return (
    <div className="monthNavigator" aria-label="Seleccionar mes">
      <button
        type="button"
        className="monthNavArrow"
        onClick={() => goTo(previousMonth)}
        aria-label={'Ver ' + monthLabel(previousMonth)}
      >
        ←
      </button>

      <div className="monthNavCurrent">
        <span>Periodo</span>
        <strong>{monthLabel(month)}</strong>
      </div>

      <button
        type="button"
        className="monthNavArrow"
        onClick={() => goTo(nextMonth)}
        disabled={disableNext}
        aria-label={disableNext ? 'Ya estás en el mes actual' : 'Ver ' + monthLabel(nextMonth)}
      >
        →
      </button>
    </div>
  );
}
