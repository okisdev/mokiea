import type { ComponentChildren } from 'preact';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'faint'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inherit';

export interface TextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  tone?: TextTone;
  weight?: 'regular' | 'medium';
  /** monospace, for addresses, rule payloads and identifiers */
  mono?: boolean;
  /** tabular figures that never wrap, for numbers in columns */
  num?: boolean;
  /** clips to one line with an ellipsis; the full text is exposed as a tooltip only when `full` is passed */
  truncate?: boolean;
  wrap?: 'anywhere';
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'strong' | 'dt' | 'dd' | 'time' | 'label';
  id?: string;
  for?: string;
  children?: ComponentChildren;
}

export function textClass({
  size,
  tone,
  weight,
  mono,
  num,
  truncate,
  wrap,
}: Omit<TextProps, 'as' | 'children' | 'id' | 'for'>) {
  return [
    'ui-text',
    size && `ui-text-${size}`,
    tone && tone !== 'default' && `ui-tone-${tone}`,
    weight && `ui-weight-${weight}`,
    mono && 'ui-mono',
    num && 'ui-num',
    truncate && 'ui-truncate',
    wrap && 'ui-wrap-anywhere',
  ]
    .filter(Boolean)
    .join(' ');
}

export function Text({ as: As = 'span', children, id, for: htmlFor, ...style }: TextProps) {
  return (
    <As class={textClass(style)} id={id} for={htmlFor}>
      {children}
    </As>
  );
}

/** A titled block of text: the heading level carries structure, size carries emphasis. */
export function Heading({
  level = 2,
  size = 'md',
  id,
  children,
}: {
  level?: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  id?: string;
  children: ComponentChildren;
}) {
  const As: 'h1' | 'h2' | 'h3' = `h${level}`;
  return (
    <As id={id} class={`ui-text ui-text-${size} ui-weight-medium ui-heading`}>
      {children}
    </As>
  );
}

export function Link({
  href,
  onClick,
  tone = 'accent',
  external,
  children,
  label,
}: {
  href?: string;
  onClick?: () => void;
  tone?: 'accent' | 'default' | 'muted';
  external?: boolean;
  label?: string;
  children: ComponentChildren;
}) {
  const cls = `ui-link ui-link-${tone}`;
  if (!href)
    return (
      <button type="button" class={cls} onClick={onClick} aria-label={label}>
        {children}
      </button>
    );
  return (
    <a
      class={cls}
      href={href}
      onClick={onClick}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function Kbd({ children }: { children: ComponentChildren }) {
  return <kbd class="ui-kbd">{children}</kbd>;
}

export function Code({ children }: { children: ComponentChildren }) {
  return <code class="ui-code">{children}</code>;
}
