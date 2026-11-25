export interface SparklineProps {
  points: number[] | { up: number; down: number }[];
  height?: number;
  color?: string;
  fill?: boolean;
}

export function Sparkline({
  points,
  height = 40,
  color = 'var(--chart-1)',
  fill = false,
}: SparklineProps) {
  const paired = typeof points[0] === 'object';
  const rows = points as Array<number | { up: number; down: number }>;
  const values = paired
    ? rows.flatMap((p) => (typeof p === 'number' ? [] : [p.down, p.up]))
    : (rows as number[]);
  const max = Math.max(1, ...values.filter(Number.isFinite));
  const path = (key: 'up' | 'down') =>
    rows
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${rows.length === 1 ? 150 : (i / (rows.length - 1)) * 300},${height - 3 - ((typeof p === 'number' ? p : p[key]) / max) * (height - 6)}`,
      )
      .join(' ');
  const summary = rows.length ? `${rows.length} 个采样，峰值 ${max.toLocaleString()}` : '暂无数据';
  if (!rows.length)
    return (
      <div
        class="ui-chart-empty"
        role="img"
        aria-label={summary}
        style={{ height: `${height}px`, minHeight: 0 }}
      >
        暂无数据
      </div>
    );
  return (
    <svg
      role="img"
      aria-label={summary}
      viewBox={`0 0 300 ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: `${height}px` }}
    >
      {paired ? (
        <>
          <path
            d={path('down')}
            fill="none"
            stroke="var(--chart-down)"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
          <path
            d={path('up')}
            fill="none"
            stroke="var(--chart-up)"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
        </>
      ) : (
        <>
          <path
            d={path('down') + (fill && rows.length > 1 ? ` L300,${height} L0,${height} Z` : '')}
            fill={fill && rows.length > 1 ? color : 'none'}
            fill-opacity="0.14"
            stroke={fill && rows.length > 1 ? 'none' : color}
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
          {fill && rows.length > 1 && (
            <path
              d={path('down')}
              fill="none"
              stroke={color}
              stroke-width="1.5"
              vector-effect="non-scaling-stroke"
            />
          )}
        </>
      )}
      {rows.length === 1 &&
        (paired ? (
          <>
            <circle
              cx="150"
              cy={
                height - 3 - ((typeof rows[0] === 'number' ? 0 : rows[0].down) / max) * (height - 6)
              }
              r="2.5"
              fill="var(--chart-down)"
            />
            <circle
              cx="150"
              cy={
                height - 3 - ((typeof rows[0] === 'number' ? 0 : rows[0].up) / max) * (height - 6)
              }
              r="2.5"
              fill="var(--chart-up)"
            />
          </>
        ) : (
          <circle
            cx="150"
            cy={height - 3 - (values[0] / max) * (height - 6)}
            r="2.5"
            fill={color}
          />
        ))}
    </svg>
  );
}
