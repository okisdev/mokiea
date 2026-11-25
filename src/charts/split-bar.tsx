export interface SplitBarProps {
  inValue: number;
  outValue: number;
  max?: number;
  format?: (value: number) => string;
}

export function SplitBar({
  inValue,
  outValue,
  max,
  format = (n) => n.toLocaleString(),
}: SplitBarProps) {
  const down = Math.max(0, inValue);
  const up = Math.max(0, outValue);
  const scale = Math.max(1, max ?? down + up, down + up);
  return (
    <div role="img" aria-label={`下行 ${format(down)}，上行 ${format(up)}`}>
      <div
        style={{
          display: 'flex',
          overflow: 'hidden',
          height: '8px',
          borderRadius: '5px',
          background: 'var(--chart-grid)',
        }}
      >
        <span style={{ width: `${(down / scale) * 100}%`, background: 'var(--chart-down)' }} />
        <span style={{ width: `${(up / scale) * 100}%`, background: 'var(--chart-up)' }} />
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
        <span>
          <b style={{ color: 'var(--chart-down)' }}>●</b> 下行 {format(down)}
        </span>
        <span>
          <b style={{ color: 'var(--chart-up)' }}>●</b> 上行 {format(up)}
        </span>
      </div>
    </div>
  );
}
