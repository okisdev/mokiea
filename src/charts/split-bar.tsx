import { chartColor } from './color';

export interface SplitBarProps {
  parts: { label: string; value: number; color?: string }[];
  max?: number;
  format?: (value: number) => string;
}

export function SplitBar({
  parts,
  max,
  format = (n) => n.toLocaleString(),
}: SplitBarProps) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  const scale = Math.max(1, max ?? total, total);
  return (
    <div
      role="img"
      aria-label={parts.map((part) => `${part.label} ${format(part.value)}`).join('，')}
    >
      <div
        style={{
          display: 'flex',
          overflow: 'hidden',
          height: '8px',
          borderRadius: '5px',
          background: 'var(--chart-grid)',
        }}
      >
        {parts.map((part, index) => (
          <span
            key={index}
            style={{
              width: `${(Math.max(0, part.value) / scale) * 100}%`,
              background: part.color ?? chartColor(String(index), index),
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '7px',
          color: 'var(--fg-3)',
          fontSize: '11px',
        }}
      >
        {parts.map((part, index) => (
          <span key={index}>
            <b style={{ color: part.color ?? chartColor(String(index), index) }}>●</b> {part.label} {format(part.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
