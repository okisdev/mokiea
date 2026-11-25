import { useEffect, useRef, useState } from 'preact/hooks';

const LABEL_SPACE = 56;

/** Category labels under evenly spaced bars, kept in HTML so a stretched SVG never distorts the text. */
export function AxisLabels({ labels, max = 8 }: { labels: string[]; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const fit = width ? Math.max(2, Math.floor(width / LABEL_SPACE)) : max;
  const step = Math.max(1, Math.ceil(labels.length / Math.min(max, fit)));
  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        height: '18px',
        marginTop: '4px',
        color: 'var(--fg-3)',
        fontSize: 'var(--text-xs)',
      }}
    >
      {labels.map((label, i) => {
        if (i % step !== 0) return null;
        const at = ((i + 0.5) * 100) / labels.length;
        return (
          <span
            key={i}
            class="ui-num"
            style={{ position: 'absolute', left: `${at}%`, transform: `translateX(-${at}%)` }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
