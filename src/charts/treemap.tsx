import { useEffect, useRef, useState } from 'preact/hooks';
import { chartColor } from './color';

export interface TreemapItem {
  key: string;
  label: string;
  value: number;
}
export interface TreemapProps {
  items: TreemapItem[];
  height?: number;
  format?: (value: number) => string;
  onSelect?: (key: string) => void;
}

interface Cell {
  item: TreemapItem;
  x: number;
  y: number;
  w: number;
  h: number;
}
function squarify(items: TreemapItem[], width: number, height: number): Cell[] {
  const total = items.reduce((n, i) => n + i.value, 0);
  const pending = [...items]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ item, area: (item.value / total) * width * height }));
  const cells: Cell[] = [];
  let x = 0,
    y = 0,
    w = width,
    h = height;
  const worst = (row: typeof pending, short: number) => {
    if (!row.length) return Infinity;
    const sum = row.reduce((n, i) => n + i.area, 0);
    const min = Math.min(...row.map((i) => i.area));
    const max = Math.max(...row.map((i) => i.area));
    return Math.max((short * short * max) / (sum * sum), (sum * sum) / (short * short * min));
  };
  while (pending.length) {
    const row = [pending.shift()!];
    while (
      pending.length &&
      worst([...row, pending[0]], Math.min(w, h)) <= worst(row, Math.min(w, h))
    )
      row.push(pending.shift()!);
    const sum = row.reduce((n, i) => n + i.area, 0);
    if (w >= h) {
      const rowW = sum / h;
      let cy = y;
      row.forEach(({ item, area }) => {
        const ch = area / rowW;
        cells.push({ item, x, y: cy, w: rowW, h: ch });
        cy += ch;
      });
      x += rowW;
      w -= rowW;
    } else {
      const rowH = sum / w;
      let cx = x;
      row.forEach(({ item, area }) => {
        const cw = area / rowH;
        cells.push({ item, x: cx, y, w: cw, h: rowH });
        cx += cw;
      });
      y += rowH;
      h -= rowH;
    }
  }
  return cells;
}

export function Treemap({
  items,
  height = 300,
  format = (n) => n.toLocaleString(),
  onSelect,
}: TreemapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(1, Math.round(entry.contentRect.width))),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const data = items.filter((i) => Number.isFinite(i.value) && i.value > 0);
  const cells = data.length ? squarify(data, width, height) : [];
  return (
    <div
      ref={ref}
      role="img"
      aria-label={
        data.length
          ? `共 ${data.length} 类，最大为 ${cells[0].item.label} ${format(cells[0].item.value)}`
          : '暂无数据'
      }
    >
      {cells.length ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        >
          {cells.map(({ item, x, y, w, h }, i) => (
            <g
              key={item.key}
              onClick={() => onSelect?.(item.key)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(item.key);
                }
              }}
              tabIndex={onSelect ? 0 : undefined}
              role={onSelect ? 'button' : undefined}
              style={{ cursor: onSelect ? 'pointer' : undefined }}
            >
              <rect
                x={x + 1}
                y={y + 1}
                width={Math.max(0, w - 2)}
                height={Math.max(0, h - 2)}
                rx="3"
                fill={`color-mix(in oklab, ${chartColor(item.key, i)} 24%, var(--bg))`}
                stroke="var(--chart-grid)"
              />
              <title>{`${item.label}: ${format(item.value)}`}</title>
              {w > 55 && h > 30 && (
                <>
                  <text x={x + 8} y={y + 17} fill="var(--fg)" font-size="11">
                    {item.label.length * 6 > w - 16
                      ? `${item.label.slice(0, Math.max(1, Math.floor((w - 22) / 6)))}…`
                      : item.label}
                  </text>
                  {h > 43 && (
                    <text x={x + 8} y={y + 32} fill="var(--fg-3)" font-size="11">
                      {format(item.value)}
                    </text>
                  )}
                </>
              )}
            </g>
          ))}
        </svg>
      ) : (
        <div class="ui-chart-empty" style={{ height: `${height}px` }}>
          暂无数据
        </div>
      )}
    </div>
  );
}
