import { useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, PencilLine, Save, Undo2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mergeHomeLayout } from '../../lib/homeContent';
import { fromLocalInput, toLocalInput } from '../lib/format';
import { apiSend, useApiMutation, useApiQuery } from '../lib/query';
import { Badge, Button, Card, ErrorState, IconButton, Input, PageHeader, Skeleton, Switch, cx, useConfirm, useForm, useUnsavedWarning } from '../ui';

const CONTENT_INVALIDATE = ['/admin/content', '/content'];

// Where the copy for each homepage block is edited on the Site pages screen.
const COPY_SECTION = {
  hero: 'hero',
  flash_sale: 'flash',
  marquee: 'marquee',
  houses: 'houses',
  studio: 'studio',
  shop_by_purpose: 'purpose',
  ritual: 'ritual',
  featured: 'featured',
  bestsellers: 'rails',
  new_arrivals: 'rails',
  trending: 'rails',
  testimonials: 'testimonials',
  trust: 'trust',
  faq: 'faq',
  journal: 'journal',
  newsletter: 'newsletter',
  finale: 'finale',
};

/** Form rows keep schedule times as local datetime-local strings; converted to ISO only on save. */
function toRows(layout) {
  return mergeHomeLayout(layout).map((s) => ({
    key: s.key,
    label: s.label,
    enabled: s.enabled !== false,
    startsAt: toLocalInput(s.startsAt),
    endsAt: toLocalInput(s.endsAt),
  }));
}

function statusOf(row, now = Date.now()) {
  if (!row.enabled) return { label: 'Hidden', tone: 'neutral' };
  const starts = row.startsAt ? new Date(row.startsAt).getTime() : null;
  const ends = row.endsAt ? new Date(row.endsAt).getTime() : null;
  if (starts && starts > now) return { label: 'Scheduled', tone: 'info' };
  if (ends && ends < now) return { label: 'Ended', tone: 'warning' };
  return { label: 'Live', tone: 'success' };
}

export default function HomeLayout() {
  const content = useApiQuery('/admin/content');
  const serverLayout = content.data?.content?.homeLayout;

  return (
    <>
      <PageHeader
        title="Homepage layout"
        description="Order, show or hide, and schedule the blocks of the home page. The text and images of each block are edited on Site pages."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light">
            <ExternalLink size={15} /> View homepage
          </a>
        }
      />
      {content.isLoading ? (
        <Card className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </Card>
      ) : content.error ? (
        <Card padded={false}>
          <ErrorState error={content.error} onRetry={content.refetch} />
        </Card>
      ) : (
        <LayoutEditor serverLayout={serverLayout} />
      )}
    </>
  );
}

function LayoutEditor({ serverLayout }) {
  const confirm = useConfirm();
  const form = useForm({ rows: toRows(serverLayout) });
  useUnsavedWarning(form.dirty);
  const rows = form.values.rows;
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const save = useApiMutation(
    (list) =>
      // Only the homeLayout key is sent: the server merges top-level keys, so Site pages edits are untouched.
      apiSend('put', '/admin/content', {
        homeLayout: list.map((r, i) => ({
          key: r.key,
          label: r.label,
          enabled: r.enabled,
          sortOrder: i,
          startsAt: fromLocalInput(r.startsAt),
          endsAt: fromLocalInput(r.endsAt),
        })),
      }),
    {
      invalidate: CONTENT_INVALIDATE,
      success: 'Homepage layout saved.',
      onSuccess: (data) => form.reset({ rows: toRows(data?.content?.homeLayout) }),
    }
  );

  const setRows = (next) => form.set('rows', next);
  const update = (i, patch) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (from, to) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setRows(next);
  };

  const errors = rows.map((r) => (r.startsAt && r.endsAt && new Date(r.endsAt) <= new Date(r.startsAt) ? 'Must end after it starts.' : null));
  const hasErrors = errors.some(Boolean);

  const discard = async () => {
    if (await confirm({ title: 'Discard changes?', message: 'The layout goes back to what is live now.', confirmLabel: 'Discard', tone: 'danger' })) form.reset();
  };

  return (
    <Card padded={false}>
      <ol className="divide-y divide-white/[0.06]">
        {rows.map((r, i) => {
          const status = statusOf(r);
          return (
            <li
              key={r.key}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cx(
                'flex flex-col gap-3 px-4 py-3 transition-colors lg:flex-row lg:items-center',
                dragIndex === i && 'opacity-50',
                overIndex === i && dragIndex !== null && dragIndex !== i && 'bg-gold/[0.06]'
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(i);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', r.key);
                  }}
                  className="hidden shrink-0 cursor-grab text-lilac/60 hover:text-ivory active:cursor-grabbing sm:block"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripVertical size={16} />
                </span>
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-lilac">{i + 1}</span>
                <div className="flex shrink-0 gap-0.5">
                  <IconButton icon={ArrowUp} size="sm" label={`Move ${r.label} up`} disabled={i === 0} onClick={() => move(i, i - 1)} />
                  <IconButton icon={ArrowDown} size="sm" label={`Move ${r.label} down`} disabled={i === rows.length - 1} onClick={() => move(i, i + 1)} />
                </div>
                <div className="min-w-0">
                  <p className={cx('truncate text-sm font-medium', r.enabled ? 'text-ivory' : 'text-lilac line-through decoration-lilac/40')}>{r.label}</p>
                  {COPY_SECTION[r.key] && (
                    <Link to={`/admin/content?section=${COPY_SECTION[r.key]}`} className="inline-flex items-center gap-1 text-[11px] text-lilac hover:text-gold">
                      <PencilLine size={11} /> Edit copy
                    </Link>
                  )}
                </div>
                <Badge tone={status.tone} dot className="ml-auto lg:ml-2">
                  {status.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-end gap-3 pl-8 lg:pl-0">
                <Switch checked={r.enabled} onChange={(enabled) => update(i, { enabled })} label="Visible" />
                <label className="space-y-1 text-[11px] text-lilac">
                  <span className="block">Show from</span>
                  <Input type="datetime-local" className="w-48" value={r.startsAt} onChange={(e) => update(i, { startsAt: e.target.value })} />
                </label>
                <label className="space-y-1 text-[11px] text-lilac">
                  <span className="block">Until</span>
                  <Input type="datetime-local" className="w-48" invalid={Boolean(errors[i])} value={r.endsAt} onChange={(e) => update(i, { endsAt: e.target.value })} />
                </label>
                {errors[i] && <p className="w-full text-xs text-rose-300">{errors[i]}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-white/[0.08] bg-surface/95 px-4 py-3 backdrop-blur">
        <span className="mr-auto text-xs text-lilac">
          {form.dirty ? 'Unsaved changes. Times are in your local time zone.' : 'Drag rows or use the arrows to reorder. Times are in your local time zone.'}
        </span>
        <Button variant="ghost" icon={Undo2} disabled={!form.dirty || save.isPending} onClick={discard}>
          Discard
        </Button>
        <Button variant="primary" icon={Save} loading={save.isPending} disabled={!form.dirty || hasErrors} onClick={() => save.mutate(rows)}>
          Save layout
        </Button>
      </div>
    </Card>
  );
}
