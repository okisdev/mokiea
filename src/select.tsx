import { Check, ChevronDown } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { useDismiss, useFloating } from './overlay';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: ComponentChildren;
  disabled?: boolean;
}

export interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** accessible name; required unless the select sits inside a Field */
  label?: string;
  placeholder?: string;
  /** `chip` is a compact filter that shows `prefix: value` and turns blue once it moves off the first option */
  variant?: 'field' | 'chip';
  prefix?: string;
  icon?: ComponentChildren;
  size?: 'sm' | 'md';
  disabled?: boolean;
  invalid?: boolean;
  /** adds a filter box; on by default past twelve options */
  searchable?: boolean;
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  placeholder = '请选择',
  variant = 'field',
  prefix,
  icon,
  size = 'md',
  disabled,
  invalid,
  searchable = options.length > 12,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const id = useId();
  const current = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(needle) ||
          option.value.toLowerCase().includes(needle),
      )
    : options;
  const close = (refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) anchor.current?.focus();
  };
  useFloating(anchor, panel, open, { placement: 'bottom-start', gap: 4, matchWidth: true });
  useDismiss(open, () => close(false), [anchor, panel]);
  const openingRef = useRef({ visible, value, searchable });
  openingRef.current = { visible, value, searchable };
  useEffect(() => {
    if (!open) return;
    const { visible, value, searchable } = openingRef.current;
    setActive(
      Math.max(
        0,
        visible.findIndex((option) => option.value === value),
      ),
    );
    requestAnimationFrame(() => (searchable ? search.current : list.current)?.focus());
  }, [open]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);
  const pick = (option?: SelectOption<T>) => {
    if (!option || option.disabled) return;
    onChange(option.value);
    close();
  };
  const step = (from: number, delta: number) => {
    for (let i = 1; i <= visible.length; i++) {
      const next = (from + delta * i + visible.length) % visible.length;
      if (!visible[next].disabled) return next;
    }
    return from;
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(step(active, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(step(active, -1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(step(-1, 1));
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(step(visible.length, -1));
    } else if (event.key === 'Enter' || (event.key === ' ' && !searchable)) {
      event.preventDefault();
      pick(visible[active]);
    } else if (event.key === 'Tab') close(false);
    else if (!searchable && event.key.length === 1) {
      const now = Date.now();
      typed.current = {
        text: (now - typed.current.at < 600 ? typed.current.text : '') + event.key.toLowerCase(),
        at: now,
      };
      const hit = visible.findIndex((option) =>
        option.label.toLowerCase().startsWith(typed.current.text),
      );
      if (hit >= 0) setActive(hit);
    }
  };
  const chip = variant === 'chip';
  const changed = chip && value !== options[0]?.value;
  return (
    <>
      <button
        ref={anchor}
        type="button"
        class={`ui-select ui-select-${variant} ui-select-${size}${invalid ? ' ui-invalid' : ''}`}
        data-active={changed || undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={label ? `${label}：${current?.label ?? placeholder}` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {icon && (
          <span class="ui-select-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {chip && prefix && <span class="ui-select-prefix">{prefix}</span>}
        <span class={`ui-select-value${current ? '' : ' ui-placeholder'}`}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={14} class="ui-select-caret" aria-hidden="true" />
      </button>
      {open && (
        <div ref={panel} popover="manual" class="ui-listbox-panel" onKeyDown={onKey}>
          {searchable && (
            <input
              ref={search}
              class="ui-listbox-search"
              value={query}
              placeholder="筛选…"
              aria-label="筛选选项"
              aria-controls={id}
              aria-activedescendant={visible[active] ? `${id}-${active}` : undefined}
              onInput={(event) => {
                setQuery(event.currentTarget.value);
                setActive(0);
              }}
            />
          )}
          <ul
            ref={list}
            id={id}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={visible[active] ? `${id}-${active}` : undefined}
            class="ui-listbox"
          >
            {visible.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-${index}`}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                class={`ui-option${index === active ? ' ui-option-active' : ''}`}
                onPointerMove={() => {
                  if (index !== active) setActive(index);
                }}
                onClick={() => pick(option)}
              >
                {option.icon && <span class="ui-option-icon">{option.icon}</span>}
                <span class="ui-option-text">
                  <span>{option.label}</span>
                  {option.description && <span class="ui-option-desc">{option.description}</span>}
                </span>
                {option.value === value && <Check size={14} class="ui-option-check" />}
              </li>
            ))}
            {!visible.length && (
              <li class="ui-option-empty" role="presentation">
                没有匹配的选项
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
