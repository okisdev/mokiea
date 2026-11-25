import { useState } from 'preact/hooks';
import { AxisLabels } from './axis-labels';
import { ChartTooltip } from './tooltip';

export interface MiniBarsProps {
  data: { label: string; count: number }[];
  height?: number;
  color?: string;
  format?: (value: number) => string;
}

export function MiniBars({
  data,
  height = 120,
  color = 'var(--chart-1)',
  format = (n) => n.toLocaleString(),
}: MiniBarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => Math.max(0, d.count)));
  const w = 600;
  const base = height - 22;
  const cell = w / Math.max(1, data.length);
  const bw = Math.min(24, cell * 0.66);
  return (
    <div
      role="img"
      aria-label={data.length ? `${data.length} 项，最高 ${format(max)}` : '暂无数据'}
      style={{ position: 'relative', width: '100%' }}
      onPointerLeave={() => setHover(null)}
    >
      {data.length ? (
        <>
          <svg
            viewBox={`0 0 ${w} ${base}`}
            preserveAspectRatio="none"
            style={{ width: '100%', height: `${base}px`, display: 'block' }}
          >
            <line x1="0" x2={w} y1={base} y2={base} stroke="var(--chart-grid)" />
            {data.map((d, i) => {
              const x = i * cell + (cell - bw) / 2;
              const bh = (Math.max(0, d.count) / max) * (base - 8);
              return (
                <g key={i} onPointerEnter={() => setHover(i)}>
                  <rect x={i * cell} y="0" width={cell} height={base} fill="transparent" />
                  <rect
                    x={x}
                    y={base - bh}
                    width={bw}
                    height={bh}
                    rx="3"
                    fill={color}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                </g>
              );
            })}
          </svg>
          <AxisLabels labels={data.map((d) => d.label)} max={6} />
          {hover !== null && (
            <ChartTooltip
              title={data[hover].label}
              rows={[{ label: '次数', value: format(data[hover].count), color }]}
              x={`clamp(70px, ${((hover + 0.5) * 100) / data.length}%, calc(100% - 70px))`}
              y={base / 2}
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
