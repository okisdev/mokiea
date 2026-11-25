import { useState } from 'preact/hooks';
import { date as formatDate } from '../format';
import { AxisLabels } from './axis-labels';
import { ChartTooltip } from './tooltip';

export interface DailyPoint {
  day: string;
  in: number;
  out: number;
}

export interface DailyBarsProps {
  points: DailyPoint[];
  height?: number;
  format?: (value: number) => string;
}

export function DailyBars({
  points,
  height = 200,
  format = (n) => n.toLocaleString(),
}: DailyBarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 600;
  const base = height - 22;
  const cell = w / Math.max(1, points.length);
  const bw = Math.min(26, cell * 0.67);
  const max = Math.max(1, ...points.map((p) => Math.max(0, p.in) + Math.max(0, p.out)));
  const label = (day: string) => {
    const date = new Date(`${day}T00:00:00`);
    return Number.isNaN(+date) ? day : formatDate(+date);
  };
  return (
    <div
      role="img"
      aria-label={points.length ? `${points.length} 天的流量，峰值 ${format(max)}` : '暂无数据'}
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
              const down = (Math.max(0, p.in) / max) * (base - 8);
              const up = (Math.max(0, p.out) / max) * (base - 8);
              return (
                <g key={i} onPointerEnter={() => setHover(i)}>
                  <rect x={i * cell} width={cell} height={base} fill="transparent" />
                  <rect x={x} y={base - down} width={bw} height={down} fill="var(--chart-down)" />
                  <rect
                    x={x}
                    y={base - down - up}
                    width={bw}
                    height={up}
                    rx="2"
                    fill="var(--chart-up)"
                  />
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
                { label: '下行', value: format(points[hover].in), color: 'var(--chart-down)' },
                { label: '上行', value: format(points[hover].out), color: 'var(--chart-up)' },
                { label: '合计', value: format(points[hover].in + points[hover].out) },
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
