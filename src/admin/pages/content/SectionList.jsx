import { SearchX } from 'lucide-react';
import { SearchInput, cx } from '../../ui';
import { SECTION_GROUPS } from './sections';

/** Left-hand list of editable sections, grouped, with search and unsaved markers. */
export function SectionList({ sections, active, onSelect, dirtyKeys, q, onSearch }) {
  const needle = q.trim().toLowerCase();
  const visible = needle ? sections.filter((s) => s.search.includes(needle)) : sections;
  return (
    <nav aria-label="Site sections" className="rounded-2xl border border-white/[0.08] bg-surface p-3">
      <SearchInput value={q} onChange={onSearch} placeholder="Find a section…" className="mb-3 sm:w-full" />
      <div className="max-h-72 space-y-4 overflow-y-auto pr-1 lg:max-h-[calc(100vh-14rem)]">
        {visible.length === 0 && (
          <p className="flex items-center gap-2 px-2 py-6 text-xs text-lilac">
            <SearchX size={14} /> No section matches “{q}”.
          </p>
        )}
        {SECTION_GROUPS.map((group) => {
          const items = visible.filter((s) => s.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-lilac/70">{group}</p>
              <ul className="space-y-0.5">
                {items.map((s) => {
                  const isActive = s.key === active;
                  const dirty = dirtyKeys.includes(s.key);
                  return (
                    <li key={s.key}>
                      <button
                        type="button"
                        onClick={() => onSelect(s.key)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cx(
                          'flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                          isActive ? 'bg-gold/10 text-ivory' : 'text-lilac hover:bg-white/[0.04] hover:text-ivory'
                        )}
                      >
                        <span className="min-w-0">
                          <span className={cx('block truncate text-sm', isActive && 'font-medium')}>{s.label}</span>
                          <span className="block truncate text-[11px] text-lilac/70">{s.hint}</span>
                        </span>
                        {dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" title="Unsaved changes" aria-label="Unsaved changes" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
