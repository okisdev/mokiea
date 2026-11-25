import { Check, Copy, Eye, EyeOff, Search, X } from 'lucide-preact';
import type { ComponentChildren, InputHTMLAttributes, TargetedFocusEvent, TargetedKeyboardEvent } from 'preact';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { toast } from './overlay';
import { Button } from './button';

export interface InputProps {
  value: string | number;
  onChange?: (value: string) => void;
  type?: 'text' | 'password' | 'number' | 'email' | 'url' | 'search';
  placeholder?: string;
  /** leading icon inside the field */
  icon?: ComponentChildren;
  /** trailing unit or hint inside the field, such as "ms" */
  suffix?: ComponentChildren;
  size?: 'sm' | 'md' | 'lg';
  mono?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  name?: string;
  autocomplete?: string;
  inputMode?: 'numeric' | 'decimal' | 'text' | 'url' | 'email';
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
  id?: string;
  'aria-label'?: string;
  onKeyDown?: (event: TargetedKeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: (event: TargetedFocusEvent<HTMLInputElement>) => void;
}

export function Input({
  value,
  onChange,
  type = 'text',
  size = 'md',
  icon,
  suffix,
  mono,
  invalid,
  autoFocus,
  ...rest
}: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const secret = type === 'password';
  const inputAttributes = { type: secret && revealed ? 'text' : type } as InputHTMLAttributes<HTMLInputElement>;
  return (
    <span
      class={`ui-input ui-input-${size}${invalid ? ' ui-invalid' : ''}${rest.disabled ? ' ui-disabled' : ''}`}
    >
      {icon && (
        <span class="ui-input-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        {...rest}
        {...inputAttributes}
        autofocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        aria-invalid={invalid || undefined}
        class={mono ? 'ui-mono' : undefined}
        value={value}
        spellcheck={false}
        onInput={(event) => onChange?.(event.currentTarget.value)}
      />
      {suffix && <span class="ui-input-suffix">{suffix}</span>}
      {secret && (
        <button
          type="button"
          class="ui-input-clear"
          aria-label={revealed ? '隐藏' : '显示'}
          aria-pressed={revealed}
          onClick={() => setRevealed(!revealed)}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索',
  label,
  size = 'md',
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md';
  autoFocus?: boolean;
}) {
  return (
    <span class={`ui-input ui-input-${size} ui-search`}>
      <span class="ui-input-icon" aria-hidden="true">
        <Search size={15} />
      </span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        data-autofocus={autoFocus || undefined}
        spellcheck={false}
        autocomplete="off"
        onInput={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.stopPropagation();
            onChange('');
          }
        }}
      />
      {value && (
        <button type="button" class="ui-input-clear" aria-label="清除" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </span>
  );
}

export function Textarea({
  value,
  onChange,
  rows = 4,
  mono,
  readOnly,
  placeholder,
  invalid,
  disabled,
  'aria-label': ariaLabel,
  onFocus,
}: {
  value: string;
  onChange?: (value: string) => void;
  rows?: number;
  mono?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  onFocus?: (event: TargetedFocusEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea
      class={`ui-textarea${mono ? ' ui-mono' : ''}${invalid ? ' ui-invalid' : ''}`}
      rows={rows}
      value={value}
      readOnly={readOnly}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      spellcheck={false}
      onFocus={onFocus}
      onInput={(event) => onChange?.(event.currentTarget.value)}
    />
  );
}

/** Labels one control. The label element wraps the control so clicking the label focuses it. */
/** `group` is for several controls such as chips or a segmented choice, which a label element would name and click as its first control only. */
export function Field({
  label,
  description,
  error,
  optional,
  group,
  children,
}: {
  label: ComponentChildren;
  description?: ComponentChildren;
  error?: ComponentChildren;
  optional?: boolean;
  group?: boolean;
  children: ComponentChildren;
}) {
  const id = useId();
  const head = (
    <span class="ui-field-label" id={group ? id : undefined}>
      {label}
      {optional && <span class="ui-field-optional">可选</span>}
    </span>
  );
  return (
    <div class="ui-field">
      {group ? (
        <div class="ui-field-control" role="group" aria-labelledby={id}>
          {head}
          {children}
        </div>
      ) : (
        <label class="ui-field-control">
          {head}
          {children}
        </label>
      )}
      {error ? (
        <span class="ui-field-error" role="alert">
          {error}
        </span>
      ) : (
        description && <span class="ui-field-desc">{description}</span>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ComponentChildren;
  description?: ComponentChildren;
  disabled?: boolean;
}) {
  return (
    <label class={`ui-checkbox${disabled ? ' ui-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span class="ui-checkbox-box" aria-hidden="true">
        <Check size={12} strokeWidth={3} />
      </span>
      <span class="ui-checkbox-text">
        <span>{label}</span>
        {description && <span class="ui-field-desc">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      class="ui-switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: ComponentChildren;
  title?: string;
}

/** Picks one of two to five peer views or ranges. Page level navigation uses Tabs instead. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
  block,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  block?: boolean;
}) {
  const group = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<{ x: number; width: number; moved: boolean }>();
  useLayoutEffect(() => {
    const pressed = group.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!pressed) return setMark(undefined);
    setMark((previous) => ({
      x: pressed.offsetLeft,
      width: pressed.offsetWidth,
      moved: !!previous,
    }));
  }, [value, options.length]);
  return (
    <div
      ref={group}
      class={`ui-segmented ui-segmented-${size}${block ? ' ui-block' : ''}`}
      role="group"
      aria-label={label}
    >
      {mark && (
        <span
          class="ui-segmented-mark"
          data-moved={mark.moved || undefined}
          style={{ transform: `translateX(${mark.x}px)`, width: `${mark.width}px` }}
          aria-hidden="true"
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: ComponentChildren;
  icon?: ComponentChildren;
  count?: number;
}

/** Turns any number of values on or off, for a filter whose choices fit on screen; nothing on means no constraint. */
export function ChipGroup<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T[];
  options: ChipOption<T>[];
  onChange: (value: T[]) => void;
  label: string;
}) {
  return (
    <div class="ui-chips" role="group" aria-label={label}>
      {options.map((option) => {
        const on = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            class="ui-chip"
            aria-pressed={on}
            onClick={() =>
              onChange(
                on ? value.filter((item) => item !== option.value) : [...value, option.value],
              )
            }
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && <span class="ui-chip-count ui-num">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function CopyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const id = useId();
  const field = useRef<HTMLDivElement>(null);
  const copy = async () => {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch {}
    if (!copied) {
      field.current
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
        ?.select();
      try {
        // oxlint-disable-next-line typescript/no-deprecated -- the Clipboard API is missing on plain http LAN origins.
        copied = document.execCommand('copy');
      } catch {}
    }
    setState(copied ? 'copied' : 'failed');
    if (copied) {
      toast('已复制');
      setTimeout(() => setState('idle'), 1600);
    }
  };
  const select = (event: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
    event.currentTarget.select();
  return (
    <div class="ui-field">
      <span class="ui-field-label" id={id}>
        {label}
      </span>
      <div class="ui-copy" ref={field}>
        {multiline ? (
          <Textarea
            value={value}
            readOnly
            mono
            rows={Math.min(value.split('\n').length, 16)}
            aria-label={label}
            onFocus={select}
          />
        ) : (
          <Input value={value} readOnly mono aria-label={label} onFocus={select} />
        )}
        <Button
          size="md"
          icon={state === 'copied' ? <Check size={14} /> : <Copy size={14} />}
          aria-label={`复制${label}`}
          onClick={() => void copy()}
        >
          复制
        </Button>
      </div>
      {state === 'failed' && (
        <span class="ui-field-error" role="alert">
          复制失败，请选中内容后手动复制
        </span>
      )}
    </div>
  );
}
