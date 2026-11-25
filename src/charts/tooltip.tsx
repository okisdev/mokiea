import { createPortal } from 'preact/compat';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

const EDGE = 8;
const GAP = 12;
const MAX_ROWS = 8;

export function ChartTooltip({
  title,
  rows,
  x = 0,
  y = 0,
}: {
  title: string;
  rows: TooltipRow[];
  x?: number | string;
  y?: number | string;
}) {
  const anchor = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ left: number; top: number }>();
  useLayoutEffect(() => {
    const point = anchor.current?.getBoundingClientRect();
    const size = box.current?.getBoundingClientRect();
    if (!point || !size) return;
    const right = point.left + GAP;
    const left = Math.max(
      right + size.width <= innerWidth - EDGE ? right : point.left - GAP - size.width,
      EDGE,
    );
    const top = Math.min(
      Math.max(point.top - size.height / 2, EDGE),
      innerHeight - size.height - EDGE,
    );
    setPlace((current) =>
      current && current.left === left && current.top === top ? current : { left, top },
    );
  }, [x, y, title, rows.length]);
  const shown = rows.slice(0, MAX_ROWS);
  const hidden = rows.length - shown.length;
  return (
    <>
      <span
        ref={anchor}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: typeof x === 'number' ? `${x}px` : x,
          top: typeof y === 'number' ? `${y}px` : y,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      />
      {createPortal(
        <div
          ref={box}
          role="tooltip"
          style={{
            position: 'fixed',
            left: `${place?.left ?? -9999}px`,
            top: `${place?.top ?? -9999}px`,
            zIndex: 1000,
            pointerEvents: 'none',
            minWidth: '160px',
            maxWidth: 'min(360px, calc(100vw - 16px))',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-raised)',
            boxShadow: 'var(--shadow-overlay)',
            color: 'var(--fg)',
            fontSize: 'var(--text-xs)',
            lineHeight: '20px',
          }}
        >
          <div style={{ color: 'var(--fg-3)' }}>{title}</div>
          {shown.map((row) => (
            <div
              key={row.label}
              style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0 }}
            >
              <span
                style={{
                  display: 'flex',
                  flex: '1 1 auto',
                  gap: '6px',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                {row.color && (
                  <span
                    style={{
                      flex: 'none',
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: row.color,
                    }}
                  />
                )}
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {row.label}
                </span>
              </span>
              <span class="ui-num" style={{ flex: 'none' }}>
                {row.value}
              </span>
            </div>
          ))}
          {hidden > 0 && <div style={{ color: 'var(--fg-3)' }}>另有 {hidden} 项</div>}
        </div>,
        document.body,
      )}
    </>
  );
}
