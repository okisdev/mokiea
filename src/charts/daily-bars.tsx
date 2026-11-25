import { useState } from 'preact/hooks';
import { date as formatDate } from '../format';
import { AxisLabels } from './axis-labels';
import { chartColor } from './color';
import { ChartTooltip } from './tooltip';

export interface DailyPoint {
  day: string;
  values: number[];
}

export interface DailyBarsProps {
  points: DailyPoint[];
  series: { label: string; color?: string }[];
  height?: number;
  format?: (value: number) => string;
}

export function DailyBars({
  points,
  series,
  height = 200,
  format = (n) => n.toLocaleString(),
}: DailyBarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 600;
  const base = height - 22;
  const cell = w / Math.max(1, points.length);
  const bw = Math.min(26, cell * 0.67);
  const total = (point: DailyPoint) =>
    series.reduce((sum, _, index) => sum + Math.max(0, point.values[index] ?? 0), 0);
  const max = Math.max(1, ...points.map(total));
  const label = (day: string) => {
    const date = new Date(`${day}T00:00:00`);
    return Number.isNaN(+date) ? day : formatDate(+date);
  };
  return (
    <div
      role="img"
      aria-label={points.length ? `${points.length} 天，峰值 ${format(max)}` : '暂无数据'}
      style={{ width: '100%', position: 'relative' }}
      onPointerLeave={() => setHover(null)}
    >
      {points.length ? (
        <>
          <svg
            viewBox={`0 0 ${w} ${base}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: `${base}px`, display: 'block' }}
          >
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={w} y1={base * f} y2={base * f} stroke="var(--chart-grid)" />
            ))}
            {points.map((p, i) => {
              const x = i * cell + (cell - bw) / 2;
              let stacked = 0;
              return (
                <g key={i} onPointerEnter={() => setHover(i)}>
                  <rect x={i * cell} width={cell} height={base} fill="transparent" />
                  {series.map((item, index) => {
                    const barHeight = (Math.max(0, p.values[index] ?? 0) / max) * (base - 8);
                    stacked += barHeight;
                    return (
                      <rect
                        key={index}
                        x={x}
                        y={base - stacked}
                        width={bw}
                        height={barHeight}
                        rx={index === series.length - 1 ? 2 : undefined}
                        fill={item.color ?? chartColor(String(index), index)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
          <AxisLabels labels={points.map((p) => label(p.day))} max={10} />
          {hover !== null && (
            <ChartTooltip
              title={label(points[hover].day)}
              x={`clamp(85px, ${((hover + 0.5) * 100) / points.length}%, calc(100% - 85px))`}
              y={base / 2}
              rows={[
                ...series.map((item, index) => ({
                  label: item.label,
                  value: format(points[hover].values[index] ?? 0),
                  color: item.color ?? chartColor(String(index), index),
                })),
                {
                  label: '合计',
                  value: format(series.reduce((sum, _, index) => sum + (points[hover].values[index] ?? 0), 0)),
                },
              ]}
            />
          )}
        </>
      ) : (
        <div class="ui-chart-empty" style={{ height: `${height}px` }}>
          暂无数据
        </div>
      )}
    </div>
  );
}
