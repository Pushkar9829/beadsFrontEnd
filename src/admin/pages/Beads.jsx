// Beads & charms for the bracelet studio.
import { useMemo, useState } from 'react';
import { Gem, PackagePlus, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { money, number, plural } from '../lib/format';
import { apiGet, apiSend, toPayload, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  FormGrid,
  FormSection,
  GalleryInput,
  Input,
  MediaInput,
  Menu,
  Modal,
  MoneyInput,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Switch,
  Tabs,
  TagInput,
  Textarea,
  Thumb,
  Toolbar,
  nextSort,
  sortRows,
  useConfirm,
  useForm,
} from '../ui';
import { STUDIO, STUDIO_INVALIDATE, idOf, isHexColor, newKey, slugify, stockState, stripKeys, useStudioBeads, useStudioCharms, withKeys } from './studio/api';
import { BeadThumb, ColorInput, RowListEditor } from './studio/shared';

// Bead writes also change the Inventory page's bead tab.
const BEAD_INVALIDATE = [...STUDIO_INVALIDATE, '/admin/inventory'];

const PAGE_SIZE = 25;
const GRADES = [
  { value: 'natural', label: 'Natural' },
  { value: 'premium', label: 'Premium' },
  { value: 'rare', label: 'Rare' },
];
const STOCK_TONE = { out: 'danger', low: 'warning', ok: 'success' };
const STOCK_LABEL = { out: 'Out', low: 'Low', ok: 'In stock' };

export default function Beads() {
  const [state, set] = useUrlState({ tab: 'beads', q: '', status: 'all', stock: 'all', grade: 'all', sort: 'name', dir: 'asc', page: 1 });
  const beadsQuery = useStudioBeads();
  const charmsQuery = useStudioCharms();
  const [editingBead, setEditingBead] = useState(null);
  const [editingCharm, setEditingCharm] = useState(null);

  return (
    <>
      <PageHeader
        title="Beads & charms"
        description="Crystals customers string in the bracelet studio, and the charms that finish each bracelet."
        actions={
          state.tab === 'charms' ? (
            <Button variant="primary" icon={Plus} onClick={() => setEditingCharm('new')}>
              New charm
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => setEditingBead('new')}>
              New bead
            </Button>
          )
        }
      />
      <Tabs
        value={state.tab}
        onChange={(tab) => set({ tab, q: '', status: 'all', stock: 'all', grade: 'all', sort: 'name', dir: 'asc' })}
        items={[
          { value: 'beads', label: 'Beads', icon: Gem, count: beadsQuery.data ? beadsQuery.beads.length : undefined },
          { value: 'charms', label: 'Charms', icon: Sparkles, count: charmsQuery.data ? charmsQuery.charms.length : undefined },
        ]}
      />
      {state.tab === 'charms' ? (
        <CharmList query={charmsQuery} state={state} set={set} onEdit={setEditingCharm} />
      ) : (
        <BeadList query={beadsQuery} state={state} set={set} onEdit={setEditingBead} />
      )}
      <BeadDrawer key={`b-${editingBead?._id || editingBead || 'none'}`} bead={editingBead} onClose={() => setEditingBead(null)} />
      <CharmDrawer key={`c-${editingCharm?._id || editingCharm || 'none'}`} charm={editingCharm} charms={charmsQuery.charms} onClose={() => setEditingCharm(null)} />
    </>
  );
}

/* ───────────────────────────── Beads ───────────────────────────── */

function BeadList({ query, state, set, onEdit }) {
  const confirm = useConfirm();
  const remove = useApiMutation((id) => apiSend('delete', `${STUDIO}/beads/${id}`), { invalidate: BEAD_INVALIDATE, success: 'Bead deleted.' });
  const hide = useApiMutation((id) => apiSend('put', `${STUDIO}/beads/${id}`, { isActive: false }), { invalidate: BEAD_INVALIDATE, success: 'Bead hidden.' });

  const filtered = useMemo(() => {
    const term = state.q.trim().toLowerCase();
    const rows = query.beads.filter((b) => {
      if (term && !`${b.name} ${b.slug} ${b.chakra || ''} ${b.shortDescriptor || ''}`.toLowerCase().includes(term)) return false;
      if (state.status === 'active' && b.isActive === false) return false;
      if (state.status === 'hidden' && b.isActive !== false) return false;
      if (state.stock !== 'all' && stockState(b) !== state.stock) return false;
      if (state.grade !== 'all' && (b.grade || 'none') !== state.grade) return false;
      return true;
    });
    return sortRows(rows, { key: state.sort, dir: state.dir }, { name: (b) => b.name?.toLowerCase() });
  }, [query.beads, state]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function askDelete(bead) {
    // Look up what points at this bead so the warning is specific.
    let refs = null;
    try {
      const [mappings, mulank, zodiac, layers] = await Promise.all([
        apiGet(`${STUDIO}/mappings`),
        apiGet(`${STUDIO}/mulank`),
        apiGet(`${STUDIO}/zodiac`),
        apiGet(`${STUDIO}/layers`),
      ]);
      const name = bead.name.trim().toLowerCase();
      refs = {
        intentions: (mappings.mappings || []).filter((m) => idOf(m.beadId) === bead._id).map((m) => m.intentionId?.name).filter(Boolean),
        mulank: (mulank.mappings || []).filter((m) => idOf(m.beadId) === bead._id).map((m) => m.number),
        zodiac: (zodiac.mappings || []).filter((m) => idOf(m.beadId) === bead._id).map((m) => m.sign),
        layers: (layers.items || []).filter((l) => ['suitable', 'recommended', 'mulank', 'bhagyank'].some((k) => (l[k] || []).some((n) => n.trim().toLowerCase() === name))).length,
      };
    } catch {
      refs = null;
    }
    const message = (
      <div className="space-y-2">
        {refs ? (
          <>
            {refs.intentions.length > 0 && <p>It is removed from {plural(refs.intentions.length, 'intention')}: {refs.intentions.join(', ')}.</p>}
            {(refs.mulank.length > 0 || refs.zodiac.length > 0) && (
              <p className="text-amber-200">
                It is still the {refs.mulank.length > 0 && `Mulank crystal for ${refs.mulank.join(', ')}`}
                {refs.mulank.length > 0 && refs.zodiac.length > 0 && ' and the '}
                {refs.zodiac.length > 0 && `zodiac bead for ${refs.zodiac.join(', ')}`}. Those mappings will point at a missing bead until you reassign them.
              </p>
            )}
            {refs.layers > 0 && <p>{plural(refs.layers, 'layer catalog row')} list it by name and will show it as missing.</p>}
            {!refs.intentions.length && !refs.mulank.length && !refs.zodiac.length && !refs.layers && <p>Nothing in the studio uses this bead.</p>}
          </>
        ) : (
          <p>Intention mappings that use this bead are deleted too. Mulank, zodiac and layer references are left pointing at a missing bead.</p>
        )}
        <p>Past orders keep their own copy. To keep everything working, hide the bead instead.</p>
      </div>
    );
    if (await confirm({ title: `Delete “${bead.name}”?`, message, confirmLabel: 'Delete bead', tone: 'danger' })) remove.mutate(bead._id);
  }

  const columns = [
    {
      key: 'name',
      header: 'Bead',
      sortable: true,
      render: (b) => (
        <div className="flex min-w-0 items-center gap-3">
          <BeadThumb bead={b} size={36} />
          <div className="min-w-0">
            <div className="truncate font-medium">{b.name}</div>
            {b.shortDescriptor && <div className="truncate text-xs text-lilac">{b.shortDescriptor}</div>}
          </div>
        </div>
      ),
    },
    { key: 'pricePerBead', header: 'Price / bead', sortable: true, align: 'right', render: (b) => <span className="tabular-nums">{money(b.pricePerBead)}</span> },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (b) => {
        const s = stockState(b);
        return (
          <span className="inline-flex items-center gap-2">
            <span className="tabular-nums">{number(b.stock)}</span>
            {s !== 'ok' && <Badge tone={STOCK_TONE[s]}>{STOCK_LABEL[s]}</Badge>}
          </span>
        );
      },
    },
    { key: 'grade', header: 'Grade', hideBelow: 'md', sortable: true, render: (b) => (b.grade ? <Badge tone={b.grade === 'rare' ? 'gold' : b.grade === 'premium' ? 'accent' : 'neutral'}>{b.grade}</Badge> : '—') },
    { key: 'sizeMm', header: 'Size', hideBelow: 'lg', sortable: true, render: (b) => (b.sizeMm ? `${b.sizeMm} mm` : '—') },
    { key: 'isActive', header: 'Status', render: (b) => (b.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (b) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => onEdit(b) },
            { label: 'Hide from studio', icon: Gem, hidden: b.isActive === false, onClick: () => hide.mutate(b._id) },
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(b) },
          ]}
        />
      ),
    },
  ];

  const filtering = state.q || state.status !== 'all' || state.stock !== 'all' || state.grade !== 'all';
  return (
    <>
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search beads…" />
        <FilterSelect
          label="Status"
          value={state.status}
          onChange={(status) => set({ status })}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'hidden', label: 'Hidden' },
          ]}
        />
        <FilterSelect
          label="Stock"
          value={state.stock}
          onChange={(stock) => set({ stock })}
          options={[
            { value: 'all', label: 'Any stock' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
          ]}
        />
        <FilterSelect label="Grade" value={state.grade} onChange={(grade) => set({ grade })} options={[{ value: 'all', label: 'All grades' }, ...GRADES, { value: 'none', label: 'No grade' }]} />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isLoading}
        fetching={query.isFetching}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={onEdit}
        sort={{ key: state.sort, dir: state.dir }}
        onSort={(key) => {
          const next = nextSort({ key: state.sort, dir: state.dir }, key);
          set({ sort: next.key, dir: next.dir });
        }}
        empty={
          <EmptyState
            icon={Gem}
            title={filtering ? 'No beads match these filters' : 'No beads yet'}
            description={filtering ? undefined : 'Beads are the crystals customers pick in the bracelet studio.'}
            action={!filtering && <Button icon={Plus} onClick={() => onEdit('new')}>New bead</Button>}
          />
        }
        footer={filtered.length > PAGE_SIZE && <Pagination pagination={{ page, pages, total: filtered.length, limit: PAGE_SIZE }} onPage={(p) => set({ page: p })} />}
      />
    </>
  );
}

const BEAD_EMPTY = {
  name: '',
  shortDescriptor: '',
  image: '',
  images: [],
  textureUrl: '',
  colorHex: '#C6A75E',
  pricePerBead: '',
  stock: 100,
  lowStockLimit: 10,
  sizeMm: '',
  shape: '',
  grade: '',
  chakra: '',
  origin: '',
  powerUse: '',
  benefits: [],
  careNotes: '',
  disclaimer: '',
  isActive: true,
};

function beadToForm(bead) {
  const out = { ...BEAD_EMPTY };
  for (const key of Object.keys(BEAD_EMPTY)) {
    const v = bead[key];
    if (v !== undefined && v !== null) out[key] = v;
  }
  out.benefits = Array.isArray(bead.benefits) ? bead.benefits : [];
  out.images = Array.isArray(bead.images) ? bead.images : [];
  return out;
}

function BeadDrawer({ bead, onClose }) {
  const isNew = bead === 'new';
  const form = useForm(isNew || !bead ? BEAD_EMPTY : beadToForm(bead));
  const [adjusting, setAdjusting] = useState(false);
  const v = form.values;
  const renamed = !isNew && bead && v.name.trim() !== bead.name;

  const save = useApiMutation(
    (values) => {
      const body = toPayload(values, {
        nullable: ['sizeMm', 'grade'],
        numbers: ['pricePerBead', 'stock', 'lowStockLimit', 'sizeMm'],
        // Stock on an existing bead changes through "Adjust stock" so it is logged in stock history.
        omit: isNew ? [] : ['stock'],
      });
      body.name = body.name.trim();
      if (isNew && !body.disclaimer) delete body.disclaimer; // keep the standard disclaimer
      if (isNew && body.grade === null) delete body.grade;
      return isNew ? apiSend('post', `${STUDIO}/beads`, body) : apiSend('put', `${STUDIO}/beads/${bead._id}`, body);
    },
    {
      invalidate: BEAD_INVALIDATE,
      success: isNew ? 'Bead created.' : 'Bead saved.',
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
    if (!v.name.trim()) errors.name = 'Name is required.';
    if (v.pricePerBead === '' || Number(v.pricePerBead) < 0) errors.pricePerBead = 'Enter a price of 0 or more.';
    if (isNew && (v.stock === '' || Number(v.stock) < 0 || !Number.isInteger(Number(v.stock)))) errors.stock = 'Enter a whole number of 0 or more.';
    if (v.lowStockLimit !== '' && Number(v.lowStockLimit) < 0) errors.lowStockLimit = 'Must be 0 or more.';
    if (v.sizeMm !== '' && Number(v.sizeMm) <= 0) errors.sizeMm = 'Must be more than 0, or leave empty.';
    if (v.colorHex && !isHexColor(v.colorHex)) errors.colorHex = 'Use a hex colour like #C6A75E.';
    form.setErrors(errors);
    if (Object.keys(errors).length) return;
    save.mutate(v);
  };

  return (
    <Drawer
      open={Boolean(bead)}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={isNew ? 'New bead' : `Edit ${bead?.name || 'bead'}`}
      description={!isNew && bead ? `Slug: ${bead.slug}` : 'The slug is created from the name.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="bead-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create bead' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="bead-form" onSubmit={submit} className="space-y-8">
        <FormSection title="Basics">
          <Field
            label="Name"
            required
            error={form.errors.name}
            hint={renamed ? 'Layer catalogs refer to beads by name. After renaming, update the rows on Studio layers that list it.' : undefined}
          >
            {({ id }) => <Input id={id} {...form.bind('name')} placeholder="e.g. Rose Quartz" autoFocus={isNew} />}
          </Field>
          <Field label="Short descriptor" hint="One line shown under the name in the studio.">
            {({ id }) => <Input id={id} {...form.bind('shortDescriptor')} placeholder="e.g. Stone of unconditional love" />}
          </Field>
          <Switch label="Active" description="Hidden beads are not offered in the studio (unless a Mulank or zodiac mapping still uses them)." checked={v.isActive !== false} onChange={(x) => form.set('isActive', x)} />
        </FormSection>

        <FormSection title="Price & stock">
          <FormGrid cols={3}>
            <Field label="Price per bead" required error={form.errors.pricePerBead}>
              {({ id }) => <MoneyInput id={id} value={v.pricePerBead} onChange={(x) => form.set('pricePerBead', x)} />}
            </Field>
            {isNew ? (
              <Field label="Opening stock" error={form.errors.stock}>
                {({ id }) => <NumberInput id={id} min={0} value={v.stock} onChange={(x) => form.set('stock', x)} />}
              </Field>
            ) : (
              <Field label="Stock" hint="Changes are logged in stock history.">
                <div className="flex h-9 items-center justify-between gap-2 rounded-lg border border-white/10 bg-raised pl-3 pr-1">
                  <span className="tabular-nums text-sm text-ivory">{number(bead?.stock)}</span>
                  <Button size="sm" variant="ghost" icon={PackagePlus} onClick={() => setAdjusting(true)}>
                    Adjust
                  </Button>
                </div>
              </Field>
            )}
            <Field label="Low-stock alert at" error={form.errors.lowStockLimit}>
              {({ id }) => <NumberInput id={id} min={0} value={v.lowStockLimit} onChange={(x) => form.set('lowStockLimit', x)} />}
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Look" description="The image is the bead shown on the strand; the colour is used when there is no image.">
          <FormGrid>
            <Field label="Bead image">
              <MediaInput folder="bead" value={v.image} onChange={(x) => form.set('image', x)} />
            </Field>
            <Field label="Texture image" hint="Optional close-up of the stone surface.">
              <MediaInput folder="bead" value={v.textureUrl} onChange={(x) => form.set('textureUrl', x)} />
            </Field>
          </FormGrid>
          <Field label="Colour" error={form.errors.colorHex}>
            {({ id }) => <ColorInput id={id} value={v.colorHex} onChange={(x) => form.set('colorHex', x)} />}
          </Field>
          <Field label="More photos" hint="Extra photos for the bead detail view. The first one is the cover.">
            <GalleryInput folder="bead" value={v.images} onChange={(x) => form.set('images', x)} />
          </Field>
        </FormSection>

        <FormSection title="Details">
          <FormGrid>
            <Field label="Size" error={form.errors.sizeMm} hint="Leave empty if it varies.">
              {({ id }) => <NumberInput id={id} min={0} step="0.5" value={v.sizeMm} onChange={(x) => form.set('sizeMm', x)} suffix="mm" />}
            </Field>
            <Field label="Shape">{({ id }) => <Input id={id} {...form.bind('shape')} placeholder="e.g. Round" />}</Field>
            <Field label="Grade">{({ id }) => <Select id={id} options={GRADES} placeholder="No grade" {...form.bind('grade')} />}</Field>
            <Field label="Chakra">{({ id }) => <Input id={id} {...form.bind('chakra')} placeholder="e.g. Heart" />}</Field>
            <Field label="Origin">{({ id }) => <Input id={id} {...form.bind('origin')} placeholder="e.g. Brazil" />}</Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Story">
          <Field label="Power / use" hint="What the crystal is traditionally used for.">
            {({ id }) => <Textarea id={id} rows={3} {...form.bind('powerUse')} />}
          </Field>
          <Field label="Benefits" hint="Press Enter after each benefit.">
            <TagInput value={v.benefits} onChange={(x) => form.set('benefits', x)} placeholder="e.g. Calms the mind" />
          </Field>
          <Field label="Care notes">{({ id }) => <Textarea id={id} rows={3} {...form.bind('careNotes')} />}</Field>
          <Field label="Disclaimer" hint={isNew ? 'Leave empty to use the standard “not a medical claim” disclaimer.' : 'Shown under the bead details.'}>
            {({ id }) => <Textarea id={id} rows={3} {...form.bind('disclaimer')} />}
          </Field>
        </FormSection>
      </form>
      {!isNew && bead && <AdjustStockModal open={adjusting} bead={bead} onClose={() => setAdjusting(false)} />}
    </Drawer>
  );
}

const ADJUST_REASONS = [
  { value: 'restock', label: 'Restock' },
  { value: 'correction', label: 'Count correction' },
  { value: 'damage', label: 'Damaged' },
  { value: 'return', label: 'Customer return' },
  { value: 'other', label: 'Other' },
];

/** Logged stock change through the inventory endpoint (POST /admin/inventory/adjust). */
function AdjustStockModal({ open, bead, onClose }) {
  const form = useForm({ delta: '', reason: 'restock' });
  const delta = Number(form.values.delta) || 0;
  const next = Number(bead.stock || 0) + delta;
  const adjust = useApiMutation((values) => apiSend('post', '/admin/inventory/adjust', { beadId: bead._id, delta: Number(values.delta), reason: values.reason }), {
    invalidate: [...STUDIO_INVALIDATE, '/admin/inventory', '/admin/dashboard'],
    success: 'Stock updated.',
    onSuccess: () => {
      form.reset({ delta: '', reason: 'restock' });
      onClose();
    },
  });
  const submit = (e) => {
    e.preventDefault();
    if (!delta || !Number.isInteger(delta)) return form.setErrors({ delta: 'Enter a whole number, e.g. 20 or -3.' });
    if (next < 0) return form.setErrors({ delta: 'Stock cannot go below 0.' });
    adjust.mutate(form.values);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      size="sm"
      title={`Adjust stock · ${bead.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="adjust-bead-stock" loading={adjust.isPending}>
            Update stock
          </Button>
        </>
      }
    >
      <form id="adjust-bead-stock" onSubmit={submit} className="space-y-4">
        <Field label="Change by" error={form.errors.delta} hint={delta ? `${number(bead.stock)} → ${number(next)}` : `Currently ${number(bead.stock)}. Use a minus sign to remove stock.`}>
          {({ id }) => <NumberInput id={id} value={form.values.delta} onChange={(x) => form.set('delta', x)} placeholder="e.g. 20" autoFocus />}
        </Field>
        <Field label="Reason">{({ id }) => <Select id={id} options={ADJUST_REASONS} {...form.bind('reason')} />}</Field>
      </form>
    </Modal>
  );
}

/* ───────────────────────────── Charms ───────────────────────────── */

function CharmList({ query, state, set, onEdit }) {
  const confirm = useConfirm();
  const remove = useApiMutation((id) => apiSend('delete', `${STUDIO}/charms/${id}`), { invalidate: STUDIO_INVALIDATE, success: 'Charm deleted.' });
  const rows = useMemo(() => {
    const term = state.q.trim().toLowerCase();
    return query.charms.filter((c) => {
      if (term && !`${c.name} ${c.description || ''}`.toLowerCase().includes(term)) return false;
      if (state.status === 'active' && c.isActive === false) return false;
      if (state.status === 'hidden' && c.isActive !== false) return false;
      return true;
    });
  }, [query.charms, state.q, state.status]);

  async function askDelete(charm) {
    const activeLeft = query.charms.filter((c) => c._id !== charm._id && c.isActive !== false).length;
    const blocksStudio = activeLeft === 0 && query.config?.charmRequired !== false;
    const ok = await confirm({
      title: `Delete “${charm.name}”?`,
      message: (
        <div className="space-y-2">
          <p>Customers can no longer choose it. Bracelets already in carts or orders keep their copy.</p>
          {blocksStudio && <p className="text-amber-200">This is the last active charm and a charm is required, so nobody will be able to finish a bracelet until you add another.</p>}
        </div>
      ),
      confirmLabel: 'Delete charm',
      tone: 'danger',
    });
    if (ok) remove.mutate(charm._id);
  }

  const columns = [
    {
      key: 'name',
      header: 'Charm',
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={c.image ? mediaUrl(c.image) : ''} size={36} />
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            {c.description && <div className="line-clamp-1 text-xs text-lilac">{c.description}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'finishes',
      header: 'Finishes',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {(c.finishes || []).map((f) => (
            <span key={f.key} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ivory">
              <span className="h-2 w-2 rounded-full" style={{ background: f.metalColor }} />
              {f.label}
              {Number(f.price) > 0 && <span className="text-lilac">+{money(f.price)}</span>}
            </span>
          ))}
        </div>
      ),
    },
    { key: 'isActive', header: 'Status', render: (c) => (c.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => onEdit(c) },
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(c) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search charms…" />
        <FilterSelect
          label="Status"
          value={state.status}
          onChange={(status) => set({ status })}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'hidden', label: 'Hidden' },
          ]}
        />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isLoading}
        fetching={query.isFetching}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={onEdit}
        empty={
          <EmptyState
            icon={Sparkles}
            title={state.q || state.status !== 'all' ? 'No charms match these filters' : 'No charms yet'}
            description="Charms are chosen on the finish step of the studio."
            action={!state.q && <Button icon={Plus} onClick={() => onEdit('new')}>New charm</Button>}
          />
        }
      />
    </>
  );
}

const DEFAULT_FINISH = { key: 'gold', label: 'Gold', price: 0, metalColor: '#D4AF37' };
const CHARM_EMPTY = { name: '', description: '', image: '', isActive: true, finishes: withKeys([DEFAULT_FINISH]) };

function charmToForm(charm) {
  return {
    name: charm.name || '',
    description: charm.description || '',
    image: charm.image || '',
    isActive: charm.isActive !== false,
    finishes: withKeys((charm.finishes || []).map(({ key, label, price, metalColor }) => ({ key: key || '', label: label || '', price: price ?? 0, metalColor: metalColor || '' }))),
  };
}

function CharmDrawer({ charm, charms, onClose }) {
  const isNew = charm === 'new';
  const form = useForm(isNew || !charm ? CHARM_EMPTY : charmToForm(charm));
  const v = form.values;

  const save = useApiMutation(
    (values) => {
      const body = {
        name: values.name.trim(),
        description: values.description,
        image: values.image,
        isActive: values.isActive,
        // Always send the full finishes list.
        finishes: stripKeys(values.finishes).map((f) => ({ key: f.key.trim(), label: f.label.trim(), price: Number(f.price) || 0, metalColor: f.metalColor })),
      };
      return isNew ? apiSend('post', `${STUDIO}/charms`, body) : apiSend('put', `${STUDIO}/charms/${charm._id}`, body);
    },
    {
      invalidate: STUDIO_INVALIDATE,
      success: isNew ? 'Charm created.' : 'Charm saved.',
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
    const name = v.name.trim();
    if (!name) errors.name = 'Name is required.';
    else if (charms.some((c) => c._id !== charm?._id && slugify(c.name) === slugify(name))) errors.name = 'Another charm already has this name.';
    if (!v.finishes.length) errors.finishes = 'Add at least one finish.';
    const seen = new Set();
    v.finishes.forEach((f, i) => {
      const key = f.key.trim();
      if (!f.label.trim()) errors[`finishes.${i}.label`] = 'Label is required.';
      if (!key) errors[`finishes.${i}.key`] = 'Key is required.';
      else if (seen.has(key)) errors[`finishes.${i}.key`] = 'Keys must be unique.';
      seen.add(key);
      if (f.price === '' || Number(f.price) < 0) errors[`finishes.${i}.price`] = 'Must be 0 or more.';
      if (!isHexColor(f.metalColor)) errors[`finishes.${i}.metalColor`] = 'Pick a colour.';
    });
    form.setErrors(errors);
    if (Object.keys(errors).length) return;
    save.mutate(v);
  };

  return (
    <Drawer
      open={Boolean(charm)}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={isNew ? 'New charm' : `Edit ${charm?.name || 'charm'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="charm-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create charm' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="charm-form" onSubmit={submit} className="space-y-8">
        <FormSection>
          <Field label="Name" required error={form.errors.name}>
            {({ id }) => <Input id={id} {...form.bind('name')} placeholder="e.g. Lotus" autoFocus={isNew} />}
          </Field>
          <Field label="Description">{({ id }) => <Textarea id={id} rows={3} {...form.bind('description')} />}</Field>
          <Field label="Image">
            <MediaInput folder="charm" value={v.image} onChange={(x) => form.set('image', x)} />
          </Field>
          <Switch label="Active" description="Hidden charms are not offered on the finish step." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
        </FormSection>
        <FormSection title="Finishes" description="Metal options for this charm. The finish price is added on top of the charm packaging price. The first finish is preselected.">
          {form.errors.finishes && <p className="text-xs text-rose-300">{form.errors.finishes}</p>}
          <RowListEditor
            rows={v.finishes}
            onChange={(rows) => form.set('finishes', rows)}
            minRows={1}
            addLabel="Add finish"
            title={(f, i) => f.label || `Finish ${i + 1}`}
            makeRow={() => ({ key: '', label: '', price: 0, metalColor: '#D4AF37', _k: newKey() })}
            render={(f, update, i) => (
              <FormGrid>
                <Field label="Label" required error={form.errors[`finishes.${i}.label`]}>
                  {({ id }) => (
                    <Input
                      id={id}
                      value={f.label}
                      onChange={(e) => update({ label: e.target.value })}
                      onBlur={() => !f.key.trim() && f.label.trim() && update({ key: slugify(f.label) })}
                      placeholder="e.g. Rose gold"
                    />
                  )}
                </Field>
                <Field label="Key" required error={form.errors[`finishes.${i}.key`]} hint="Saved with orders. Avoid renaming once used.">
                  {({ id }) => <Input id={id} value={f.key} onChange={(e) => update({ key: e.target.value })} placeholder="e.g. rose-gold" className="font-mono" />}
                </Field>
                <Field label="Extra price" error={form.errors[`finishes.${i}.price`]}>
                  {({ id }) => <MoneyInput id={id} value={f.price} onChange={(x) => update({ price: x })} />}
                </Field>
                <Field label="Metal colour" required error={form.errors[`finishes.${i}.metalColor`]}>
                  {({ id }) => <ColorInput id={id} value={f.metalColor} onChange={(x) => update({ metalColor: x })} placeholder="#D4AF37" />}
                </Field>
              </FormGrid>
            )}
          />
        </FormSection>
      </form>
    </Drawer>
  );
}
