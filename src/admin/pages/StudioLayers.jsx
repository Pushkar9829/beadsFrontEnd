// Layer catalogs: zodiac, numerology, planetary and profession rows that drive the studio paths.
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Briefcase, Hash, Layers, Orbit, Pencil, Plus, RotateCcw, Star, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { plural } from '../lib/format';
import { apiSend, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FormGrid,
  FormSection,
  Input,
  MediaInput,
  Menu,
  PageHeader,
  SearchInput,
  Select,
  Switch,
  Tabs,
  Textarea,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { STUDIO, STUDIO_INVALIDATE, checkDayMonth, dateRange, moveItem, slugify, useStudioBeads } from './studio/api';
import { BeadNameListField, CardColorFields, DateRangeFields } from './studio/shared';

const KINDS = [
  { value: 'zodiac', label: 'Zodiac', icon: Star, description: 'Twelve signs, each with a recommended crystal core and a wider pool of suitable beads.' },
  { value: 'numerology', label: 'Numerology', icon: Hash, description: 'Numbers 1–9. Mulank and Bhagyank beads are kept as two separate layers.' },
  { value: 'planetary', label: 'Planetary', icon: Orbit, description: 'Planets (graha) and their traditional crystals.' },
  { value: 'profession', label: 'Profession', icon: Briefcase, description: 'Kinds of work and the crystals suggested for them.' },
];
const KIND_VALUES = KINDS.map((k) => k.value);

const BASE = { name: '', slug: '', theme: '', description: '', image: '', icon: '', cardBg: '', cardAccent: '', isActive: true };
const EMPTY_BY_KIND = {
  zodiac: { ...BASE, hindi: '', dates: '', fromMonth: '', fromDay: '', toMonth: '', toDay: '', suitable: [], recommended: [] },
  numerology: { ...BASE, number: '', mulank: [], bhagyank: [] },
  planetary: { ...BASE, hindi: '', recommended: [] },
  profession: { ...BASE, recommended: [] },
};

function rowTitle(row) {
  if (row.kind === 'numerology') return `Number ${row.number ?? row.slug}${row.theme ? ` · ${row.theme}` : ''}`;
  return row.hindi ? `${row.name} · ${row.hindi}` : row.name || row.slug;
}

/** The slug the server will store for this body (mirrors normalizeLayerBody). */
function slugFor(kind, values) {
  if (kind === 'numerology') return values.number === '' || values.number == null ? '' : String(values.number);
  return slugify(values.slug) || slugify(values.name);
}

export default function StudioLayers() {
  const [state, set] = useUrlState({ kind: 'zodiac', q: '' });
  const kind = KIND_VALUES.includes(state.kind) ? state.kind : 'zodiac';
  const kindMeta = KINDS.find((k) => k.value === kind);
  const confirm = useConfirm();
  const query = useApiQuery(`${STUDIO}/layers`, { kind });
  const { beads } = useStudioBeads();
  const [editing, setEditing] = useState(null);

  const items = useMemo(() => [...(query.data?.items || [])].filter((r) => r.kind === kind).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.number ?? 0) - (b.number ?? 0)), [query.data, kind]);
  const rows = useMemo(() => {
    const term = state.q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((r) => [r.name, r.hindi, r.slug, r.theme, ...(r.recommended || []), ...(r.suitable || []), ...(r.mulank || []), ...(r.bhagyank || [])].some((x) => String(x || '').toLowerCase().includes(term)));
  }, [items, state.q]);
  const beadNames = useMemo(() => new Set(beads.map((b) => b.name.trim().toLowerCase())), [beads]);

  const remove = useApiMutation((id) => apiSend('delete', `${STUDIO}/layers/${id}`), { invalidate: STUDIO_INVALIDATE, success: 'Row deleted.' });
  const reorder = useApiMutation(
    async (list) => {
      for (let i = 0; i < list.length; i += 1) {
        if (list[i].sortOrder !== i + 1) await apiSend('put', `${STUDIO}/layers/${list[i]._id}`, { kind, slug: list[i].slug, sortOrder: i + 1 });
      }
    },
    { invalidate: STUDIO_INVALIDATE, success: false }
  );
  const restore = useApiMutation(() => apiSend('post', `${STUDIO}/layers/restore`, { kind }), {
    invalidate: STUDIO_INVALIDATE,
    success: (data) => `${kindMeta.label} catalog restored (${plural(data?.restored ?? 0, 'row')}).`,
  });

  async function askRestore() {
    const ok = await confirm({
      title: `Restore the default ${kindMeta.label.toLowerCase()} catalog?`,
      message: `This deletes all ${plural(items.length, 'row')} on this tab, including your edits and added rows, and puts back the original catalog. It cannot be undone.`,
      confirmLabel: 'Restore defaults',
      tone: 'danger',
      typeToConfirm: kind,
    });
    if (ok) restore.mutate();
  }

  const missingCount = (row) => ['suitable', 'recommended', 'mulank', 'bhagyank'].reduce((n, k) => n + (row[k] || []).filter((name) => !beadNames.has(name.trim().toLowerCase())).length, 0);

  const columns = [
    {
      key: 'name',
      header: kind === 'numerology' ? 'Number' : 'Name',
      render: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          {r.image ? (
            <img src={mediaUrl(r.image)} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover" />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-base" style={{ background: r.cardBg || undefined, borderColor: r.cardAccent || undefined }}>
              {r.icon || (kind === 'numerology' ? r.number : '')}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate font-medium">{rowTitle(r)}</div>
            <div className="truncate text-xs text-lilac">
              {r.slug}
              {kind === 'zodiac' && (r.dates || dateRange(r)) ? ` · ${r.dates || dateRange(r)}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'theme', header: 'Theme', hideBelow: 'md', render: (r) => <span className="line-clamp-2 text-sm text-lilac">{r.theme || '—'}</span> },
    {
      key: 'beads',
      header: kind === 'numerology' ? 'Mulank · Bhagyank' : 'Recommended',
      render: (r) => {
        const missing = missingCount(r);
        const text = kind === 'numerology' ? `${(r.mulank || []).join(', ') || '—'} · ${(r.bhagyank || []).join(', ') || '—'}` : (r.recommended || []).join(', ') || '—';
        return (
          <div className="min-w-0 max-w-xs">
            <div className="line-clamp-2 text-xs text-lilac">{text}</div>
            {missing > 0 && (
              <Badge tone="warning" className="mt-1">
                {plural(missing, 'unknown bead')}
              </Badge>
            )}
          </div>
        );
      },
    },
    { key: 'isActive', header: 'Status', render: (r) => (r.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const idx = items.indexOf(r);
        return (
          <Menu
            items={[
              { label: 'Edit', icon: Pencil, onClick: () => setEditing(r) },
              { label: 'Move up', icon: ArrowUp, hidden: Boolean(state.q), disabled: idx <= 0 || reorder.isPending, onClick: () => reorder.mutate(moveItem(items, idx, idx - 1)) },
              { label: 'Move down', icon: ArrowDown, hidden: Boolean(state.q), disabled: idx >= items.length - 1 || reorder.isPending, onClick: () => reorder.mutate(moveItem(items, idx, idx + 1)) },
              'divider',
              {
                label: 'Delete',
                icon: Trash2,
                tone: 'danger',
                onClick: async () => {
                  const ok = await confirm({ title: `Delete “${rowTitle(r)}”?`, message: 'The studio stops offering it. Restore defaults brings back the original rows.', confirmLabel: 'Delete', tone: 'danger' });
                  if (ok) remove.mutate(r._id);
                },
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Studio layers"
        description="Catalogs behind the zodiac, numerology, planetary and profession paths of the bracelet studio. Bead prices live on Beads."
        actions={
          <>
            <Button variant="danger" icon={RotateCcw} loading={restore.isPending} onClick={askRestore}>
              Restore defaults
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
              New row
            </Button>
          </>
        }
      />
      <Tabs value={kind} onChange={(k) => set({ kind: k, q: '' })} items={KINDS.map((k) => ({ value: k.value, label: k.label, icon: k.icon, count: k.value === kind && query.data ? items.length : undefined }))} />
      <Toolbar right={<p className="hidden max-w-sm text-right text-xs text-lilac lg:block">{kindMeta.description}</p>}>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder={`Search ${kindMeta.label.toLowerCase()} rows or beads…`} />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isLoading}
        fetching={query.isFetching || reorder.isPending}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={Layers}
            title={state.q ? 'No rows match your search' : `No ${kindMeta.label.toLowerCase()} rows`}
            description={state.q ? undefined : 'Add a row, or restore the default catalog.'}
            action={!state.q && <Button icon={Plus} onClick={() => setEditing('new')}>New row</Button>}
          />
        }
      />
      <LayerDrawer key={`${kind}-${editing?._id || editing || 'none'}`} kind={kind} row={editing} items={items} beads={beads} onClose={() => setEditing(null)} onSwitch={setEditing} />
    </>
  );
}

function rowToForm(kind, row) {
  const empty = EMPTY_BY_KIND[kind];
  const out = { ...empty };
  for (const key of Object.keys(empty)) {
    const v = row[key];
    if (v !== undefined && v !== null) out[key] = v;
  }
  return out;
}

function LayerDrawer({ kind, row, items, beads, onClose, onSwitch }) {
  const isNew = row === 'new';
  const form = useForm(isNew || !row ? EMPTY_BY_KIND[kind] : rowToForm(kind, row));
  const v = form.values;
  const slug = slugFor(kind, v);
  const duplicate = slug ? items.find((r) => r._id !== row?._id && r.slug === slug) : null;
  const kindLabel = KINDS.find((k) => k.value === kind)?.label || kind;

  const save = useApiMutation(
    (values) => {
      const body = { ...values, kind };
      if (kind === 'numerology') {
        body.number = Number(values.number);
        body.slug = String(body.number);
        body.name = values.theme?.trim() || `Number ${body.number}`;
      } else {
        body.name = values.name.trim();
        body.slug = slug;
      }
      if (isNew) body.sortOrder = Math.max(0, ...items.map((r) => r.sortOrder || 0)) + 1;
      for (const key of ['fromMonth', 'fromDay', 'toMonth', 'toDay']) if (key in body && body[key] !== '') body[key] = Number(body[key]);
      return isNew ? apiSend('post', `${STUDIO}/layers`, body) : apiSend('put', `${STUDIO}/layers/${row._id}`, body);
    },
    {
      invalidate: STUDIO_INVALIDATE,
      success: isNew ? 'Row created.' : 'Row saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );

  const submit = (e) => {
    e.preventDefault();
    const errors = {};
    if (kind === 'numerology') {
      const n = Number(v.number);
      if (!Number.isInteger(n) || n < 1 || n > 9) errors.number = 'Enter a number from 1 to 9.';
    } else if (!v.name.trim()) errors.name = 'Name is required.';
    if (!errors.number && !errors.name && !slug) errors.slug = 'Enter a slug using letters or numbers.';
    // The server upserts by (kind, slug): block instead of silently overwriting another row.
    if (duplicate) errors[kind === 'numerology' ? 'number' : 'slug'] = `“${rowTitle(duplicate)}” already uses this ${kind === 'numerology' ? 'number' : 'slug'}.`;
    if (kind === 'zodiac' && (v.fromMonth !== '' || v.toMonth !== '' || v.fromDay !== '' || v.toDay !== '')) {
      const fromErr = checkDayMonth(v.fromMonth, v.fromDay);
      const toErr = checkDayMonth(v.toMonth, v.toDay);
      if (fromErr) errors.fromMonth = fromErr;
      if (toErr) errors.toMonth = toErr;
    }
    form.setErrors(errors);
    if (Object.keys(errors).length) return;
    save.mutate(v);
  };

  const duplicateHint = duplicate && (
    <span className="text-amber-200">
      Already used by “{rowTitle(duplicate)}”.{' '}
      <button type="button" className="text-gold underline-offset-2 hover:underline" onClick={() => onSwitch(duplicate)}>
        Open it instead
      </button>
    </span>
  );

  return (
    <Drawer
      open={Boolean(row)}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={isNew ? `New ${kindLabel.toLowerCase()} row` : `Edit ${rowTitle(row || {})}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="layer-form" loading={save.isPending} disabled={(!form.dirty && !isNew) || Boolean(duplicate)}>
            {isNew ? 'Create row' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="layer-form" onSubmit={submit} className="space-y-8">
        <FormSection>
          {kind === 'numerology' ? (
            <FormGrid>
              <Field label="Number" required error={form.errors.number} hint={duplicateHint || 'Also used as the slug.'}>
                {({ id }) => (
                  <Select
                    id={id}
                    placeholder="Choose"
                    options={Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
                    value={v.number ?? ''}
                    onChange={(e) => form.set('number', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                )}
              </Field>
              <Field label="Theme" hint="Shown as the title of the number.">
                {({ id }) => <Input id={id} {...form.bind('theme')} placeholder="e.g. Leadership" />}
              </Field>
            </FormGrid>
          ) : (
            <>
              <FormGrid>
                <Field label="Name" required error={form.errors.name}>
                  {({ id }) => <Input id={id} {...form.bind('name')} autoFocus={isNew} placeholder={kind === 'zodiac' ? 'e.g. Aries' : kind === 'planetary' ? 'e.g. Sun' : 'e.g. Teacher'} />}
                </Field>
                {(kind === 'zodiac' || kind === 'planetary') && <Field label="Hindi name">{({ id }) => <Input id={id} {...form.bind('hindi')} placeholder={kind === 'zodiac' ? 'e.g. Mesh' : 'e.g. Surya'} />}</Field>}
                <Field label="Slug" error={form.errors.slug} hint={duplicateHint || (v.slug ? 'Used in the studio URL.' : `Defaults to “${slugify(v.name) || 'name'}”.`)}>
                  {({ id }) => <Input id={id} {...form.bind('slug')} placeholder={slugify(v.name) || 'auto'} className="font-mono" />}
                </Field>
              </FormGrid>
              <Field label="Theme">{({ id }) => <Input id={id} {...form.bind('theme')} placeholder="e.g. Courage and drive" />}</Field>
            </>
          )}
          <Field label="Description" hint="Shown on the studio card.">
            {({ id }) => <Textarea id={id} rows={3} {...form.bind('description')} />}
          </Field>
          <Switch label="Active" description="Hidden rows are not offered in the studio." checked={v.isActive !== false} onChange={(x) => form.set('isActive', x)} />
        </FormSection>

        {kind === 'zodiac' && (
          <FormSection title="Dates" description="Used to match a customer’s birthday to this sign.">
            <Field label="Dates label" hint="Text shown on the card.">
              {({ id }) => <Input id={id} {...form.bind('dates')} placeholder={dateRange(v) || 'e.g. 21 Mar – 19 Apr'} />}
            </Field>
            <DateRangeFields values={v} set={form.set} errors={form.errors} />
          </FormSection>
        )}

        <FormSection title="Beads" description="Beads are matched by name. Unknown names are kept but cannot be shown until a bead with that name exists.">
          {kind === 'numerology' ? (
            <>
              <Field label="Mulank beads" hint="Customers may pick any 3 or all 4.">
                <BeadNameListField beads={beads} value={v.mulank} onChange={(x) => form.set('mulank', x)} />
              </Field>
              <Field label="Bhagyank beads" hint="Kept as a separate layer in the bracelet.">
                <BeadNameListField beads={beads} value={v.bhagyank} onChange={(x) => form.set('bhagyank', x)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Recommended combination" hint="The core set shown first, usually 4 crystals.">
                <BeadNameListField beads={beads} value={v.recommended} onChange={(x) => form.set('recommended', x)} />
              </Field>
              {kind === 'zodiac' && (
                <Field label="All suitable beads" hint="The wider pool for this sign.">
                  <BeadNameListField beads={beads} value={v.suitable} onChange={(x) => form.set('suitable', x)} />
                </Field>
              )}
            </>
          )}
        </FormSection>

        <FormSection title="Card" description="How the box looks in the studio. The image wins over the icon.">
          <FormGrid>
            <Field label="Box image">
              <MediaInput folder="studio" value={v.image} onChange={(x) => form.set('image', x)} />
            </Field>
            <Field label="Icon" hint="An emoji, used when there is no image.">
              {({ id }) => <Input id={id} {...form.bind('icon')} placeholder={kind === 'zodiac' ? '♈' : '✨'} className="w-24 text-lg" />}
            </Field>
          </FormGrid>
          <CardColorFields values={v} set={form.set} />
        </FormSection>
      </form>
    </Drawer>
  );
}

