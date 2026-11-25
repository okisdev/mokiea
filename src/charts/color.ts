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

export function chartColor(key: string, index = 0): string {
  if (key === 'other' || key === 'rest') return 'var(--chart-neutral)';
  return `var(${slots[index % slots.length]})`;
}
