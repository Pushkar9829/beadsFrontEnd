import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, MoreHorizontal, X } from 'lucide-react';
import { Button, IconButton, cx } from './primitives';

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

function useFocusOnOpen(open) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const prev = document.activeElement;
    const first = ref.current.querySelector('input:not([type=hidden]),select,textarea,button:not([data-close])');
    (first || ref.current).focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, [open]);
  return ref;
}

/**
 * Centered dialog. `dirty` makes closing ask for confirmation so edits aren't lost.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', dirty = false }) {
  const confirm = useConfirm();
  const requestClose = useCallback(async () => {
    if (dirty && !(await confirm({ title: 'Discard changes?', message: 'You have unsaved changes.', confirmLabel: 'Discard', tone: 'danger' }))) return;
    onClose?.();
  }, [dirty, onClose, confirm]);
  useEscape(open, requestClose);
  const ref = useFocusOnOpen(open);
  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={requestClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-white/10 bg-surface shadow-2xl sm:rounded-2xl', width)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ivory">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-lilac">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" data-close onClick={requestClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Right-hand slide-over for create/edit forms and record details. */
export function Drawer({ open, onClose, title, description, children, footer, width = 'md', dirty = false }) {
  const confirm = useConfirm();
  const requestClose = useCallback(async () => {
    if (dirty && !(await confirm({ title: 'Discard changes?', message: 'You have unsaved changes.', confirmLabel: 'Discard', tone: 'danger' }))) return;
    onClose?.();
  }, [dirty, onClose, confirm]);
  useEscape(open, requestClose);
  const ref = useFocusOnOpen(open);
  if (!open) return null;
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' }[width];
  return createPortal(
    <div className="fixed inset-0 z-[55] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={requestClose} aria-hidden />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cx('relative flex h-full w-full flex-col border-l border-white/10 bg-surface shadow-2xl animate-[slideIn_.18s_ease-out]', w)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ivory">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-lilac">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" data-close onClick={requestClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] bg-surface px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body
  );
}

const ConfirmContext = createContext(null);

/**
 * const confirm = useConfirm();
 * if (await confirm({ title, message, confirmLabel, tone: 'danger', typeToConfirm })) ...
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [typed, setTyped] = useState('');
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setTyped('');
        setState({ ...opts, resolve });
      }),
    []
  );
  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };
  useEscape(Boolean(state), () => close(false));
  const blocked = state?.typeToConfirm && typed.trim() !== state.typeToConfirm;
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => close(false)} aria-hidden />
            <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl">
              <div className="flex gap-3">
                <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', state.tone === 'danger' ? 'bg-rose-500/15 text-rose-300' : 'bg-gold/15 text-gold')}>
                  <AlertTriangle size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-ivory">{state.title || 'Are you sure?'}</h2>
                  {state.message && <div className="mt-1 text-sm text-lilac">{state.message}</div>}
                  {state.typeToConfirm && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-lilac">
                        Type <span className="font-mono text-ivory">{state.typeToConfirm}</span> to confirm
                      </p>
                      <input
                        autoFocus
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        className="h-9 w-full rounded-lg border border-white/10 bg-raised px-3 text-sm text-ivory focus:border-gold/60 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => close(false)}>
                  {state.cancelLabel || 'Cancel'}
                </Button>
                <Button autoFocus={!state.typeToConfirm} variant={state.tone === 'danger' ? 'danger' : 'primary'} disabled={blocked} onClick={() => close(true)}>
                  {state.confirmLabel || 'Confirm'}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  return ctx || ((opts) => Promise.resolve(window.confirm(opts?.message || opts?.title || 'Are you sure?')));
}

/**
 * Row/overflow actions menu.
 * items: [{ label, icon, onClick, tone: 'danger', disabled, hidden }] | 'divider'
 */
export function Menu({ items = [], label = 'More actions', icon = MoreHorizontal, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const visible = items.filter((i) => i && !i.hidden);
  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  useEscape(open, () => setOpen(false));
  if (!visible.length) return null;
  const toggle = (e) => {
    e.stopPropagation();
    const r = btn.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: align === 'right' ? undefined : r.left, right: align === 'right' ? window.innerWidth - r.right : undefined });
    setOpen((o) => !o);
  };
  return (
    <>
      <IconButton ref={btn} icon={icon} label={label} size="sm" onClick={toggle} aria-haspopup="menu" aria-expanded={open} />
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)}>
            <div
              role="menu"
              className="absolute min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-raised py-1 shadow-2xl"
              style={{ top: Math.min(pos.top, window.innerHeight - 40 * visible.length - 16), left: pos.left, right: pos.right }}
              onClick={(e) => e.stopPropagation()}
            >
              {visible.map((item, i) =>
                item === 'divider' ? (
                  <div key={`d${i}`} className="my-1 h-px bg-white/[0.08]" />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                    className={cx(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:opacity-40',
                      item.tone === 'danger' ? 'text-rose-300 hover:bg-rose-500/10' : 'text-ivory hover:bg-white/[0.06]'
                    )}
                  >
                    {item.icon && <item.icon size={14} className="shrink-0" />}
                    {item.label}
                  </button>
                )
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
