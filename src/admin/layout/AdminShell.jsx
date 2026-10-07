import { Component, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, Bell, CheckCheck, LogOut, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Search, Store, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiSend, queryClient, useApiMutation, useApiQuery } from '../lib/query';
import { ROLE_LABELS, usePermissions } from '../lib/permissions';
import { relative } from '../lib/format';
import { isActive, navForRole } from './nav';
import CommandPalette from './CommandPalette';
import Toaster from '../ui/Toaster';
import { ConfirmProvider } from '../ui/overlay';
import { Avatar, Badge, Button, ErrorState, IconButton, Kbd, Spinner, cx } from '../ui/primitives';
import '../admin.css';

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

function SidebarNav({ collapsed, onNavigate }) {
  const location = useLocation();
  const { isAdmin } = usePermissions();
  return (
    <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {navForRole(isAdmin).map((group) => (
        <div key={group.label}>
          {!collapsed && <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-lilac/60">{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items
              .filter((i) => !i.hiddenInNav)
              .map((item) => {
                const active = isActive(item, location);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cx(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                        collapsed && 'justify-center px-0',
                        active ? 'bg-gold/[0.12] text-gold' : 'text-lilac hover:bg-white/[0.05] hover:text-ivory'
                      )}
                    >
                      <item.icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
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
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-white/10 bg-raised shadow-2xl">
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
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-raised py-1 shadow-2xl">
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

  // The storefront locks body scroll in places; the admin manages its own scroll container.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="admin-root flex h-screen overflow-hidden bg-ink font-sans text-ivory">
      <aside className={cx('hidden shrink-0 flex-col border-r border-white/[0.08] bg-surface transition-[width] duration-200 lg:flex', collapsed ? 'w-[68px]' : 'w-60')}>
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
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10 bg-surface">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-ink/90 px-4 backdrop-blur md:px-6">
          <IconButton icon={MenuIcon} label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)} />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-left text-sm text-lilac hover:border-white/20"
          >
            <Search size={14} />
            <span className="flex-1 truncate">Search pages & actions…</span>
            <span className="hidden sm:inline-flex sm:gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <NotificationsButton />
            <UserMenu />
          </div>
        </header>
        <main id="admin-main" className="min-h-0 flex-1 overflow-y-auto">
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
  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <Shell />
      </ConfirmProvider>
    </QueryClientProvider>
  );
}
