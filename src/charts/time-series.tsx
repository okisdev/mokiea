import { useEffect, useRef, useState } from 'preact/hooks';
import { dateTime } from '../format';
import { chartColor } from './color';
import { ChartTooltip } from './tooltip';

export interface TimeSeriesPoint {
  t: number;
  values: Record<string, number>;
  peaks?: Record<string, number | undefined>;
}
export interface TimeSeriesSeries {
  key: string;
  label: string;
  color?: string;
}
export interface TimeSeriesProps {
  points: TimeSeriesPoint[];
  series: TimeSeriesSeries[];
  mode?: 'line' | 'area' | 'stacked' | 'mirrored';
  height?: number;
  format?: (value: number) => string;
  peakIn?: number;
  /** Drops the legend and the time axis, for a chart that sits inside a summary card. */
  compact?: boolean;
  /** Lets the reader drag across the chart to pick a time range. */
  onSelect?: (range: { from: number; to: number }) => void;
}

function tick(t: number, span: number): string {
  const date = new Date(t);
  if (span > 90 * 86400000)
    return date.toLocaleDateString('zh-CN', { month: 'short', year: '2-digit' });
  if (span > 2 * 86400000)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  return date.toLocaleTimeString(
    'zh-CN',
    span < 300000
      ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
      : { hour: '2-digit', minute: '2-digit', hour12: false },
  );
}

export function TimeSeries({
  points,
  series,
  mode = 'area',
  height = 200,
  format = (n) => n.toLocaleString(),
  peakIn,
  compact = false,
  onSelect,
}: TimeSeriesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const [brush, setBrush] = useState<{ start: number; end: number } | null>(null);
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(1, entry.contentRect.width)),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const data = [...points].filter((p) => Number.isFinite(p.t)).sort((a, b) => a.t - b.t);
  const active = series.filter((s) => data.some((p) => Number.isFinite(p.values[s.key])));
  const h = compact ? height : height - 24;
  const first = data[0]?.t ?? 0;
  const rawSpan = (data[data.length - 1]?.t ?? first) - first;
  const span = Math.max(1, rawSpan);
  const x = (p: TimeSeriesPoint, i: number) =>
    data.length === 1
      ? width / 2
      : rawSpan === 0
        ? (i * width) / (data.length - 1)
        : ((p.t - first) / rawSpan) * width;
  const totals = data.map((p) => active.reduce((n, s) => n + Math.max(0, p.values[s.key] || 0), 0));
  const max =
    Math.max(
      1,
      ...(mode === 'stacked'
        ? totals
        : data.flatMap((p) => active.map((s) => Math.max(0, p.values[s.key] || 0)))),
    ) * 1.12;
  const hasPeaks = data.some((p) => p.peaks !== undefined);
  const peakValue = (p: TimeSeriesPoint, key: string) =>
    Math.max(0, p.peaks?.[key] ?? p.values[key] ?? 0);
  const peak = Math.max(
    0,
    ...(mode === 'stacked'
      ? data.map((p) => active.reduce((n, s) => n + peakValue(p, s.key), 0))
      : data.flatMap((p) => active.map((s) => peakValue(p, s.key)))),
  );
  const directionPeak = (direction: number) =>
    Math.max(
      0,
      ...data.flatMap((p) =>
        active.filter((s) => series.indexOf(s) % 2 === direction).map((s) => peakValue(p, s.key)),
      ),
    );
  const peakLabel =
    mode === 'mirrored'
      ? `峰值 ↓${format(directionPeak(0))} ↑${format(directionPeak(1))}`
      : `${mode === 'stacked' && (hasPeaks || peakIn !== undefined) ? '峰值下行' : '峰值'} ${format(peakIn ?? peak)}`;
  const summary =
    data.length && active.length
      ? `${active.map((s) => s.label).join('、')}，${tick(data[0].t, rawSpan)} 至 ${tick(data[data.length - 1].t, rawSpan)}，${data.length} 个采样，${peakLabel}`
      : '暂无数据';
  const sideMax = (direction: number) =>
    Math.max(
      1,
      ...data.flatMap((p) =>
        active
          .filter((s) => series.indexOf(s) % 2 === direction)
          .map((s) => Math.max(0, p.values[s.key] || 0)),
      ),
    ) * 1.12;
  const downMax = sideMax(0);
  const upMax = sideMax(1);
  const downHeight = (h - 12) * Math.min(0.85, Math.max(0.5, downMax / (downMax + upMax)));
  const baseline = mode === 'mirrored' ? 6 + downHeight : h;
  const y = (v: number, negative = false) =>
    mode === 'mirrored'
      ? negative
        ? baseline + (v / upMax) * (h - 6 - baseline)
        : baseline - (v / downMax) * downHeight
      : h - (v / max) * (h - 6);
  const line = (values: number[], negative = false) =>
    data
      .map((p, i) => `${i ? 'L' : 'M'}${x(p, i).toFixed(1)},${y(values[i], negative).toFixed(1)}`)
      .join(' ');
  const selected = hover === null ? null : data[hover];
  const selectable = !!onSelect && rawSpan > 0;
  const pointerX = (e: { currentTarget: Element; clientX: number }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(width, ((e.clientX - rect.left) / rect.width) * width));
  };
  const timeAt = (at: number) => first + (at / width) * rawSpan;
  return (
    <div
      ref={ref}
      style={{ width: '100%', position: 'relative' }}
      role="img"
      aria-label={summary}
      onPointerLeave={() => setHover(null)}
    >
      {data.length && active.length ? (
        <>
          {!compact && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                height: '18px',
                marginBottom: '8px',
                color: 'var(--fg-3)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  flex: '1 1 auto',
                  minWidth: 0,
                  gap: '16px',
                  overflow: 'hidden',
                  maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
                }}
              >
                {active.map((s, i) => (
                  <span
                    key={s.key}
                    style={{
                      display: 'inline-flex',
                      gap: '6px',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        flex: 'none',
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        background: s.color ?? chartColor(s.key, i),
                      }}
                    />
                    {s.label}
                  </span>
                ))}
              </span>
              <span style={{ flex: 'none', whiteSpace: 'nowrap' }}>
                {selectable ? `${peakLabel} · 拖动选取时间段` : peakLabel}
              </span>
            </div>
          )}
          <svg
            width="100%"
            height={h}
            viewBox={`0 0 ${width} ${h}`}
            preserveAspectRatio="none"
            style={{
              display: 'block',
              overflow: 'visible',
              cursor: selectable ? 'crosshair' : undefined,
              touchAction: selectable ? 'pan-y' : undefined,
            }}
            onPointerDown={(e) => {
              if (!selectable || e.button !== 0) return;
              const at = pointerX(e);
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
              setBrush({ start: at, end: at });
            }}
            onPointerMove={(e) => {
              const at = pointerX(e);
              if (brush) setBrush({ ...brush, end: at });
              let nearest = 0;
              data.forEach((p, i) => {
                if (Math.abs(x(p, i) - at) < Math.abs(x(data[nearest], nearest) - at)) nearest = i;
              });
              setHover(nearest);
            }}
            onPointerUp={() => {
              if (!brush) return;
              setBrush(null);
              const left = Math.min(brush.start, brush.end);
              const right = Math.max(brush.start, brush.end);
              if (right - left >= 8)
                onSelect?.({ from: Math.round(timeAt(left)), to: Math.round(timeAt(right)) });
            }}
            onPointerCancel={() => setBrush(null)}
          >
            {(mode === 'mirrored'
              ? [baseline / 2, baseline, baseline + (h - baseline) / 2]
              : [h * 0.25, h * 0.5, h * 0.75]
            ).map((at) => (
              <line
                key={at}
                x1="0"
                x2={width}
                y1={at}
                y2={at}
                stroke="var(--chart-grid)"
                vector-effect="non-scaling-stroke"
              />
            ))}
            {active.map((s, si) => {
              const values = data.map((p) => Math.max(0, p.values[s.key] || 0));
              const lower = data.map((p) =>
                mode === 'stacked'
                  ? active
                      .slice(0, si)
                      .reduce((n, prior) => n + Math.max(0, p.values[prior.key] || 0), 0)
                  : 0,
              );
              const upper = values.map((v, i) => v + lower[i]);
              const negative = mode === 'mirrored' && series.indexOf(s) % 2 === 1;
              const color = s.color ?? chartColor(s.key, si);
              return (
                <g key={s.key}>
                  {mode !== 'line' && (
                    <path
                      d={`${line(upper, negative)} ${data
                        .map((p, i) => `L${x(p, i).toFixed(1)},${y(lower[i], negative).toFixed(1)}`)
                        .reverse()
                        .join(' ')} Z`}
                      fill={color}
                      fill-opacity={mode === 'stacked' ? 0.7 : 0.16}
                    />
                  )}
                  <path
                    d={line(upper, negative)}
                    fill="none"
                    stroke={color}
                    stroke-width="1.7"
                    vector-effect="non-scaling-stroke"
                  />
                  {data.length === 1 && (
                    <circle cx={x(data[0], 0)} cy={y(upper[0], negative)} r="3" fill={color} />
                  )}
                </g>
              );
            })}
            {brush && (
              <rect
                x={Math.min(brush.start, brush.end)}
                y="0"
                width={Math.abs(brush.end - brush.start)}
                height={h}
                fill="var(--accent)"
                fill-opacity="0.12"
              />
            )}
            {selected && (
              <line
                x1={x(selected, hover!)}
                x2={x(selected, hover!)}
                y1="0"
                y2={h}
                stroke="var(--fg-3)"
                stroke-dasharray="3 3"
                vector-effect="non-scaling-stroke"
              />
            )}
          </svg>
          {!compact && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--fg-3)',
                fontSize: '11px',
                marginTop: '6px',
              }}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <span key={f}>{tick(first + f * span, span)}</span>
              ))}
            </div>
          )}
          {selected && (
            <ChartTooltip
              title={hasPeaks ? `${dateTime(selected.t)} · 平均` : dateTime(selected.t)}
              x={x(selected, hover!)}
              y={(compact ? 0 : 26) + h / 2}
              rows={active
                .map((s, i) => ({ s, color: s.color ?? chartColor(s.key, i) }))
                .filter(({ s }) => active.length <= 2 || (selected.values[s.key] ?? 0) > 0)
                .sort((a, b) =>
                  active.length <= 2
                    ? 0
                    : (selected.values[b.s.key] ?? 0) - (selected.values[a.s.key] ?? 0),
                )
                .flatMap(({ s, color }) => {
                  const rows = [
                    { label: s.label, value: format(selected.values[s.key] ?? 0), color },
                  ];
                  const peak = selected.peaks?.[s.key];
                  if (peak !== undefined && active.length <= 2)
                    rows.push({ label: `${s.label} 峰值`, value: format(peak), color });
                  return rows;
                })}
            />
          )}
        </>
      ) : (
        <div class="ui-chart-empty" style={{ height: `${compact ? height : height + 25}px` }}>
          暂无数据
        </div>
      )}
    </div>
  );
}
