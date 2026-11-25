import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  RANGE_PRESETS,
  rangeLabel,
  resolveRange,
  sameRange,
  startOfDay,
  type Range,
  type RangePreset,
} from './range';
import { Input } from './form';
import { useDismiss, useFloating } from './overlay';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parse = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
const clock = (ms: number) => {
  const date = new Date(ms);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
function parseClock(value: string) {
  const match = /^(\d{1,2})(?::?(\d{2}))?$/.exec(value.trim());
  return match
    ? `${pad(Math.min(23, Number(match[1])))}:${pad(Math.min(59, Number(match[2] ?? 0)))}`
    : undefined;
}
const at = (day: string, time: string) => {
  const [h, m] = time.split(':').map(Number);
  const date = parse(day)!;
  date.setHours(h, m, 0, 0);
  return date.getTime();
};

function MonthGrid({
  focus,
  setFocus,
  allowed,
  selected,
  inRange,
  onPick,
  grid,
}: {
  focus: Date;
  setFocus: (date: Date) => void;
  allowed: (day: string) => boolean;
  selected: (day: string) => boolean;
  inRange?: (day: string) => boolean;
  onPick: (day: string) => void;
  grid?: { current: HTMLDivElement | null };
}) {
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(first.getFullYear(), first.getMonth(), i - lead + 1),
  );
  const shift = (days: number, months = 0) =>
    setFocus(new Date(focus.getFullYear(), focus.getMonth() + months, focus.getDate() + days));
  const onKey = (event: KeyboardEvent) => {
    const moves: Record<string, () => void> = {
      ArrowLeft: () => shift(-1),
      ArrowRight: () => shift(1),
      ArrowUp: () => shift(-7),
      ArrowDown: () => shift(7),
      PageUp: () => shift(0, -1),
      PageDown: () => shift(0, 1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      moves[event.key]();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const day = iso(focus);
      if (allowed(day)) onPick(day);
    }
  };
  const today = iso(new Date());
  return (
    <div>
      <div class="ui-calendar-head">
        <button
          type="button"
          class="ui-icon-button ui-button-ghost ui-icon-button-sm"
          aria-label="上个月"
          onClick={() => shift(0, -1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span class="ui-text ui-weight-medium ui-num" aria-live="polite">
          {focus.getFullYear()} 年 {focus.getMonth() + 1} 月
        </span>
        <button
          type="button"
          class="ui-icon-button ui-button-ghost ui-icon-button-sm"
          aria-label="下个月"
          onClick={() => shift(0, 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div ref={grid} class="ui-calendar-grid" role="grid" onKeyDown={onKey}>
        {WEEK.map((day) => (
          <span key={day} class="ui-calendar-dow" role="columnheader">
            {day}
          </span>
        ))}
        {days.map((date) => {
          const day = iso(date);
          const outside = date.getMonth() !== focus.getMonth();
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              tabIndex={day === iso(focus) ? 0 : -1}
              disabled={!allowed(day)}
              aria-selected={selected(day)}
              aria-current={day === today ? 'date' : undefined}
              data-in-range={inRange?.(day) || undefined}
              class={`ui-calendar-day${outside ? ' ui-calendar-outside' : ''}`}
              onClick={() => {
                setFocus(date);
                onPick(day);
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface DatePickerProps {
  /** `YYYY-MM-DD`, or empty for no date */
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export function DatePicker({
  value,
  onChange,
  label,
  min,
  max,
  placeholder = '选择日期',
  size = 'md',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(() => parse(value) ?? new Date());
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) anchor.current?.focus();
  };
  useFloating(anchor, panel, open, { placement: 'bottom-start', gap: 4 });
  useDismiss(open, () => close(false), [anchor, panel]);
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    if (open) setFocus(parse(valueRef.current) ?? new Date());
  }, [open]);
  useEffect(() => {
    if (open)
      requestAnimationFrame(() =>
        grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus(),
      );
  }, [open, focus]);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        class={`ui-select ui-select-field ui-select-${size}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}：${value || placeholder}`}
        onClick={() => setOpen(!open)}
      >
        <span class="ui-select-icon" aria-hidden="true">
          <CalendarDays size={15} />
        </span>
        <span class={`ui-select-value ui-num${value ? '' : ' ui-placeholder'}`}>
          {value || placeholder}
        </span>
      </button>
      {open && (
        <div
          ref={panel}
          popover="manual"
          role="dialog"
          aria-label={label}
          class="ui-popover ui-calendar"
        >
          <MonthGrid
            grid={grid}
            focus={focus}
            setFocus={setFocus}
            allowed={(day) => (!min || day >= min) && (!max || day <= max)}
            selected={(day) => day === value}
            onPick={(day) => {
              onChange(day);
              close();
            }}
          />
          {value && (
            <div class="ui-calendar-foot">
              <button
                type="button"
                class="ui-link ui-link-muted"
                onClick={() => {
                  onChange('');
                  close();
                }}
              >
                清除
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** A date and a 24 hour time; the value is `YYYY-MM-DDTHH:mm`, or empty. */
export function DateTimePicker({
  value,
  onChange,
  label,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  max?: string;
}) {
  const [date = '', time = ''] = value.split('T');
  const [draft, setDraft] = useState(time);
  useEffect(() => setDraft(time), [time]);
  const commit = (nextDate: string, nextTime: string) =>
    onChange(nextDate ? `${nextDate}T${nextTime || '00:00'}` : '');
  const normalize = () => {
    const next = parseClock(draft);
    if (!next) {
      setDraft(time);
      return;
    }
    setDraft(next);
    commit(date || iso(new Date()), next);
  };
  return (
    <span class="ui-datetime">
      <DatePicker
        value={date}
        label={`${label}日期`}
        min={min?.split('T')[0]}
        max={max?.split('T')[0]}
        onChange={(next) => commit(next, time)}
      />
      <span class="ui-datetime-time">
        <Input
          value={draft}
          placeholder="00:00"
          inputMode="numeric"
          aria-label={`${label}时间`}
          onChange={setDraft}
          onBlur={normalize}
          onKeyDown={(event) => {
            if (event.key === 'Enter') normalize();
          }}
        />
      </span>
    </span>
  );
}

export interface RangePickerProps {
  value: Range;
  onChange: (value: Range) => void;
  /** Presets offered, in order; defaults to every preset */
  presets?: RangePreset[];
  /** Earliest selectable time, usually the data's retention, as epoch milliseconds */
  min?: number;
  label?: string;
  size?: 'sm' | 'md';
}

/** One control for every time window: presets that follow the clock, or a fixed start and end picked on a calendar. */
export function RangePicker({
  value,
  onChange,
  presets,
  min,
  label = '时间范围',
  size = 'sm',
}: RangePickerProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [focus, setFocus] = useState(() => new Date());
  const options = presets
    ? RANGE_PRESETS.filter((preset) => presets.includes(preset.value))
    : RANGE_PRESETS;
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) anchor.current?.focus();
  };
  useFloating(anchor, panel, open, { placement: 'bottom-end', gap: 4 });
  useDismiss(open, () => close(false), [anchor, panel]);
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    if (!open) return;
    const { from, to } = resolveRange(valueRef.current);
    setStart(iso(new Date(from)));
    setEnd(iso(new Date(to)));
    setStartTime(clock(from));
    setEndTime(clock(to));
    setFocus(new Date(to));
  }, [open]);
  const now = Date.now();
  const minDay = min === undefined ? undefined : iso(new Date(startOfDay(min)));
  const allowed = (day: string) => day <= iso(new Date(now)) && (!minDay || day >= minDay);
  const pick = (day: string) => {
    if (!start || end) {
      setStart(day);
      setEnd('');
      setStartTime('00:00');
      setEndTime('23:59');
      return;
    }
    if (day < start) {
      setEnd(start);
      setStart(day);
    } else setEnd(day);
  };
  const from = start ? at(start, startTime) : undefined;
  const last = end || start;
  const to = last
    ? Math.min(at(last, endTime) + (endTime === '23:59' ? 59_999 : 0), now)
    : undefined;
  const valid =
    from !== undefined && to !== undefined && to > from && (min === undefined || to > min);
  const apply = () => {
    if (!valid) return;
    onChange({ from: Math.max(from, min ?? from), to: to });
    close();
  };
  const timeField = (labelText: string, draft: string, setDraft: (value: string) => void) => (
    <Input
      size="sm"
      value={draft}
      placeholder="00:00"
      inputMode="numeric"
      aria-label={labelText}
      onChange={setDraft}
      onBlur={() => setDraft(parseClock(draft) ?? '00:00')}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          setDraft(parseClock(draft) ?? '00:00');
        }
      }}
    />
  );
  return (
    <>
      <button
        ref={anchor}
        type="button"
        class={`ui-select ui-select-${size}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}：${rangeLabel(value)}`}
        onClick={() => setOpen(!open)}
      >
        <span class="ui-select-icon" aria-hidden="true">
          <CalendarDays size={14} />
        </span>
        <span class="ui-select-value ui-num">{rangeLabel(value)}</span>
      </button>
      {open && (
        <div
          ref={panel}
          popover="manual"
          role="dialog"
          aria-label={label}
          class="ui-popover ui-range"
        >
          <div class="ui-range-presets" role="group" aria-label="常用范围">
            {options.map((preset) => (
              <button
                key={preset.value}
                type="button"
                class="ui-range-preset"
                aria-pressed={sameRange(value, { preset: preset.value })}
                onClick={() => {
                  onChange({ preset: preset.value });
                  close();
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div class="ui-range-custom">
            <MonthGrid
              focus={focus}
              setFocus={setFocus}
              allowed={allowed}
              selected={(day) => day === start || day === end}
              inRange={(day) => !!start && !!end && day > start && day < end}
              onPick={pick}
            />
            <div class="ui-range-times">
              <span class="ui-range-time">
                <span class="ui-text ui-text-xs ui-tone-muted">开始</span>
                <span class="ui-text ui-num">{start || '—'}</span>
                {timeField('开始时间', startTime, setStartTime)}
              </span>
              <span class="ui-range-time">
                <span class="ui-text ui-text-xs ui-tone-muted">结束</span>
                <span class="ui-text ui-num">{last || '—'}</span>
                {timeField('结束时间', endTime, setEndTime)}
              </span>
            </div>
            <div class="ui-range-foot">
              <button
                type="button"
                class="ui-button ui-button-ghost ui-button-sm"
                onClick={() => close()}
              >
                取消
              </button>
              <button
                type="button"
                class="ui-button ui-button-primary ui-button-sm"
                disabled={!valid}
                onClick={apply}
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
