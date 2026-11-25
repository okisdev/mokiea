import { Loader2 } from 'lucide-preact';
import type { ComponentChildren, TargetedMouseEvent } from 'preact';
import { Tooltip } from './overlay';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** leading icon, sized by the button */
  icon?: ComponentChildren;
  iconRight?: ComponentChildren;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  href?: string;
  type?: 'button' | 'submit';
  onClick?: (event: TargetedMouseEvent<HTMLElement>) => void;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu' | 'listbox' | 'dialog';
  children?: ComponentChildren;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  block,
  href,
  type = 'button',
  onClick,
  children,
  ...aria
}: ButtonProps) {
  const cls = `ui-button ui-button-${variant} ui-button-${size}${block ? ' ui-block' : ''}`;
  const body = (
    <>
      {loading ? <Loader2 class="ui-spin" size={size === 'sm' ? 14 : 16} /> : icon}
      {children}
      {iconRight}
    </>
  );
  if (href && !disabled)
    return (
      <a class={cls} href={href} onClick={onClick} {...aria}>
        {body}
      </a>
    );
  return (
    <button
      type={type}
      class={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...aria}
    >
      {body}
    </button>
  );
}

export interface IconButtonProps {
  /** accessible name, also shown as the tooltip */
  label: string;
  icon: ComponentChildren;
  variant?: 'ghost' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  /** a count shown on the corner of the button */
  badge?: number;
  pressed?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: (event: TargetedMouseEvent<HTMLElement>) => void;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu' | 'listbox' | 'dialog';
  tooltip?: boolean;
  /** spins the icon while the action it starts is running */
  busy?: boolean;
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  badge,
  pressed,
  disabled,
  href,
  onClick,
  tooltip = true,
  busy,
  ...aria
}: IconButtonProps) {
  const cls = `ui-icon-button ui-button-${variant} ui-icon-button-${size}`;
  const name = badge ? `${label}，${badge} 条` : label;
  const body = (
    <>
      {busy ? <span class="ui-spin ui-anchor">{icon}</span> : icon}
      {!!badge && (
        <span class="ui-badge-count" aria-hidden="true">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </>
  );
  const control =
    href && !disabled ? (
      <a class={cls} href={href} aria-label={name} onClick={onClick} {...aria}>
        {body}
      </a>
    ) : (
      <button
        type="button"
        class={cls}
        aria-label={name}
        aria-pressed={pressed}
        aria-busy={busy || undefined}
        disabled={disabled}
        onClick={onClick}
        {...aria}
      >
        {body}
      </button>
    );
  return tooltip ? <Tooltip content={label}>{control}</Tooltip> : control;
}
