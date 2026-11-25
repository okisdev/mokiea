import { Activity, ChevronRight } from 'lucide-preact';
import { toChildArray, type ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Tooltip } from './overlay';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export function LogList({
  entries,
  label,
  follow = true,
}: {
  entries: {
    time: string;
    level: string;
    tone: 'neutral' | 'warning' | 'danger';
    message: string;
  }[];
  label: string;
  follow?: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (follow && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [entries, follow]);
  return (
    <div ref={list} class="ui-log-list" role="log" aria-label={label} aria-live="off" tabIndex={0}>
      {entries.map((entry, index) => (
        <div key={index} class="ui-log-entry">
          <span class="ui-log-time">{entry.time}</span>
          <span class="ui-log-level" data-tone={entry.tone}>
            {entry.level}
          </span>
          <span class="ui-log-message">{entry.message}</span>
        </div>
      ))}
    </div>
  );
}

export interface CardProps {
  title?: ComponentChildren;
  /** one line under the title */
  description?: ComponentChildren;
  /** a leading visual for the header, such as an IconBox */
  icon?: ComponentChildren;
  /** controls aligned to the end of the header row */
  actions?: ComponentChildren;
  footer?: ComponentChildren;
  id?: string;
  children?: ComponentChildren;
}

export function Card({ title, description, icon, actions, footer, id, children }: CardProps) {
  const headed = title !== undefined || actions !== undefined;
  return (
    <section class="ui-card" aria-labelledby={title !== undefined && id ? id : undefined}>
      {headed && (
        <header class="ui-card-head">
          {icon}
          <div class="ui-grow ui-card-title">
            {title !== undefined && (
              <h2 id={id} class="ui-truncate">
                {title}
              </h2>
            )}
            {description && (
              <p class="ui-text ui-text-xs ui-tone-muted ui-truncate">{description}</p>
            )}
          </div>
          {actions && <div class="ui-card-actions">{actions}</div>}
        </header>
      )}
      {children !== undefined && children !== false && <div class="ui-card-body">{children}</div>}
      {footer && <footer class="ui-card-foot">{footer}</footer>}
    </section>
  );
}

/** Keeps the last result on screen, dimmed, while the next one loads, so switching a view never blanks it. */
export function Updating({ active, children }: { active: boolean; children: ComponentChildren }) {
  return (
    <div class="ui-updating" data-active={active || undefined} aria-busy={active || undefined}>
      {children}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  variant = 'subtle',
  mono,
  children,
}: {
  tone?: Tone;
  variant?: 'subtle' | 'outline';
  mono?: boolean;
  children: ComponentChildren;
}) {
  return (
    <span class={`ui-badge ui-badge-${variant} ui-badge-${tone}${mono ? ' ui-mono' : ''}`}>
      {children}
    </span>
  );
}

export function StatusDot({ tone = 'neutral', pulse }: { tone?: Tone; pulse?: boolean }) {
  return <span class={`ui-dot ui-dot-${tone}${pulse ? ' ui-dot-pulse' : ''}`} aria-hidden="true" />;
}

/** A colored dot plus a word; the word carries the meaning, the dot only scans. */
export function Status({
  tone = 'neutral',
  pulse,
  children,
}: {
  tone?: Tone;
  pulse?: boolean;
  children: ComponentChildren;
}) {
  return (
    <span class={`ui-status ui-status-${tone}`}>
      <StatusDot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}

/** A headline number: label above, value large, unit and note small. */
export function Stat({
  label,
  value,
  unit,
  note,
  icon,
  tone,
  size = 'lg',
}: {
  label: ComponentChildren;
  value: ComponentChildren;
  unit?: ComponentChildren;
  note?: ComponentChildren;
  icon?: ComponentChildren;
  tone?: Tone;
  size?: 'md' | 'lg';
}) {
  return (
    <div class="ui-stat">
      <span class="ui-stat-label">
        {icon}
        {label}
      </span>
      <span
        class={`ui-stat-value ui-stat-${size}${tone && tone !== 'neutral' ? ` ui-tone-${tone}` : ''}`}
      >
        {value}
        {unit && <span class="ui-stat-unit">{unit}</span>}
      </span>
      {note && <span class="ui-stat-note">{note}</span>}
    </div>
  );
}

export function KeyValue({
  items,
  size = 'md',
}: {
  items: [ComponentChildren, ComponentChildren][];
  size?: 'sm' | 'md';
}) {
  return (
    <dl class={`ui-kv ui-kv-${size}`}>
      {items.map(([key, value], index) => (
        <div key={index} class="ui-kv-row">
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A square holding one icon. Neutral by default; a tone marks state, never category. */
export function IconBox({
  tone = 'neutral',
  size = 'md',
  children,
}: {
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  children: ComponentChildren;
}) {
  return (
    <span class={`ui-iconbox ui-iconbox-${size} ui-iconbox-${tone}`} aria-hidden="true">
      {children}
    </span>
  );
}

/** The first meaningful character of a host or name. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const label = name.replace(/^(www|api|m|cdn|img|static)\./, '');
  const ch = /^[0-9.:]+$/.test(name) ? '#' : (label[0] ?? '?').toUpperCase();
  return (
    <span class={`ui-avatar ui-avatar-${size}`} aria-hidden="true">
      {ch}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
}: {
  icon?: ComponentChildren;
  title: ComponentChildren;
  description?: ComponentChildren;
  action?: ComponentChildren;
  size?: 'sm' | 'md';
}) {
  return (
    <div class={`ui-empty ui-empty-${size}`}>
      {icon && (
        <span class="ui-empty-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span class="ui-text ui-weight-medium">{title}</span>
      {description && <span class="ui-text ui-text-xs ui-tone-muted">{description}</span>}
      {action && <div class="ui-empty-action">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = 'neutral',
  icon,
  title,
  action,
  children,
}: {
  tone?: 'neutral' | 'accent' | 'warning' | 'danger' | 'success';
  icon?: ComponentChildren;
  title?: ComponentChildren;
  action?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <div class={`ui-notice ui-notice-${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      {icon && <span class="ui-notice-icon">{icon}</span>}
      <div class="ui-grow">
        {title && <div class="ui-weight-medium">{title}</div>}
        {children && <div class={title ? 'ui-notice-body' : undefined}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({
  height = 16,
  width = '100%',
  radius,
}: {
  height?: number;
  width?: number | string;
  radius?: 'sm' | 'md' | 'full';
}) {
  return (
    <span
      class={`ui-skeleton${radius ? ` ui-skeleton-${radius}` : ''}`}
      style={{ height: `${height}px`, width: typeof width === 'number' ? `${width}px` : width }}
      aria-hidden="true"
    />
  );
}

const MATRIX_DELAYS = [
  3, 11, 7, 1, 9, 13, 5, 12, 2, 8, 6, 0, 10, 4, 14, 9, 2, 13, 6, 11, 1, 7, 12, 4, 8,
];

/** Live work as a 5 by 5 dot matrix whose dots blink out of step. */
export function Spinner({ size = 16, label = '载入中' }: { size?: number; label?: string }) {
  return (
    <span
      class="ui-matrix"
      role="status"
      aria-label={label}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {MATRIX_DELAYS.map((delay, index) => (
        <span key={index} style={{ animationDelay: `${delay * -0.08}s` }} />
      ))}
    </span>
  );
}

export function Meter({
  value,
  max = 100,
  tone = 'accent',
  label,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  label: string;
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span
      class={`ui-meter ui-meter-${tone}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}

export interface StackSegment {
  key: string;
  value: number;
  color: string;
  label: string;
}

/** One horizontal bar split by share; each segment carries its own chart color. */
export function StackBar({ segments, label }: { segments: StackSegment[]; label: string }) {
  const total = segments.reduce((n, segment) => n + Math.max(0, segment.value), 0);
  return (
    <span
      class="ui-stackbar"
      role="img"
      aria-label={`${label}：${segments.map((s) => `${s.label} ${total ? Math.round((s.value / total) * 100) : 0}%`).join('，')}`}
    >
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <span key={s.key} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
    </span>
  );
}

/** A swatch for chart legends and lists keyed to a chart color. */
export function Swatch({ color }: { color: string }) {
  return <span class="ui-swatch" style={{ background: color }} aria-hidden="true" />;
}

/** Recent pass or fail samples, newest on the right. */
export function Ticks({
  samples,
  size = 'md',
  label,
}: {
  samples: number[];
  size?: 'sm' | 'md';
  label: string;
}) {
  return (
    <span class={`ui-ticks ui-ticks-${size}`} role="img" aria-label={label}>
      {[...samples].reverse().map((sample, index) => (
        <span key={index} class={sample > 0 ? 'ui-tick-ok' : 'ui-tick-fail'} />
      ))}
    </span>
  );
}

export function Disclosure({
  summary,
  defaultOpen = false,
  children,
}: {
  summary: ComponentChildren;
  defaultOpen?: boolean;
  children: ComponentChildren;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div class="ui-disclosure">
      <button
        type="button"
        class="ui-disclosure-trigger"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <ChevronRight size={14} class="ui-disclosure-caret" />
        {summary}
      </button>
      {open && <div class="ui-disclosure-body">{children}</div>}
    </div>
  );
}

/** Text that truncates to one line and shows the full value on hover. */
export function Truncate({
  text,
  mono,
  tone,
}: {
  text: string;
  mono?: boolean;
  tone?: 'secondary' | 'muted';
}) {
  return (
    <Tooltip content={text}>
      <span class={`ui-truncate ui-text${mono ? ' ui-mono' : ''}${tone ? ` ui-tone-${tone}` : ''}`}>
        {text}
      </span>
    </Tooltip>
  );
}

/** `maxHeight` scrolls the items in place, for live lists that grow while they are read. */
export function List({
  children,
  label,
  maxHeight,
  limit,
}: {
  children: ComponentChildren;
  label?: string;
  /** scrolls inside this height; for streams such as logs, never for a ranking on a dashboard */
  maxHeight?: number;
  /** shows the first rows and a toggle for the rest, which appears only when rows are hidden */
  limit?: number;
}) {
  const rows = toChildArray(children);
  const first = (rows[0] as { key?: string | number } | undefined)?.key;
  const identity = `${rows.length}:${first ?? ''}`;
  const [expanded, setExpanded] = useState<string>();
  const all = expanded === identity;
  const setAll = (next: boolean) => setExpanded(next ? identity : undefined);
  const hidden = limit !== undefined && rows.length > limit;
  return (
    <div class="ui-list-frame">
      <ul
        class={maxHeight ? 'ui-list ui-list-scroll' : 'ui-list'}
        aria-label={label}
        style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
      >
        {hidden && !all ? rows.slice(0, limit) : rows}
      </ul>
      {hidden && (
        <button type="button" class="ui-list-more" onClick={() => setAll(!all)}>
          {all ? '收起' : `显示全部 ${rows.length} 项`}
        </button>
      )}
    </div>
  );
}

export interface ListItemProps {
  leading?: ComponentChildren;
  title: ComponentChildren;
  description?: ComponentChildren;
  trailing?: ComponentChildren;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  /** `sm` for dense rows inside cards, `md` for primary lists */
  size?: 'sm' | 'md';
  /** shows a chevron when the row navigates */
  chevron?: boolean;
  /** `ListItem` rows shown beneath this one, indented a level */
  children?: ComponentChildren;
  /** makes the row a drop target, for lists the person reorders */
  onDragOver?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
}

export function ListItem({
  leading,
  title,
  description,
  trailing,
  href,
  onClick,
  selected,
  size = 'md',
  chevron,
  children,
  onDragOver,
  onDrop,
}: ListItemProps) {
  const body = (
    <>
      {leading !== undefined && <span class="ui-list-leading">{leading}</span>}
      <span class="ui-list-main">
        <span class="ui-list-title">{title}</span>
        {description && <span class="ui-list-desc">{description}</span>}
      </span>
      {trailing !== undefined && <span class="ui-list-trailing">{trailing}</span>}
      {chevron && <ChevronRight size={16} class="ui-list-chevron" aria-hidden="true" />}
    </>
  );
  const cls = `ui-list-item ui-list-${size}${href || onClick ? ' ui-list-action' : ''}`;
  // A clickable row whose trailing slot holds its own controls cannot be one button, so the row's
  // title is the button and its hit area is stretched over the row beneath those controls.
  const split = onClick && !href && trailing !== undefined;
  return (
    <li class="ui-list-li" onDragOver={onDragOver} onDrop={onDrop}>
      {href ? (
        <a class={cls} href={href} aria-current={selected ? 'true' : undefined} onClick={onClick}>
          {body}
        </a>
      ) : split ? (
        <div class={`${cls} ui-list-split`}>
          {leading !== undefined && <span class="ui-list-leading">{leading}</span>}
          <button
            type="button"
            class="ui-list-main ui-list-hit"
            aria-pressed={selected}
            onClick={onClick}
          >
            <span class="ui-list-title">{title}</span>
            {description && <span class="ui-list-desc">{description}</span>}
          </button>
          <span class="ui-list-trailing">{trailing}</span>
          {chevron && <ChevronRight size={16} class="ui-list-chevron" aria-hidden="true" />}
        </div>
      ) : onClick ? (
        <button type="button" class={cls} aria-pressed={selected} onClick={onClick}>
          {body}
        </button>
      ) : (
        <div class={cls}>{body}</div>
      )}
      {children && <ul class="ui-list ui-list-nested">{children}</ul>}
    </li>
  );
}

export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span class={`ui-brand ui-brand-${size}`} aria-hidden="true">
      <Activity size={size === 'lg' ? 22 : 16} strokeWidth={2.4} />
    </span>
  );
}
