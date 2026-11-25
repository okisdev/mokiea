import { Info } from 'lucide-preact';
import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { Button } from './button';

export const TopbarSlots = createContext<{
  leading?: ComponentChildren;
  trailing?: ComponentChildren;
}>({});

const NARROW = '(max-width: 760px)';

/** True below the width where a top bar cannot hold a page's own controls beside its title. */
function useNarrow() {
  const [narrow, setNarrow] = useState(() => matchMedia(NARROW).matches);
  useEffect(() => {
    const query = matchMedia(NARROW);
    const change = () => setNarrow(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return narrow;
}

export interface Crumb {
  label: string;
  href?: string;
}

export interface PageProps {
  /** the page name; for nested pages pass `crumbs` instead, ending with the current page */
  title?: string;
  crumbs?: Crumb[];
  /** a Tabs row under the top bar */
  tabs?: ComponentChildren;
  /** page level controls at the end of the top bar */
  actions?: ComponentChildren;
  /** one sentence that explains the page, shown above the content */
  description?: ComponentChildren;
  /** `narrow` centers forms and settings at a reading width; `full` fits dashboards and tables */
  width?: 'full' | 'narrow';
  /** a SubNav shown beside the content */
  subnav?: ComponentChildren;
  children: ComponentChildren;
}

export function Page({
  title,
  crumbs,
  tabs,
  actions,
  description,
  width = 'full',
  subnav,
  children,
}: PageProps) {
  const slots = useContext(TopbarSlots);
  const narrow = useNarrow();
  return (
    <>
      <header class="ui-topbar">
        {slots.leading}
        {crumbs ? (
          <nav class="ui-crumbs" aria-label="面包屑">
            {crumbs.map((crumb, index) =>
              index < crumbs.length - 1 ? (
                <span key={index} class="ui-crumb">
                  <a href={crumb.href}>{crumb.label}</a>
                  <span class="ui-crumb-sep" aria-hidden="true">
                    /
                  </span>
                </span>
              ) : (
                <h1 key={index} class="ui-topbar-title">
                  {crumb.label}
                </h1>
              ),
            )}
          </nav>
        ) : (
          <h1 class="ui-topbar-title">{title}</h1>
        )}
        <span class="ui-grow" />
        {actions && !narrow && <div class="ui-topbar-actions">{actions}</div>}
        {slots.trailing}
      </header>
      {actions && narrow && <div class="ui-page-toolbar">{actions}</div>}
      {tabs && <div class="ui-page-tabs">{tabs}</div>}
      <div class={`ui-page-frame${subnav ? ' ui-page-frame-subnav' : ''}`}>
        {subnav}
        <main class={`ui-page ui-page-${width}`}>
          {description && <p class="ui-page-lead">{description}</p>}
          {children}
        </main>
      </div>
    </>
  );
}

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number | string;
  href?: string;
}

/** Switches between the views of one page. `href` options render as links so each view has a URL. */
/** Keeps the selected item of a horizontally scrolling strip in view, so a tab past the edge never hides the current page. */
function useActiveInView(selector: string, key: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>(selectorRef.current)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [key]);
  return ref;
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: TabOption<T>[];
  onChange?: (value: T) => void;
  label: string;
}) {
  const ref = useActiveInView('[aria-selected="true"]', value);
  if (options.length < 2) return null;
  return (
    <div ref={ref} class="ui-tabs" role="tablist" aria-label={label}>
      {options.map((option) => {
        const body = (
          <>
            {option.label}
            {option.count !== undefined && <span class="ui-tab-count">{option.count}</span>}
          </>
        );
        return option.href ? (
          <a
            key={option.value}
            role="tab"
            class="ui-tab"
            href={option.href}
            aria-selected={option.value === value}
          >
            {body}
          </a>
        ) : (
          <button
            key={option.value}
            type="button"
            role="tab"
            class="ui-tab"
            aria-selected={option.value === value}
            onClick={() => onChange?.(option.value)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ComponentChildren;
  count?: number | string;
}

export function SubNav({
  label,
  groups,
  current,
}: {
  label: string;
  groups: { title?: string; items: SubNavItem[] }[];
  current: string;
}) {
  const ref = useActiveInView('[aria-current="page"]', current);
  return (
    <nav ref={ref} class="ui-subnav" aria-label={label}>
      {groups.map((group, index) => (
        <div key={group.title ?? index} class="ui-subnav-group">
          {group.title && <div class="ui-subnav-title">{group.title}</div>}
          {group.items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              class="ui-subnav-item"
              aria-current={item.id === current ? 'page' : undefined}
            >
              {item.icon}
              <span class="ui-grow ui-truncate">{item.label}</span>
              {item.count !== undefined && <span class="ui-subnav-count">{item.count}</span>}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** One setting: what it is on the left, its control on the right. Stack them inside a Card. */
export function SettingRow({
  title,
  description,
  children,
}: {
  title: ComponentChildren;
  description?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <div class="ui-setting">
      <div class="ui-grow">
        <div class="ui-weight-medium">{title}</div>
        {description && <div class="ui-text ui-text-xs ui-tone-muted">{description}</div>}
      </div>
      {children && <div class="ui-setting-control">{children}</div>}
    </div>
  );
}

export function SaveBar({
  count,
  busy,
  onDiscard,
  onSave,
  label = '保存并生效',
}: {
  count: number;
  busy?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  label?: string;
}) {
  if (!count) return null;
  return (
    <div class="ui-savebar" role="status">
      <Info size={16} />
      <span class="ui-grow">有 {count} 项未保存的修改</span>
      <Button variant="ghost" size="sm" disabled={busy} onClick={onDiscard}>
        放弃
      </Button>
      <Button variant="primary" size="sm" loading={busy} onClick={onSave}>
        {label}
      </Button>
    </div>
  );
}
