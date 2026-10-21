import { Component, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, Bell, BookOpen, Check, CheckCheck, ChevronDown, ExternalLink, LogOut, Menu as MenuIcon, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Search, Store, Sun, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiSend, queryClient, useApiMutation, useApiQuery } from '../lib/query';
import { ROLE_LABELS, usePermissions } from '../lib/permissions';
import { relative } from '../lib/format';
import { flatNav, isActive, navForRole } from './nav';
import { AdminThemeContext, THEME_OPTIONS, useAdminTheme, useAdminThemeState } from '../lib/theme';
import CommandPalette from './CommandPalette';
import Toaster from '../ui/Toaster';
import { ConfirmProvider } from '../ui/overlay';
import { Avatar, Badge, Button, ErrorState, IconButton, Kbd, Spinner, cx } from '../ui/primitives';
import '../admin.css';
import '../theme.css';

/** Close a menu, popover or drawer with Escape. */
function useEscape(open, close) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
}

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[admin] page crashed', error, info);
  }
  render() {
    if (this.state.error) {
      return <ErrorState error={{ message: 'This page hit an unexpected error. Your data is safe.' }} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

const NAV_GROUPS_KEY = 'ks-admin-nav-closed';

function readClosedGroups() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NAV_GROUPS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function SidebarNav({ collapsed, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [closed, setClosed] = useState(readClosedGroups);
  const [query, setQuery] = useState('');
  const groups = navForRole(isAdmin).map((g) => ({ ...g, items: g.items.filter((i) => !i.hiddenInNav) }));
  const q = query.trim().toLowerCase();
  const searching = !collapsed && q.length > 0;
  const shown = searching
    ? groups
        .map((g) => ({ ...g, items: g.label.toLowerCase().includes(q) ? g.items : g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length)
    : groups;
  const firstMatch = searching ? shown[0]?.items[0] : null;

  // Opening a page always reveals its group, even if it was folded away earlier.
  const activeGroup = groups.find((g) => g.items.some((i) => isActive(i, location)))?.label;
  useEffect(() => {
    if (!activeGroup) return;
    setClosed((prev) => {
      if (!prev.has(activeGroup)) return prev;
      const next = new Set(prev);
      next.delete(activeGroup);
      return next;
    });
  }, [activeGroup]);

  useEffect(() => {
    try {
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify([...closed]));
    } catch {
      /* ignore */
    }
  }, [closed]);

  const toggle = (label) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!collapsed && (
        <div className="px-3 pt-3">
          <label className="relative block">
            <span className="sr-only">Search menu</span>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lilac/70" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setQuery('');
                if (e.key === 'Enter' && firstMatch) {
                  navigate(firstMatch.to);
                  setQuery('');
                  onNavigate?.();
                }
              }}
              placeholder="Search menu…"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-8 pr-3 text-[13px] text-ivory placeholder:text-lilac/60 focus:border-gold/50 focus:outline-none"
            />
          </label>
        </div>
      )}
      <nav className={cx('min-h-0 flex-1 overflow-y-auto px-3 py-4', collapsed ? 'space-y-5' : 'space-y-2')} aria-label="Admin">
        {searching && !shown.length && <p className="px-3 py-2 text-[13px] text-lilac/70">No menu items match “{query.trim()}”.</p>}
        {shown.map((group) => {
          const open = collapsed || searching || !closed.has(group.label);
          const listId = `admin-nav-${group.label.replace(/\W+/g, '-').toLowerCase()}`;
          return (
            <div key={group.label}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggle(group.label)}
                  disabled={searching}
                  aria-expanded={open}
                  aria-controls={listId}
                  className="mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-lilac/70 hover:text-ivory disabled:cursor-default disabled:hover:text-lilac/70"
                >
                  <span>{group.label}</span>
                  <ChevronDown size={13} className={cx('transition-transform duration-150', !open && '-rotate-90')} aria-hidden />
                </button>
              )}
              {open && (
                <ul id={listId} className="space-y-0.5 pb-2">
                  {group.items.map((item) => {
                    const active = isActive(item, location);
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={() => {
                            setQuery('');
                            onNavigate?.();
                          }}
                          title={collapsed ? item.label : undefined}
                          aria-current={active ? 'page' : undefined}
                          className={cx(
                            'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                            collapsed && 'justify-center px-0',
                            active ? 'bg-gold/[0.1] font-medium text-gold' : 'text-lilac hover:bg-white/[0.05] hover:text-ivory'
                          )}
                        >
                          {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold" aria-hidden />}
                          <item.icon size={16} className="shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function Brand({ collapsed }) {
  return (
    <Link to="/admin" className={cx('flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.08] px-5', collapsed && 'justify-center px-0')}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/15 font-serif text-sm text-gold">K</span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block font-serif text-sm tracking-[0.18em] text-gold">KUBERSTONES</span>
          <span className="block text-[10px] uppercase tracking-widest text-lilac/70">Admin</span>
        </span>
      )}
    </Link>
  );
}

function NotificationsButton() {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
  const navigate = useNavigate();
  const { data } = useApiQuery('/admin/notifications', { limit: 8 }, { refetchInterval: 60_000 });
  const unread = data?.unread || 0;
  const markAll = useApiMutation(() => apiSend('post', '/admin/notifications/read-all'), { invalidate: ['/admin/notifications'], success: false });
  const markOne = useApiMutation((id) => apiSend('post', `/admin/notifications/${id}/read`), { invalidate: ['/admin/notifications'], success: false });
  return (
    <div className="relative">
      <IconButton icon={Bell} label={unread ? `${unread} unread notifications` : 'Notifications'} onClick={() => setOpen((o) => !o)} />
      {unread > 0 && (
        <span className="pointer-events-none absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-semibold text-ink">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-white/10 bg-raised admin-pop">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <p className="text-sm font-semibold text-ivory">Notifications</p>
              <Button size="sm" variant="ghost" icon={CheckCheck} disabled={!unread} loading={markAll.isPending} onClick={() => markAll.mutate()}>
                Mark all read
              </Button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {(data?.notifications || []).length === 0 && <li className="px-4 py-8 text-center text-sm text-lilac">You're all caught up.</li>}
              {(data?.notifications || []).map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markOne.mutate(n._id);
                      setOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                    className="flex w-full gap-3 border-b border-white/[0.05] px-4 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-gold')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-lilac">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-lilac/70">{relative(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Link to="/admin/notifications" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-center text-xs text-gold hover:bg-white/[0.04]">
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/[0.05]" aria-label="Account menu">
        <Avatar name={user?.name || user?.email} size={28} />
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[10rem] truncate text-xs text-ivory">{user?.name || user?.email}</span>
          <span className="block text-[10px] text-lilac">{ROLE_LABELS[user?.role] || user?.role}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-raised py-1 admin-pop">
            <div className="border-b border-white/[0.08] px-3 py-2.5">
              <p className="truncate text-sm text-ivory">{user?.name}</p>
              <p className="truncate text-xs text-lilac">{user?.email}</p>
              <Badge tone="gold" className="mt-1.5">
                {ROLE_LABELS[user?.role] || user?.role}
              </Badge>
            </div>
            <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-ivory hover:bg-white/[0.06]" onClick={() => setOpen(false)}>
              <Store size={14} /> View storefront
            </Link>
            <a
              href="/admin-handbook.pdf"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ivory hover:bg-white/[0.06]"
              onClick={() => setOpen(false)}
            >
              <BookOpen size={14} /> Admin handbook (PDF)
            </a>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
              onClick={async () => {
                setOpen(false);
                await logout();
                queryClient.clear();
                navigate('/login');
              }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

function ThemeMenu() {
  const [open, setOpen] = useState(false);
  useEscape(open, () => setOpen(false));
  const { mode, resolved, setMode } = useAdminTheme();
  const Icon = mode === 'system' ? Monitor : resolved === 'light' ? Sun : Moon;
  return (
    <div className="relative">
      <IconButton icon={Icon} label={`Theme: ${THEME_OPTIONS.find((o) => o.value === mode)?.label}`} onClick={() => setOpen((o) => !o)} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-raised py-1 admin-pop" role="menu" aria-label="Theme">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-lilac/70">Appearance</p>
            {THEME_OPTIONS.map((o) => {
              const OptIcon = THEME_ICONS[o.value];
              return (
                <button
                  key={o.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === o.value}
                  onClick={() => {
                    setMode(o.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ivory hover:bg-white/[0.06]"
                >
                  <OptIcon size={14} className="text-lilac" />
                  <span className="flex-1">{o.label}</span>
                  {mode === o.value && <Check size={14} className="text-gold" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** "Sales / Orders" — where you are, shown in the top bar on wider screens. */
function Breadcrumb() {
  const location = useLocation();
  const { isAdmin } = usePermissions();
  const items = flatNav(isAdmin);
  const hit = items.filter((i) => isActive(i, location)).sort((a, b) => b.to.length - a.to.length)[0];
  const label = hit?.label;
  useEffect(() => {
    const previous = document.title;
    document.title = label ? `${label} · Kuberstones admin` : 'Kuberstones admin';
    return () => {
      document.title = previous;
    };
  }, [label]);
  if (!hit) return null;
  return (
    <p className="hidden min-w-0 items-center gap-1.5 truncate text-sm xl:flex" aria-label="You are here">
      <span className="text-lilac/80">{hit.group}</span>
      <span className="text-lilac/50">/</span>
      <span className="truncate font-medium text-ivory">{hit.label}</span>
    </p>
  );
}

function Shell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ks-admin-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ks-admin-sidebar', collapsed ? 'collapsed' : 'open');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The storefront scrolls the window. A table that only scrolls sideways will hand the
  // leftover wheel movement to that window, which then slides into a blank page.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('admin-scroll-lock');
    return () => root.classList.remove('admin-scroll-lock');
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEscape(mobileOpen, () => setMobileOpen(false));

  return (
    <div className="admin-root flex h-dvh max-h-dvh min-h-0 overflow-hidden overscroll-none bg-ink font-sans text-ivory">
      <aside className={cx('admin-sidebar hidden shrink-0 flex-col border-r border-white/[0.08] transition-[width] duration-200 lg:flex', collapsed ? 'w-[68px]' : 'w-64')}>
        <Brand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} />
        <div className="border-t border-white/[0.08] p-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cx('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-lilac hover:bg-white/[0.05] hover:text-ivory', collapsed && 'justify-center px-0')}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="admin-sidebar relative flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <IconButton icon={X} label="Close menu" onClick={() => setMobileOpen(false)} />
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <Link to="/" className="flex items-center gap-2 border-t border-white/[0.08] px-5 py-4 text-sm text-lilac hover:text-gold">
              <ArrowLeft size={14} /> Back to storefront
            </Link>
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="admin-header flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 md:px-6">
          <IconButton icon={MenuIcon} label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)} />
          <Breadcrumb />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-raised px-3 text-left text-sm text-lilac hover:border-white/20 xl:ml-6"
          >
            <Search size={14} />
            <span className="flex-1 truncate">Search pages & actions…</span>
            <span className="hidden sm:inline-flex sm:gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-lilac transition-colors hover:bg-white/[0.06] hover:text-ivory sm:inline-flex"
              title="Open the storefront in a new tab"
            >
              <ExternalLink size={14} /> Storefront
            </a>
            <ThemeMenu />
            <NotificationsButton />
            <UserMenu />
          </div>
        </header>
        <main id="admin-main" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            <PageErrorBoundary key={location.pathname}>
              <Suspense
                fallback={
                  <div className="grid min-h-[50vh] place-items-center">
                    <Spinner />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </PageErrorBoundary>
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster />
    </div>
  );
}

export default function AdminShell() {
  const theme = useAdminThemeState();
  return (
    <AdminThemeContext.Provider value={theme}>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <Shell />
      </ConfirmProvider>
    </QueryClientProvider>
    </AdminThemeContext.Provider>
  );
}
