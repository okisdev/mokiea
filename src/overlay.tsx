import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type Placement,
} from '@floating-ui/dom';
import { CircleAlert, CircleCheck, X } from 'lucide-preact';
import type { ComponentChildren, RefObject, VNode } from 'preact';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Positions a `popover` element against its anchor in the top layer, so no card or table clips it. */
export function useFloating(
  anchor: RefObject<HTMLElement | null>,
  floating: RefObject<HTMLElement | null>,
  open: boolean,
  {
    placement = 'bottom-start',
    gap = 6,
    matchWidth = false,
  }: { placement?: Placement; gap?: number; matchWidth?: boolean } = {},
) {
  const optionsRef = useRef({ anchor, floating, placement, gap, matchWidth });
  optionsRef.current = { anchor, floating, placement, gap, matchWidth };
  useLayoutEffect(() => {
    const { anchor, floating, placement, gap, matchWidth } = optionsRef.current;
    const a = anchor.current;
    const f = floating.current;
    if (!open || !a || !f) return;
    if (!f.matches(':popover-open')) f.showPopover();
    const update = () =>
      void computePosition(a, f, {
        strategy: 'fixed',
        placement,
        middleware: [
          offset(gap),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
          size({
            padding: 8,
            apply({ rects, availableHeight }) {
              f.style.maxHeight = `${Math.max(160, availableHeight)}px`;
              if (matchWidth) f.style.minWidth = `${rects.reference.width}px`;
            },
          }),
        ],
      }).then(({ x, y }) => {
        f.style.left = `${x}px`;
        f.style.top = `${y}px`;
      });
    const stop = autoUpdate(a, f, update);
    return () => {
      stop();
      if (f.matches(':popover-open')) f.hidePopover();
    };
  }, [open]);
}

/** Closes on Escape and on a press outside every given element. Escape stops here so an enclosing dialog stays open. */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  refs: RefObject<HTMLElement | null>[],
) {
  const dismissRef = useRef({ onClose, refs });
  dismissRef.current = { onClose, refs };
  useEffect(() => {
    if (!open) return;
    const { onClose, refs } = dismissRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    const onDown = (event: PointerEvent) => {
      if (!refs.some((ref) => ref.current?.contains(event.target as Node))) onClose();
    };
    addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open]);
}

function focusFirst(root: HTMLElement | null) {
  const target =
    root?.querySelector<HTMLElement>('[autofocus], [data-autofocus]') ??
    root?.querySelector<HTMLElement>(FOCUSABLE);
  target?.focus();
}

export function Tooltip({
  content,
  placement = 'top',
  children,
}: {
  content: ComponentChildren;
  placement?: Placement;
  children: ComponentChildren;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  useFloating(anchor, bubble, open, { placement, gap: 6 });
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open]);
  if (content === undefined || content === null || content === '') return <>{children}</>;
  const show = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  return (
    <span
      ref={anchor}
      class="ui-anchor"
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') show(450);
      }}
      onPointerLeave={hide}
      onFocusIn={(event) => {
        if ((event.target as HTMLElement).matches(':focus-visible')) show(0);
      }}
      onFocusOut={hide}
      onPointerDown={hide}
    >
      {children}
      {open && (
        <div ref={bubble} popover="manual" role="tooltip" id={id} class="ui-tooltip">
          {content}
        </div>
      )}
    </span>
  );
}

export interface PopoverTrigger {
  open: boolean;
  toggle: () => void;
}

export function Popover({
  trigger,
  placement = 'bottom-end',
  label,
  width,
  children,
}: {
  trigger: (state: PopoverTrigger) => VNode;
  placement?: Placement;
  label: string;
  width?: number;
  children: ComponentChildren | ((close: () => void) => ComponentChildren);
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    if (panel.current?.contains(document.activeElement))
      anchor.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  };
  useFloating(anchor, panel, open, { placement });
  useDismiss(open, close, [anchor, panel]);
  useEffect(() => {
    if (open) requestAnimationFrame(() => focusFirst(panel.current));
  }, [open]);
  return (
    <span ref={anchor} class="ui-anchor">
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div
          ref={panel}
          popover="manual"
          role="dialog"
          aria-label={label}
          class="ui-popover"
          style={width ? { width: `${width}px` } : undefined}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </span>
  );
}

export interface MenuItem {
  label: ComponentChildren;
  icon?: ComponentChildren;
  description?: ComponentChildren;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

export function Menu({
  trigger,
  items,
  placement = 'bottom-end',
  label,
}: {
  trigger: (state: PopoverTrigger) => VNode;
  items: MenuItem[];
  placement?: Placement;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) anchor.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  };
  useFloating(anchor, list, open, { placement });
  useDismiss(open, () => close(false), [anchor, list]);
  useEffect(() => {
    if (open)
      requestAnimationFrame(() =>
        list.current
          ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
          ?.focus(),
      );
  }, [open]);
  const move = (event: KeyboardEvent) => {
    const entries = [
      ...(list.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? []),
    ];
    const at = entries.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === 'ArrowDown'
        ? at + 1
        : event.key === 'ArrowUp'
          ? at - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? entries.length - 1
              : undefined;
    if (next === undefined) {
      if (event.key === 'Tab') close(false);
      return;
    }
    event.preventDefault();
    entries[(next + entries.length) % entries.length]?.focus();
  };
  return (
    <span ref={anchor} class="ui-anchor">
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div
          ref={list}
          popover="manual"
          role="menu"
          aria-label={label}
          class="ui-menu"
          onKeyDown={move}
        >
          {items.map((item, index) => {
            const body = (
              <>
                {item.icon && <span class="ui-menu-icon">{item.icon}</span>}
                <span class="ui-menu-text">
                  <span>{item.label}</span>
                  {item.description && <span class="ui-menu-desc">{item.description}</span>}
                </span>
              </>
            );
            const cls = `ui-menu-item${item.danger ? ' ui-menu-danger' : ''}`;
            return item.href && !item.disabled ? (
              <a
                key={index}
                role="menuitem"
                tabIndex={-1}
                class={cls}
                href={item.href}
                onClick={() => close(false)}
              >
                {body}
              </a>
            ) : (
              <button
                key={index}
                type="button"
                role="menuitem"
                tabIndex={-1}
                class={cls}
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (item.disabled) return;
                  close();
                  item.onSelect?.();
                }}
              >
                {body}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

function useModal(onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  useLayoutEffect(() => {
    const onClose = closeRef.current;
    const dialog = ref.current;
    if (!dialog) return;
    opener.current = document.activeElement;
    dialog.showModal();
    focusFirst(dialog.querySelector('.ui-modal-body') ?? dialog);
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.close();
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, []);
  const onClick = (event: MouseEvent) => {
    if (event.target === ref.current) onClose();
  };
  return { ref, onClick };
}

export interface DialogProps {
  title: ComponentChildren;
  description?: ComponentChildren;
  onClose: () => void;
  footer?: ComponentChildren;
  size?: 'sm' | 'md' | 'lg';
  children?: ComponentChildren;
}

/** A centered modal; mount it to open it. */
export function Dialog({
  title,
  description,
  onClose,
  footer,
  size = 'md',
  children,
}: DialogProps) {
  const { ref, onClick } = useModal(onClose);
  const id = useId();
  return (
    <dialog ref={ref} class={`ui-dialog ui-dialog-${size}`} aria-labelledby={id} onClick={onClick}>
      <div class="ui-modal-head">
        <div class="ui-grow">
          <h2 id={id} class="ui-text ui-text-lg ui-weight-medium">
            {title}
          </h2>
          {description && <p class="ui-text ui-tone-muted ui-modal-desc">{description}</p>}
        </div>
        <button
          type="button"
          class="ui-icon-button ui-button-ghost ui-icon-button-md"
          aria-label="关闭"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div class="ui-modal-body">{children}</div>
      {footer && <div class="ui-modal-foot">{footer}</div>}
    </dialog>
  );
}

/** A bare modal panel docked to an edge of the viewport; mount it to open it. */
export function Sheet({
  placement,
  label,
  labelledBy,
  onClose,
  size,
  children,
}: {
  placement: 'left' | 'right' | 'top';
  label?: string;
  labelledBy?: string;
  onClose: () => void;
  size?: 'md' | 'lg';
  children: ComponentChildren;
}) {
  const { ref, onClick } = useModal(onClose);
  return (
    <dialog
      ref={ref}
      class={`ui-sheet ui-sheet-${placement}${size ? ` ui-sheet-${size}` : ''}`}
      aria-label={label}
      aria-labelledby={labelledBy}
      onClick={onClick}
    >
      <div class="ui-sheet-panel">{children}</div>
    </dialog>
  );
}

export interface DrawerProps {
  title: ComponentChildren;
  subtitle?: ComponentChildren;
  /** a leading visual such as an Avatar or IconBox */
  icon?: ComponentChildren;
  actions?: ComponentChildren;
  footer?: ComponentChildren;
  onClose: () => void;
  size?: 'md' | 'lg';
  children?: ComponentChildren;
}

/** A side sheet for inspecting or editing one item; mount it to open it. */
export function Drawer({
  title,
  subtitle,
  icon,
  actions,
  footer,
  onClose,
  size = 'md',
  children,
}: DrawerProps) {
  const id = useId();
  return (
    <Sheet placement="right" size={size} labelledBy={id} onClose={onClose}>
      <div class="ui-modal-head">
        {icon}
        <div class="ui-grow">
          <h2 id={id} class="ui-text ui-text-md ui-weight-medium ui-truncate">
            {title}
          </h2>
          {subtitle && <p class="ui-text ui-text-xs ui-tone-muted ui-truncate">{subtitle}</p>}
        </div>
        {actions}
        <button
          type="button"
          class="ui-icon-button ui-button-ghost ui-icon-button-md"
          aria-label="关闭"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div class="ui-modal-body">{children}</div>
      {footer && <div class="ui-modal-foot">{footer}</div>}
    </Sheet>
  );
}

export interface ToastItem {
  id: number;
  kind: 'info' | 'error';
  text: string;
}

let nextToastId = 0;
let toastItems: ToastItem[] = [];
const toastSubscribers = new Set<(items: ToastItem[]) => void>();

export function subscribeToasts(subscriber: (items: ToastItem[]) => void) {
  toastSubscribers.add(subscriber);
  subscriber(toastItems);
  return () => {
    toastSubscribers.delete(subscriber);
  };
}

export function toast(text: string, kind: ToastItem['kind'] = 'info') {
  const id = ++nextToastId;
  toastItems = [...toastItems, { id, kind, text }];
  for (const subscriber of toastSubscribers) subscriber(toastItems);
  setTimeout(() => {
    toastItems = toastItems.filter((item) => item.id !== id);
    for (const subscriber of toastSubscribers) subscriber(toastItems);
  }, kind === 'error' ? 6000 : 3500);
}

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>(toastItems);
  useEffect(() => subscribeToasts(setItems), []);
  return items;
}

export function Toaster({ toasts }: { toasts: ToastItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.matches(':popover-open')) el.hidePopover();
    if (toasts.length) el.showPopover();
  }, [toasts]);
  return (
    <div ref={ref} popover="manual" class="ui-toaster" aria-live="polite">
      {toasts.map((item) => (
        <div
          key={item.id}
          class={`ui-toast${item.kind === 'error' ? ' ui-toast-error' : ''}`}
          role={item.kind === 'error' ? 'alert' : 'status'}
        >
          {item.kind === 'error' ? <CircleAlert size={16} /> : <CircleCheck size={16} />}
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}
