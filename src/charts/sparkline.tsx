import { chartColor } from './color';

export interface SparklineProps {
  /** one value per sample, or one array per sample holding a value for each line */
  points: number[] | number[][];
  height?: number;
  /** the color of a single line; several lines take the chart ramp in order */
  color?: string;
  /** fill under a single line */
  fill?: boolean;
}

export function Sparkline({
  points,
  height = 40,
  color = 'var(--chart-1)',
  fill = false,
}: SparklineProps) {
  const rows = points.map((point) => (typeof point === 'number' ? [point] : point));
  const lines = Math.max(0, ...rows.map((row) => row.length));
  const max = Math.max(1, ...rows.flat().filter(Number.isFinite));
  const y = (value: number | undefined) => height - 3 - ((value ?? 0) / max) * (height - 6);
  const path = (line: number) =>
    rows.map((row, i) => `${i ? 'L' : 'M'}${rows.length === 1 ? 150 : (i / (rows.length - 1)) * 300},${y(row[line])}`).join(' ');
  const stroke = (line: number) => (lines === 1 ? color : chartColor(String(line), line));
  const area = lines === 1 && fill && rows.length > 1;
  const summary = rows.length ? `${rows.length} 个采样，峰值 ${max.toLocaleString()}` : '暂无数据';
  if (!rows.length)
    return (
      <div class="ui-chart-empty" role="img" aria-label={summary} style={{ height: `${height}px`, minHeight: 0 }}>
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
      {area && <path d={`${path(0)} L300,${height} L0,${height} Z`} fill={color} fill-opacity="0.14" stroke="none" />}
      {Array.from({ length: lines }, (_, line) => (
        <path key={line} d={path(line)} fill="none" stroke={stroke(line)} stroke-width="1.5" vector-effect="non-scaling-stroke" />
      ))}
      {rows.length === 1 &&
        Array.from({ length: lines }, (_, line) => <circle key={line} cx="150" cy={y(rows[0]![line])} r="2.5" fill={stroke(line)} />)}
    </svg>
  );
}
