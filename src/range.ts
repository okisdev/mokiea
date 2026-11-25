import { dateTime } from './format';

export type RangePreset = '1h' | '6h' | '24h' | 'today' | '7d' | '30d';
/** A preset follows the clock; a custom range is fixed. Times are epoch milliseconds. */
export type Range = { preset: RangePreset } | { from: number; to: number };

const HOUR = 3_600_000;
const SPAN: Record<Exclude<RangePreset, 'today'>, number> = {
  '1h': HOUR,
  '6h': 6 * HOUR,
  '24h': 24 * HOUR,
  '7d': 168 * HOUR,
  '30d': 720 * HOUR,
};

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: '1h', label: '近 1 小时' },
  { value: '6h', label: '近 6 小时' },
  { value: '24h', label: '近 24 小时' },
  { value: 'today', label: '今天' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
];

const isPreset = (value: string | null): value is RangePreset =>
  RANGE_PRESETS.some((preset) => preset.value === value);

export function startOfDay(ms: number) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function resolveRange(range: Range, now = Date.now()): { from: number; to: number } {
  if (!('preset' in range)) return range;
  return { from: range.preset === 'today' ? startOfDay(now) : now - SPAN[range.preset], to: now };
}

export function rangeWindow(range: Range, now = Date.now()) {
  const { from, to } = resolveRange(range, now);
  return { minutes: Math.max(1, Math.ceil((to - from) / 60_000)), from, to };
}

export function sameRange(a: Range, b: Range) {
  return 'preset' in a
    ? 'preset' in b && a.preset === b.preset
    : !('preset' in b) && a.from === b.from && a.to === b.to;
}

export function rangeLabel(range: Range) {
  if ('preset' in range)
    return RANGE_PRESETS.find((preset) => preset.value === range.preset)!.label;
  return `${dateTime(range.from)} 至 ${dateTime(range.to)}`;
}

/** Query parameters that carry a range into a link, so a drill-down opens on the window it came from. */
export function rangeQuery(range: Range): Record<string, string> {
  return 'preset' in range
    ? { range: range.preset }
    : { from: String(range.from), to: String(range.to) };
}

export function rangeFromQuery(query: URLSearchParams): Range | undefined {
  const preset = query.get('range');
  if (isPreset(preset)) return { preset };
  const from = Number(query.get('from'));
  const to = Number(query.get('to'));
  return from > 0 && to > from ? { from, to } : undefined;
}


