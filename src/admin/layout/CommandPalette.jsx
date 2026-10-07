import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { QUICK_ACTIONS, flatNav } from './nav';
import { usePermissions } from '../lib/permissions';
import { Kbd, cx } from '../ui/primitives';

function score(text, q) {
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  // subsequence match ("abc" → "abandoned carts")
  let i = 0;
  for (const ch of t) if (ch === q[i]) i += 1;
  return i === q.length ? 1 : 0;
}

/** Ctrl/Cmd+K jump-to-page + quick actions. */
export default function CommandPalette({ open, onClose }) {
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const items = useMemo(() => {
    const all = [
      ...QUICK_ACTIONS.map((a) => ({ ...a, group: 'Quick actions' })),
      ...flatNav(isAdmin).filter((i) => !i.hiddenInNav),
    ];
    const needle = q.trim().toLowerCase();
    return all
      .map((it) => ({ it, s: Math.max(score(it.label, needle), score(`${it.group} ${it.label}`, needle) - 1) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.it)
      .slice(0, 12);
  }, [q, isAdmin]);

  useEffect(() => {
    if (open) {
      setQ('');
      setIndex(0);
    }
  }, [open]);
  useEffect(() => setIndex(0), [q]);

  if (!open) return null;
  const go = (item) => {
    onClose();
    navigate(item.to);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && items[index]) {
      e.preventDefault();
      go(items[index]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-4">
          <Search size={16} className="text-lilac" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a page or action…"
            className="h-12 w-full bg-transparent text-sm text-ivory placeholder:text-lilac/60 focus:outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="cmdk-list" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-lilac">No matches</li>}
          {items.map((item, i) => (
            <li key={`${item.group}-${item.to}`} role="option" aria-selected={i === index}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => go(item)}
                className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', i === index ? 'bg-white/[0.08] text-ivory' : 'text-lilac')}
              >
                {item.icon && <item.icon size={15} className="shrink-0 text-gold" />}
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-[11px] text-lilac/70">{item.group}</span>
                {i === index && <CornerDownLeft size={13} className="text-lilac" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
