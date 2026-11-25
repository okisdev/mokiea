import type { ComponentChildren } from 'preact';

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between';
type Tag =
  | 'div'
  | 'section'
  | 'header'
  | 'footer'
  | 'ul'
  | 'li'
  | 'form'
  | 'nav'
  | 'span'
  | 'label';

interface FlexProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  grow?: boolean;
  as?: Tag;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onSubmit?: (event: Event) => void;
  children?: ComponentChildren;
}

function Flex({
  direction,
  gap,
  align,
  justify,
  wrap,
  grow,
  as: As = 'div',
  children,
  ...rest
}: FlexProps & { direction: 'row' | 'column' }) {
  const cls = [
    'ui-flex',
    `ui-flex-${direction}`,
    gap !== undefined && `ui-gap-${gap}`,
    align && `ui-align-${align}`,
    justify && `ui-justify-${justify}`,
    wrap && 'ui-wrap',
    grow && 'ui-grow',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <As class={cls} {...rest}>
      {children}
    </As>
  );
}

/** Vertical flow; children stretch to the full width. */
export function Stack({ gap = 4, ...props }: FlexProps) {
  return <Flex direction="column" gap={gap} {...props} />;
}

/** Horizontal flow; children center on the cross axis unless told otherwise. */
export function Row({ gap = 2, align = 'center', ...props }: FlexProps) {
  return <Flex direction="row" gap={gap} align={align} {...props} />;
}

/** A flexible item that takes the remaining space and lets its text truncate. */
export function Grow({ children }: { children?: ComponentChildren }) {
  return <div class="ui-grow">{children}</div>;
}

export function Spacer() {
  return <span class="ui-grow" aria-hidden="true" />;
}

/** A 12 column grid whose spans collapse by the width it actually has, not the viewport. */
export function Grid({ gap = 4, children }: { gap?: Gap; children: ComponentChildren }) {
  return (
    <div class="ui-grid-scope">
      <div class={`ui-grid ui-gap-${gap}`}>{children}</div>
    </div>
  );
}

export function Span({
  cols = 12,
  children,
}: {
  cols?: 3 | 4 | 6 | 8 | 12;
  children: ComponentChildren;
}) {
  return <div class={`ui-span ui-span-${cols}`}>{children}</div>;
}

/** Equal width cells that wrap once each would fall below `min` pixels. */
export function AutoGrid({
  min = 240,
  gap = 4,
  children,
}: {
  min?: number;
  gap?: Gap;
  children: ComponentChildren;
}) {
  return (
    <div class={`ui-autogrid ui-gap-${gap}`} style={{ '--ui-min': `${min}px` }}>
      {children}
    </div>
  );
}

export function Divider({ vertical }: { vertical?: boolean }) {
  return <span class={vertical ? 'ui-divider-v' : 'ui-divider'} role="separator" />;
}

export function VisuallyHidden({ children }: { children: ComponentChildren }) {
  return <span class="ui-sr-only">{children}</span>;
}

/** Centers its content in the viewport, for whole screen states such as connecting or offline. */
export function FullScreen({ children }: { children: ComponentChildren }) {
  return <div class="ui-fullscreen">{children}</div>;
}

/** Caps content at a reading width and centers it. */
export function Container({
  width = 'md',
  children,
}: {
  width?: 'xs' | 'sm' | 'md' | 'lg';
  children: ComponentChildren;
}) {
  return <div class={`ui-container ui-container-${width}`}>{children}</div>;
}
