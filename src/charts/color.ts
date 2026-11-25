const slots = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
  '--chart-8',
] as const;

/** Semantic keys keep fixed colors; other series take the ramp in order, so the largest series takes the first slot. */
export function chartColor(key: string, index = 0): string {
  if (key === 'down' || key === 'download') return 'var(--chart-down)';
  if (key === 'up' || key === 'upload') return 'var(--chart-up)';
  if (key === 'direct') return 'var(--chart-direct)';
  if (key === 'reject' || key === 'blocked') return 'var(--danger)';
  if (key === 'other' || key === 'rest') return 'var(--chart-neutral)';
  return `var(${slots[index % slots.length]})`;
}
