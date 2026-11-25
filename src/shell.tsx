import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { IconButton } from './button';
import { BrandMark } from './display';
import { Sheet, Toaster, Tooltip, useToasts } from './overlay';
import { TopbarSlots } from './page';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentChildren;
  current?: boolean;
  /** a warning dot after the label */
  dot?: boolean;
}

export interface NavGroup {
  /** omitted for the ungrouped items at the top */
  label?: string;
  items: NavItem[];
}

export interface AppShellProps {
  brand: { name: string; href: string; mark?: ComponentChildren };
  /** content under the brand, such as a workspace picker; hidden while collapsed */
  header?: ComponentChildren;
  nav: NavGroup[];
  /** items pinned to the foot of the sidebar */
  footer?: NavItem[];
  /** content at the end of every top bar */
  trailing?: ComponentChildren;
  /** localStorage key that remembers the collapsed sidebar */
  storageKey?: string;
  children: ComponentChildren;
}

function read(key: string) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {}
}

function NavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const link = (
    <a
      class="ui-sidebar-item"
      href={item.href}
      aria-current={item.current ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      onClick={onNavigate}
    >
      {item.icon}
      <span class="ui-sidebar-label">{item.label}</span>
      {item.dot && <span class="ui-sidebar-dot" role="img" aria-label="有待处理的事" />}
    </a>
  );
  return collapsed ? (
    <Tooltip content={item.label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function Sidebar({
  brand,
  header,
  nav,
  footer = [],
  collapsed,
  onToggle,
  onNavigate,
}: Omit<AppShellProps, 'children' | 'trailing' | 'storageKey'> & {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const toggle = onToggle && (
    <IconButton
      label={collapsed ? '展开侧栏' : '收起侧栏'}
      size="sm"
      icon={collapsed ? <PanelLeftOpen size={16} strokeWidth={1.75} /> : <PanelLeftClose size={16} strokeWidth={1.75} />}
      onClick={onToggle}
    />
  );
  return (
    <nav class="ui-sidebar" data-collapsed={collapsed || undefined} aria-label="主导航">
      <div class="ui-sidebar-brand">
        {collapsed && toggle ? (
          toggle
        ) : (
          <>
            <a class="ui-sidebar-brand-link" href={brand.href} onClick={onNavigate}>
              {brand.mark ?? <BrandMark />}
              <span class="ui-sidebar-label">{brand.name}</span>
            </a>
            {toggle}
          </>
        )}
      </div>
      {header && !collapsed && <div class="ui-sidebar-home">{header}</div>}
      {nav.map((group, index) =>
        group.label ? (
          <div key={group.label} class="ui-sidebar-group" role="group" aria-label={group.label}>
            <span class="ui-sidebar-heading" aria-hidden="true">
              {group.label}
            </span>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          group.items.map((item) => <NavLink key={`${index}:${item.href}`} item={item} collapsed={collapsed} onNavigate={onNavigate} />)
        ),
      )}
      <span class="ui-sidebar-spacer" />
      {footer.map((item) => (
        <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

export function AppShell({ trailing, storageKey = 'ui.sidebar.collapsed', children, ...sidebar }: AppShellProps) {
  const toasts = useToasts();
  const [collapsed, setCollapsed] = useState(() => read(storageKey));
  const [sheet, setSheet] = useState(false);
  const slots = useMemo(
    () => ({
      leading: (
        <span class="ui-mobile-only">
          <IconButton label="打开导航" icon={<MenuIcon size={18} />} tooltip={false} onClick={() => setSheet(true)} />
        </span>
      ),
      trailing,
    }),
    [trailing],
  );
  return (
    <div class="ui-app">
      <Sidebar
        {...sidebar}
        collapsed={collapsed}
        onToggle={() => {
          write(storageKey, !collapsed);
          setCollapsed(!collapsed);
        }}
      />
      {sheet && (
        <Sheet placement="left" label="导航" onClose={() => setSheet(false)}>
          <Sidebar {...sidebar} collapsed={false} onNavigate={() => setSheet(false)} />
        </Sheet>
      )}
      <div class="ui-main">
        <TopbarSlots.Provider value={slots}>{children}</TopbarSlots.Provider>
      </div>
      <Toaster toasts={toasts} />
    </div>
  );
}
