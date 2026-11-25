import { dateTime } from '../format';

export interface PresenceInterval {
  start: number;
  end?: number;
}

export interface PresenceRibbonProps {
  intervals: PresenceInterval[];
  from: number;
  to: number;
  height?: number;
}

export function PresenceRibbon({ intervals, from, to, height = 8 }: PresenceRibbonProps) {
  const duration = to - from;
  const spans =
    duration > 0
      ? intervals
          .map((i) => ({ start: Math.max(from, i.start), end: Math.min(to, i.end ?? to) }))
          .filter((i) => i.end > i.start)
          .sort((a, b) => a.start - b.start)
      : [];
  const online: typeof spans = [];
  for (const span of spans) {
    const last = online[online.length - 1];
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else online.push({ ...span });
  }
  const total = online.reduce((n, i) => n + i.end - i.start, 0);
  return (
    <div
      role="img"
      aria-label={
        duration > 0
          ? `所选时段内 ${Math.round(Math.min(100, (total / duration) * 100))}% 时间在线`
          : '暂无数据'
      }
      style={{
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${height / 2}px`,
        background: 'var(--chart-grid)',
      }}
    >
      {online.map((i, index) => (
        <span
          key={index}
          title={`${dateTime(i.start)} 至 ${dateTime(i.end)}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${((i.start - from) / duration) * 100}%`,
            width: `${((i.end - i.start) / duration) * 100}%`,
            background: 'var(--success)',
          }}
        />
      ))}
    </div>
  );
}
