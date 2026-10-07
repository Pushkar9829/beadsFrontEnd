import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, MousePointerClick, PackageSearch, Plus, Trash2, X } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import { useApiList } from '../../lib/query';
import { Button, IconButton, NumberInput, Thumb, cx } from '../../ui';
import { ProductPickerModal } from '../../ui/pickers';
import { moveItem, useRowKeys } from './SchemaFields';

/*
 * Visual hotspot editor for "Shop the look" (many numbered points) and the hero (one point).
 *
 * A point is stored as { productSlug, x, y, productName, productImage }:
 *   - productSlug   what the storefront resolves (via GET /products?slugs=…)
 *   - x, y          position in % of the image box (0–100, one decimal)
 *   - productName / productImage  label stored at pick time so the admin can show the product
 *                   even when the live lookup is unavailable; the storefront ignores them.
 *
 * Numbering matches the storefront: points are numbered 1..n in list order, counting only the
 * points whose product resolves to an active product (others are hidden on the site).
 */

const clamp = (n) => Math.min(100, Math.max(0, n));
const round1 = (n) => Math.round(n * 10) / 10;

/** Normalise a point before saving: numeric, clamped x/y and a trimmed slug. */
export function cleanPoint(p, fallback = { x: 50, y: 50 }) {
  const num = (v, d) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? d : round1(clamp(Number(v))));
  const out = { ...(p || {}), productSlug: String(p?.productSlug || '').trim(), x: num(p?.x, fallback.x), y: num(p?.y, fallback.y) };
  if (!out.productSlug) {
    delete out.productName;
    delete out.productImage;
  }
  return out;
}

/** Live lookup of active products by slug (public list, active only). */
function useProductsBySlug(slugs) {
  const unique = [...new Set(slugs.filter(Boolean))].sort().slice(0, 24);
  const { rows, isLoading, isFetching, isPlaceholderData, error } = useApiList(
    '/products',
    { slugs: unique.join(','), limit: 24 },
    { enabled: unique.length > 0, key: 'products' }
  );
  const bySlug = useMemo(() => Object.fromEntries(rows.map((p) => [p.slug, p])), [rows]);
  // Only trust "not found" when the lookup for exactly these slugs has finished.
  const ready = unique.length > 0 && !isLoading && !isFetching && !isPlaceholderData && !error;
  return { bySlug, ready };
}

function productOf(point, bySlug) {
  const live = point?.productSlug ? bySlug[point.productSlug] : null;
  return {
    name: live?.name || point?.productName || point?.productSlug || '',
    image: live?.images?.[0] || point?.productImage || '',
    live,
  };
}

/**
 * props:
 *   image     image url to place points on
 *   points    [{ productSlug, x, y, ... }]
 *   onChange  (points) => void
 *   single    exactly one point (hero): clicking the image moves it, no add / remove / reorder
 *   max       maximum number of points
 */
export function HotspotEditor({ image, points = [], onChange, single = false, max = 8, label = 'Points' }) {
  const boxRef = useRef(null);
  const drag = useRef(null); // { index, moved }
  const [active, setActive] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const rk = useRowKeys(points.length);

  const { bySlug, ready } = useProductsBySlug(points.map((p) => p?.productSlug));
  const resolved = (p) => Boolean(p?.productSlug) && (!ready || Boolean(bySlug[p.productSlug]));
  // Storefront number for each point (null = hidden on the site).
  const numbers = [];
  let n = 0;
  for (const p of points) numbers.push(resolved(p) ? (n += 1) : null);

  const update = (i, patch) => onChange(points.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const posFrom = (e) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return null;
    return { x: round1(clamp(((e.clientX - r.left) / r.width) * 100)), y: round1(clamp(((e.clientY - r.top) / r.height) * 100)) };
  };

  const addAt = (pos) => {
    if (single) {
      update(0, pos);
      setActive(0);
      return;
    }
    if (points.length >= max) return;
    rk.add();
    onChange([...points, { productSlug: '', ...pos }]);
    setActive(points.length);
    setPickerFor(points.length); // place, then choose the product
  };
  const remove = (i) => {
    rk.remove(i);
    onChange(points.filter((_, j) => j !== i));
    setActive(null);
  };
  const move = (from, to) => {
    if (to < 0 || to >= points.length) return;
    rk.move(from, to);
    onChange(moveItem(points, from, to));
    setActive(to);
  };

  const onBoxClick = (e) => {
    const pos = posFrom(e);
    if (pos) addAt(pos);
  };

  const onPointKey = (e, i) => {
    const step = e.shiftKey ? 5 : 1;
    const p = points[i];
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (d) {
      e.preventDefault();
      update(i, { x: round1(clamp(Number(p.x || 0) + d[0])), y: round1(clamp(Number(p.y || 0) + d[1])) });
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && !single) {
      e.preventDefault();
      remove(i);
    }
  };

  const src = image ? mediaUrl(image) : '';
  const canAdd = !single && points.length < max;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-lilac">
          {label} {!single && <span className="text-lilac/60">({points.length})</span>}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-lilac/80">
          <MousePointerClick size={12} />
          {single ? 'Click the image to move the point. Drag it, or focus it and use the arrow keys.' : 'Click the image to add a point. Drag a point, or focus it and use the arrow keys (Shift = 5%).'}
        </p>
      </div>

      <div
        ref={boxRef}
        onClick={onBoxClick}
        className={cx(
          'relative w-full max-w-xl select-none overflow-hidden rounded-xl border border-white/10 bg-raised',
          (canAdd || single) && 'cursor-crosshair',
          !src && 'aspect-[4/3]'
        )}
      >
        {src ? (
          <img src={src} alt="" draggable={false} className="block h-auto w-full" />
        ) : (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-lilac">
            Add an image to see where the points sit. You can still place points here or type X / Y below.
          </p>
        )}
        {points.map((p, i) => {
          const num = numbers[i];
          const { name } = productOf(p, bySlug);
          return (
            <button
              key={rk.keys[i]}
              type="button"
              style={{ left: `${clamp(Number(p.x) || 0)}%`, top: `${clamp(Number(p.y) || 0)}%`, touchAction: 'none' }}
              aria-label={`Point ${num ?? i + 1}${name ? `: ${name}` : ', no product'} at ${p.x}% across, ${p.y}% down. Arrow keys move it.`}
              title={name || 'No product yet'}
              onClick={(e) => {
                e.stopPropagation();
                setActive(i);
              }}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => onPointKey(e, i)}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture?.(e.pointerId);
                drag.current = { index: i };
                setActive(i);
              }}
              onPointerMove={(e) => {
                if (drag.current?.index !== i) return;
                const pos = posFrom(e);
                if (pos && (pos.x !== p.x || pos.y !== p.y)) update(i, pos);
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture?.(e.pointerId);
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              className={cx(
                'absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full border text-xs font-semibold shadow-lg transition-[box-shadow] active:cursor-grabbing focus-visible:outline-none',
                num ? 'border-ink/40 bg-gold text-ink' : 'border-dashed border-white/70 bg-black/60 text-white',
                active === i && 'ring-2 ring-white ring-offset-2 ring-offset-black/40'
              )}
            >
              {num ?? '–'}
            </button>
          );
        })}
      </div>

      {!single && points.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-lilac">No points yet. Click the image or use “Add point”.</p>
      )}

      <ol className="space-y-2">
        {points.map((p, i) => {
          const num = numbers[i];
          const prod = productOf(p, bySlug);
          const missing = Boolean(p.productSlug) && ready && !prod.live;
          return (
            <li
              key={rk.keys[i]}
              onMouseEnter={() => setActive(i)}
              className={cx(
                'flex flex-wrap items-center gap-2 rounded-xl border bg-white/[0.02] p-2.5',
                active === i ? 'border-gold/40' : 'border-white/[0.08]'
              )}
            >
              <span
                className={cx(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold',
                  num ? 'bg-gold text-ink' : 'border border-dashed border-white/40 text-lilac'
                )}
                title={num ? `Shown as ${num} on the site` : 'Hidden on the site'}
              >
                {num ?? '–'}
              </span>
              <div className="flex min-w-0 flex-1 basis-48 items-center gap-2">
                {p.productSlug ? (
                  <>
                    <Thumb src={prod.image ? mediaUrl(prod.image) : ''} size={32} color={prod.live?.colorHex} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ivory">{prod.name}</span>
                      {missing ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-200">
                          <AlertTriangle size={11} /> Not an active product — hidden on the site
                        </span>
                      ) : (
                        <span className="block truncate text-[11px] text-lilac">/{p.productSlug}</span>
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-lilac">No product yet — {single ? 'the hotspot is hidden' : 'this point is hidden'}.</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="secondary" icon={PackageSearch} onClick={() => setPickerFor(i)}>
                  {p.productSlug ? 'Change' : 'Choose product'}
                </Button>
                {single && p.productSlug && (
                  <IconButton icon={X} size="sm" label="Remove product" onClick={() => update(i, { productSlug: '', productName: undefined, productImage: undefined })} />
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <label className="flex items-center gap-1 text-[11px] text-lilac">
                  X
                  <NumberInput
                    className="w-[4.5rem]"
                    min={0}
                    max={100}
                    step={0.5}
                    value={p.x}
                    aria-label={`Point ${i + 1} across (%)`}
                    onChange={(v) => update(i, { x: v === '' ? '' : round1(clamp(v)) })}
                  />
                </label>
                <label className="flex items-center gap-1 text-[11px] text-lilac">
                  Y
                  <NumberInput
                    className="w-[4.5rem]"
                    min={0}
                    max={100}
                    step={0.5}
                    value={p.y}
                    aria-label={`Point ${i + 1} down (%)`}
                    onChange={(v) => update(i, { y: v === '' ? '' : round1(clamp(v)) })}
                  />
                </label>
              </div>
              {!single && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton icon={ArrowUp} size="sm" label={`Move point ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)} />
                  <IconButton icon={ArrowDown} size="sm" label={`Move point ${i + 1} down`} disabled={i === points.length - 1} onClick={() => move(i, i + 1)} />
                  <IconButton icon={Trash2} size="sm" label={`Remove point ${i + 1}`} className="hover:text-rose-300" onClick={() => remove(i)} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {canAdd && (
        <Button size="sm" variant="ghost" icon={Plus} onClick={() => addAt({ x: 50, y: 50 })}>
          Add point
        </Button>
      )}

      <ProductPickerModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        single
        selected={[]}
        onChange={(_ids, product) => {
          if (pickerFor === null || !product) return;
          update(pickerFor, { productSlug: product.slug || '', productName: product.name || '', productImage: product.images?.[0] || '' });
        }}
      />
    </div>
  );
}

/** Schema control for `hero.hotspot` (and each slide's hotspot): one point on the sibling `image`. */
export function HeroHotspotField({ field, value, onChange, parent }) {
  const point = { productSlug: '', x: 31, y: 45, ...(value || {}) };
  return (
    <div className="space-y-1.5">
      <HotspotEditor single image={parent?.image} points={[point]} onChange={(pts) => onChange(pts[0])} label={field.label} />
      {field.hint && <p className="text-xs text-lilac/70">{field.hint}</p>}
    </div>
  );
}

/** Schema control for a look's `items`: numbered points on the look's sibling `image`. */
export function LookPointsField({ field, value, onChange, parent }) {
  return (
    <div className="space-y-1.5">
      <HotspotEditor image={parent?.image} points={Array.isArray(value) ? value : []} onChange={onChange} max={field.max || 8} label={field.label} />
      {field.hint && <p className="text-xs text-lilac/70">{field.hint}</p>}
    </div>
  );
}
