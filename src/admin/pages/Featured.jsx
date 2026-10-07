import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronsUp, GripVertical, Plus, Save, Star, X } from 'lucide-react';
import { apiSend, useApiQuery, useApiMutation } from '../lib/query';
import { money, plural } from '../lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, PageHeader, Skeleton, Thumb, cx, useForm, useUnsavedWarning } from '../ui';
import { ProductPickerModal } from '../ui/pickers';
import { PRODUCT_INVALIDATE, firstImage, stockState } from './catalog/shared';

const MAX = 500;

export default function Featured() {
  const query = useApiQuery('/admin/featured');
  const featured = useMemo(
    () => (query.data?.products || []).filter((p) => p.featured).sort((a, b) => (a.featuredSort ?? 0) - (b.featuredSort ?? 0) || String(a.name).localeCompare(String(b.name))),
    [query.data]
  );
  const byId = useMemo(() => new Map((query.data?.products || []).map((p) => [String(p._id), p])), [query.data]);
  const initial = useMemo(() => ({ ids: featured.map((p) => String(p._id)) }), [featured]);
  const form = useForm(initial);
  const ids = form.values.ids;
  const [picking, setPicking] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  useUnsavedWarning(form.dirty);

  const save = useApiMutation(
    async (nextIds) => {
      const removed = initial.ids.filter((id) => !nextIds.includes(id));
      // v2: replace:true unfeatures everything not in the list.
      if (nextIds.length) await apiSend('put', '/admin/featured/reorder', { ids: nextIds, replace: true });
      // Explicitly unfeature removed products too (works even if replace is not supported).
      for (const id of removed) await apiSend('put', `/admin/featured/${id}`, { featured: false });
      return { count: nextIds.length };
    },
    {
      invalidate: PRODUCT_INVALIDATE,
      success: ({ count }) => `Featured list saved (${plural(count, 'product')}).`,
      onSuccess: (_data, nextIds) => form.reset({ ids: nextIds }),
    }
  );

  const setIds = (next) => form.set('ids', next);
  const move = (from, to) => {
    if (to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setIds(next);
  };

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Featured products" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </>
    );
  }
  if (query.error) {
    return (
      <>
        <PageHeader title="Featured products" />
        <ErrorState error={query.error} onRetry={query.refetch} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Featured products"
        description="The homepage featured rail, in this order. Drag or use the arrows to reorder, then save."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setPicking(true)} disabled={ids.length >= MAX}>
            Add products
          </Button>
        }
      />

      {ids.length === 0 ? (
        <Card>
          <EmptyState
            icon={Star}
            title="No featured products"
            description="Pick the products to show in the homepage featured rail."
            action={
              <Button icon={Plus} onClick={() => setPicking(true)}>
                Add products
              </Button>
            }
          />
        </Card>
      ) : (
        <ol className="space-y-2">
          {ids.map((id, i) => (
            <li
              key={id}
              draggable
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', id);
              }}
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
                'flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 transition-colors',
                overIndex === i && dragIndex !== i ? 'border-gold/60' : 'border-white/[0.08]',
                dragIndex === i && 'opacity-50'
              )}
            >
              <GripVertical size={16} className="hidden shrink-0 cursor-grab text-lilac/60 sm:block" aria-hidden />
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-lilac">{i + 1}</span>
              <FeaturedItem id={id} known={byId.get(id)} isNew={!initial.ids.includes(id)} />
              <div className="flex shrink-0 items-center">
                <IconButton icon={ChevronsUp} size="sm" label="Move to top" disabled={i === 0} onClick={() => move(i, 0)} className="hidden sm:inline-flex" />
                <IconButton icon={ArrowUp} size="sm" label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)} />
                <IconButton icon={ArrowDown} size="sm" label="Move down" disabled={i === ids.length - 1} onClick={() => move(i, i + 1)} />
                <IconButton icon={X} size="sm" label="Remove from featured" onClick={() => setIds(ids.filter((x) => x !== id))} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {(form.dirty || ids.length > 0) && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-white/[0.08] bg-ink/95 backdrop-blur md:-mx-8">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <span className="truncate text-sm text-lilac">{form.dirty ? 'Unsaved changes' : `${plural(ids.length, 'product')} featured`}</span>
            <div className="flex items-center gap-2">
              {form.dirty && (
                <Button variant="ghost" onClick={() => form.reset()} disabled={save.isPending}>
                  Discard
                </Button>
              )}
              <Button variant="primary" icon={Save} loading={save.isPending} disabled={!form.dirty || save.isPending} onClick={() => save.mutate(ids)}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <ProductPickerModal open={picking} onClose={() => setPicking(false)} selected={ids} onChange={(next) => setIds(next.map(String))} max={MAX} />
    </>
  );
}

/** One row's product details; products added from the picker are fetched by id. */
function FeaturedItem({ id, known, isNew }) {
  const detail = useApiQuery(known ? null : `/products/admin/${id}`);
  const p = known || detail.data?.product;
  if (!p) {
    return <div className="min-w-0 flex-1">{detail.isLoading ? <Skeleton className="h-9 w-48" /> : <span className="text-sm text-lilac">Product unavailable</span>}</div>;
  }
  const stock = stockState(p);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Thumb src={firstImage(p)} color={p.colorHex} size={40} />
      <div className="min-w-0">
        <Link to={`/admin/products/${p._id}`} className="block truncate text-sm font-medium text-ivory hover:text-gold">
          {p.name}
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-lilac">
          <span>{money(p.price)}</span>
          {isNew && <Badge tone="info">New</Badge>}
          {p.isActive === false && <Badge tone="warning">Inactive — hidden on store</Badge>}
          {stock === 'out' && <Badge tone="danger">Out of stock</Badge>}
        </div>
      </div>
    </div>
  );
}
