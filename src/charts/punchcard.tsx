import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { ChartTooltip } from './tooltip';

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export interface PunchcardProps {
  cells: number[][];
  label?: string;
  max?: number;
  format?: (value: number) => string;
}

export function Punchcard({ cells, label = '数值', max, format = (n) => n.toLocaleString() }: PunchcardProps) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const peak = Math.max(1, max ?? 0, ...cells.flat().filter(Number.isFinite));
  const value = hover ? Math.max(0, cells[hover[0]]?.[hover[1]] ?? 0) : 0;
  const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;
  return (
    <div
      role="img"
      aria-label={cells.length ? `按星期和小时的${label}，峰值 ${format(peak)}` : '暂无数据'}
      style={{ position: 'relative', overflowX: 'auto' }}
      onPointerLeave={() => setHover(null)}
    >
      {cells.length ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '32px repeat(24, minmax(10px, 1fr))',
              gap: '3px',
              minWidth: '440px',
              alignItems: 'center',
            }}
          >
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} style={{ fontSize: '11px', color: 'var(--fg-3)', textAlign: 'center' }}>
                {h % 6 === 0 ? h : ''}
              </span>
            ))}
            {days.map((day, d) => (
              <Fragment key={day}>
                <span style={{ fontSize: '11px', color: 'var(--fg-3)' }}>{day}</span>
                {Array.from({ length: 24 }, (_, h) => {
                  const n = Math.max(0, cells[d]?.[h] ?? 0);
                  return (
                    <span
                      key={h}
                      onPointerEnter={() => setHover([d, h])}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '3px',
                        background: n
                          ? `color-mix(in oklab, var(--chart-1) ${Math.round(18 + Math.sqrt(n / peak) * 77)}%, var(--bg))`
                          : 'var(--chart-grid)',
                      }}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
          {hover && (
            <ChartTooltip
              title={`${days[hover[0]]} ${hourLabel(hover[1])}`}
              rows={[{ label, value: format(value), color: 'var(--chart-1)' }]}
              x={`clamp(70px, calc(32px + (100% - 32px) * ${(hover[1] + 0.5) / 24}), calc(100% - 70px))`}
              y={`calc(${((hover[0] + 1) * 100) / 8}% + 8px)`}
            />
          )}
        </>
      ) : (
        <div class="ui-chart-empty">暂无数据</div>
      )}
    </div>
  );
}
