import { chartColor } from './color';

const MAX_SLICES = 8;

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color?: string;
}
export interface DonutProps {
  slices: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
  format?: (value: number) => string;
  onSelect?: (key: string) => void;
}

export function Donut({
  slices,
  size = 168,
  centerLabel,
  centerSub,
  format = (n) => n.toLocaleString(),
  onSelect,
}: DonutProps) {
  const positive = slices
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .sort((a, b) => Number(a.key === 'rest') - Number(b.key === 'rest') || b.value - a.value);
  const data =
    positive.length > MAX_SLICES
      ? [
          ...positive.slice(0, MAX_SLICES - 1),
          {
            key: 'rest',
            label: '其他',
            value: positive.slice(MAX_SLICES - 1).reduce((n, s) => n + s.value, 0),
          },
        ]
      : positive;
  const total = data.reduce((n, s) => n + s.value, 0);
  let offset = 0;
  return (
    <div
      role="img"
      aria-label={
        data.length
          ? `共 ${data.length} 类，合计 ${format(total)}：${data.map((s) => `${s.label} ${format(s.value)}`).join('、')}`
          : '暂无数据'
      }
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px' }}
    >
      <div style={{ width: `${size}px`, height: `${size}px`, position: 'relative', flex: 'none' }}>
        <svg
          viewBox="0 0 100 100"
          style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle cx="50" cy="50" r="35" fill="none" stroke="var(--chart-grid)" stroke-width="14" />
          {data.map((s, i) => {
            const length = (s.value / total) * 219.91;
            const start = offset;
            offset += length;
            return (
              <circle
                key={s.key}
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke={s.color ?? chartColor(s.key, i)}
                stroke-width="14"
                stroke-dasharray={`${Math.max(0, length - 1)} ${219.91 - Math.max(0, length - 1)}`}
                stroke-dashoffset={-start}
                onClick={() => onSelect?.(s.key)}
                onKeyDown={(e) => {
                  if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect(s.key);
                  }
                }}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? 'button' : undefined}
                style={{ cursor: onSelect ? 'pointer' : undefined }}
              >
                <title>{`${s.label}: ${format(s.value)}`}</title>
              </circle>
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <strong class="ui-num" style={{ fontSize: '17px' }}>
            {centerLabel ?? (total ? format(total) : '—')}
          </strong>
          {centerSub && <span class="ui-text ui-text-xs ui-tone-muted">{centerSub}</span>}
        </div>
      </div>
      <div style={{ flex: '1 1 130px' }}>
        {data.length ? (
          data.map((s, i) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                padding: '4px 0',
                fontSize: '12px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '2px',
                  background: s.color ?? chartColor(s.key, i),
                }}
              />
              <span style={{ flex: 1 }}>{s.label}</span>
              <span class="ui-num">{format(s.value)}</span>
              <span class="ui-num ui-tone-muted">{Math.round((s.value / total) * 100)}%</span>
            </div>
          ))
        ) : (
          <span class="ui-text ui-text-sm ui-tone-muted">暂无数据</span>
        )}
      </div>
    </div>
  );
}
