import { chartColor } from './color';

export interface SankeyDto {
  nodes: { id: string; label: string; kind: 'client' | 'policy' | 'country' }[];
  links: { source: number; target: number; bytes: number }[];
}

export interface SankeyProps {
  data: SankeyDto;
  height?: number;
  onLink?: (source: string, target: string) => void;
  format?: (value: number) => string;
}

export function Sankey({
  data,
  height = 340,
  onLink,
  format = (n) => n.toLocaleString(),
}: SankeyProps) {
  const nodes = data.nodes;
  const links = data.links.filter((l) => nodes[l.source] && nodes[l.target] && l.bytes > 0);
  const kinds = ['client', 'policy', 'country'] as const;
  const x = [130, 400, 670];
  const positions = new Map<number, { x: number; y: number; height: number }>();
  kinds.forEach((kind, layer) => {
    const members = nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.kind === kind);
    const totals = members.map(({ i }) =>
      Math.max(
        1,
        links.filter((l) => l.source === i || l.target === i).reduce((n, l) => n + l.bytes, 0),
      ),
    );
    const sum = totals.reduce((n, v) => n + v, 0);
    const gap = Math.min(12, height / Math.max(1, members.length * 3));
    const available = Math.max(
      members.length * 2,
      height - 20 - Math.max(0, members.length - 1) * gap,
    );
    let y = 10;
    members.forEach(({ i }, index) => {
      const h = Math.max(2, (totals[index] / sum) * available);
      positions.set(i, { x: x[layer], y, height: h });
      y += h + gap;
    });
  });
  const outgoing = new Map<number, number>();
  const incoming = new Map<number, number>();
  const ordered = [...links].sort((a, b) => a.source - b.source || a.target - b.target);
  const paths = ordered.flatMap((link) => {
    const source = positions.get(link.source);
    const target = positions.get(link.target);
    if (!source || !target || target.x <= source.x) return [];
    const outTotal = links.filter((l) => l.source === link.source).reduce((n, l) => n + l.bytes, 0);
    const inTotal = links.filter((l) => l.target === link.target).reduce((n, l) => n + l.bytes, 0);
    const thickness = Math.max(
      1,
      Math.min((source.height * link.bytes) / outTotal, (target.height * link.bytes) / inTotal),
    );
    const sy = source.y + (outgoing.get(link.source) ?? 0) + thickness / 2;
    const ty = target.y + (incoming.get(link.target) ?? 0) + thickness / 2;
    outgoing.set(link.source, (outgoing.get(link.source) ?? 0) + thickness);
    incoming.set(link.target, (incoming.get(link.target) ?? 0) + thickness);
    const middle = (source.x + target.x) / 2;
    return [
      {
        link,
        d: `M${source.x + 10},${sy} C${middle},${sy} ${middle},${ty} ${target.x},${ty}`,
        thickness,
      },
    ];
  });
  return (
    <div
      role="img"
      aria-label={
        links.length
          ? `${nodes.length} 个节点（客户端、策略、国家），${links.length} 条流向`
          : '暂无数据'
      }
    >
      {links.length ? (
        <svg
          viewBox={`0 0 800 ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        >
          {paths.map(({ link, d, thickness }, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="var(--chart-1)"
              stroke-opacity="0.22"
              stroke-width={thickness}
              onClick={() => onLink?.(nodes[link.source].id, nodes[link.target].id)}
              onKeyDown={(e) => {
                if (onLink && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onLink(nodes[link.source].id, nodes[link.target].id);
                }
              }}
              tabIndex={onLink ? 0 : undefined}
              role={onLink ? 'button' : undefined}
              style={{ cursor: onLink ? 'pointer' : undefined }}
            >
              <title>{`${nodes[link.source].label} → ${nodes[link.target].label}: ${format(link.bytes)}`}</title>
            </path>
          ))}
          {nodes.map((node, i) => {
            const p = positions.get(i);
            if (!p) return null;
            const side = node.kind === 'client' ? -1 : 1;
            return (
              <g key={node.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width="10"
                  height={p.height}
                  rx="2"
                  fill={chartColor(node.kind, i)}
                />
                <text
                  x={p.x + (side < 0 ? -6 : 16)}
                  y={p.y + p.height / 2}
                  text-anchor={side < 0 ? 'end' : 'start'}
                  dominant-baseline="middle"
                  fill="var(--fg)"
                  font-size="11"
                >
                  {node.label.length > 17 ? `${node.label.slice(0, 16)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div class="ui-chart-empty" style={{ height: `${height}px` }}>
          暂无数据
        </div>
      )}
    </div>
  );
}
