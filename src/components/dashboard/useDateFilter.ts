import { useMemo } from 'react';

const RECENT_DAYS = 21;

export function useDateFilter<T extends { data: string }>(data: T[]) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    [data],
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - RECENT_DAYS);
    cutoff.setHours(0, 0, 0, 0);

    return sorted.filter(entry => {
      const d = new Date(`${entry.data}T00:00:00`);
      return d >= cutoff;
    });
  }, [sorted]);

  return { allData: sorted, recentData: filtered, recentDays: RECENT_DAYS };
}
