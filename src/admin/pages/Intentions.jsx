// Purposes → intentions → recommended beads, plus Mulank crystals and zodiac beads.
import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Compass, Gem, Hash, ListOrdered, Pencil, Plus, Sparkles, Star, Trash2, X } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { money, plural } from '../lib/format';
import { apiGet, apiSend, useApiMutation, useApiQuery, useQueryClient } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  FormSection,
  IconButton,
  Input,
  MediaInput,
  Menu,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
  Toolbar,
  cx,
  useConfirm,
  useForm,
} from '../ui';
import { STUDIO, STUDIO_INVALIDATE, ZODIAC_SIGNS, checkDayMonth, dateRange, idOf, moveItem, newKey, slugify, useStudioBeads } from './studio/api';
import { BeadField, BeadPickerModal, BeadThumb, CardColorFields, DateRangeFields } from './studio/shared';

const bySort = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name));

export default function Intentions() {
  const [state, set] = useUrlState({ tab: 'purposes', purpose: '' });
  return (
    <>
      <PageHeader title="Purposes & bead rules" description="Which crystals the bracelet studio recommends for each purpose, intention, Mulank number and zodiac sign." />
      <Tabs
        value={state.tab}
        onChange={(tab) => set({ tab })}
        items={[
          { value: 'purposes', label: 'Purposes & intentions', icon: Compass },
          { value: 'mulank', label: 'Mulank crystals', icon: Hash },
          { value: 'zodiac', label: 'Zodiac beads', icon: Star },
        ]}
      />
      {state.tab === 'mulank' ? <MulankTab /> : state.tab === 'zodiac' ? <ZodiacTab /> : <PurposesTab selectedId={state.purpose} onSelect={(purpose) => set({ purpose })} />}
    </>
  );
}

/* ───────────────────────── Purposes & intentions ───────────────────────── */

function useReorder(kind) {
  // Renumbers sortOrder 1..n for the given ordered list, only sending rows that changed.
  return useApiMutation(
    async (list) => {
      for (let i = 0; i < list.length; i += 1) {
        if (list[i].sortOrder !== i + 1) await apiSend('put', `${STUDIO}/${kind}/${list[i]._id}`, { sortOrder: i + 1 });
      }
    },
    { invalidate: STUDIO_INVALIDATE, success: false }
  );
}

function PurposesTab({ selectedId, onSelect }) {
  const confirm = useConfirm();
  const purposesQ = useApiQuery(`${STUDIO}/purposes`);
  const intentionsQ = useApiQuery(`${STUDIO}/intentions`);
  const mappingsQ = useApiQuery(`${STUDIO}/mappings`);
  const { beads } = useStudioBeads();
  const [editPurpose, setEditPurpose] = useState(null);
  const [editIntention, setEditIntention] = useState(null);
  const [beadsFor, setBeadsFor] = useState(null);

  const purposes = useMemo(() => [...(purposesQ.data?.purposes || [])].sort(bySort), [purposesQ.data]);
  const intentions = useMemo(() => intentionsQ.data?.intentions || [], [intentionsQ.data]);
  const purposeIds = useMemo(() => new Set(purposes.map((p) => p._id)), [purposes]);
  const orphans = useMemo(() => intentions.filter((i) => !purposeIds.has(idOf(i.purposeId))).sort(bySort), [intentions, purposeIds]);
  const mappingsByIntention = useMemo(() => {
    const map = new Map();
    for (const m of mappingsQ.data?.mappings || []) {
      const key = idOf(m.intentionId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    for (const list of map.values()) list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return map;
  }, [mappingsQ.data]);

  const selected = selectedId === 'unassigned' && orphans.length ? 'unassigned' : purposes.find((p) => p._id === selectedId)?._id || purposes[0]?._id || (orphans.length ? 'unassigned' : '');
  const selectedPurpose = purposes.find((p) => p._id === selected);
  const visibleIntentions = selected === 'unassigned' ? orphans : intentions.filter((i) => idOf(i.purposeId) === selected).sort(bySort);
  const countFor = (purposeId) => intentions.filter((i) => idOf(i.purposeId) === purposeId).length;

  const reorderPurposes = useReorder('purposes');
  const reorderIntentions = useReorder('intentions');
  const removePurpose = useApiMutation((id) => apiSend('delete', `${STUDIO}/purposes/${id}`), { invalidate: STUDIO_INVALIDATE, success: 'Purpose deleted.' });
  const removeIntention = useApiMutation((id) => apiSend('delete', `${STUDIO}/intentions/${id}`), { invalidate: STUDIO_INVALIDATE, success: 'Intention deleted.' });

  async function askDeletePurpose(p) {
    const n = countFor(p._id);
    const ok = await confirm({
      title: `Delete “${p.name}”?`,
      message: n
        ? `Its ${plural(n, 'intention')} are not deleted. They become unassigned and disappear from the studio until you move them to another purpose.`
        : 'This purpose has no intentions.',
      confirmLabel: 'Delete purpose',
      tone: 'danger',
    });
    if (ok) removePurpose.mutate(p._id);
  }

  async function askDeleteIntention(i) {
    const n = mappingsByIntention.get(i._id)?.length || 0;
    const ok = await confirm({
      title: `Delete “${i.name}”?`,
      message: n ? `Its ${plural(n, 'bead recommendation')} are deleted too. Past orders keep their copy.` : 'Past orders keep their copy.',
      confirmLabel: 'Delete intention',
      tone: 'danger',
    });
    if (ok) removeIntention.mutate(i._id);
  }

  const error = purposesQ.error || intentionsQ.error;
  if (error) {
    return (
      <Card>
        <ErrorState
          error={error}
          onRetry={() => {
            purposesQ.refetch();
            intentionsQ.refetch();
          }}
        />
      </Card>
    );
  }
  const loading = purposesQ.isLoading || intentionsQ.isLoading;

  const intentionColumns = [
    {
      key: 'name',
      header: 'Intention',
      render: (i) => (
        <div className="flex min-w-0 items-center gap-3">
          <CardIcon item={i} />
          <div className="min-w-0">
            <div className="truncate font-medium">{i.name}</div>
            {i.braceletName && <div className="truncate text-xs text-lilac">Bracelet: {i.braceletName}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'beads',
      header: 'Beads',
      render: (i) => {
        const list = mappingsByIntention.get(i._id) || [];
        if (!list.length) return <Badge tone="warning">No beads</Badge>;
        return (
          <div className="min-w-0">
            <div className="text-sm">{plural(list.length, 'bead')}</div>
            <div className="truncate text-xs text-lilac">Primary: {list[0].beadId?.name || 'missing bead'}</div>
          </div>
        );
      },
    },
    { key: 'isActive', header: 'Status', hideBelow: 'sm', render: (i) => (i.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (i) => {
        const idx = visibleIntentions.indexOf(i);
        return (
          <Menu
            items={[
              { label: 'Edit beads', icon: ListOrdered, onClick: () => setBeadsFor(i) },
              { label: 'Edit details', icon: Pencil, onClick: () => setEditIntention(i) },
              { label: 'Move up', icon: ArrowUp, hidden: selected === 'unassigned', disabled: idx <= 0 || reorderIntentions.isPending, onClick: () => reorderIntentions.mutate(moveItem(visibleIntentions, idx, idx - 1)) },
              { label: 'Move down', icon: ArrowDown, hidden: selected === 'unassigned', disabled: idx >= visibleIntentions.length - 1 || reorderIntentions.isPending, onClick: () => reorderIntentions.mutate(moveItem(visibleIntentions, idx, idx + 1)) },
              'divider',
              { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDeleteIntention(i) },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card padded={false} className="self-start">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3">
          <h3 className="text-sm font-semibold text-ivory">Purposes</h3>
          <Button size="sm" icon={Plus} onClick={() => setEditPurpose('new')}>
            New
          </Button>
        </div>
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : purposes.length === 0 && !orphans.length ? (
          <EmptyState icon={Compass} title="No purposes yet" description="A purpose is the first choice in the studio, like Love or Wealth." />
        ) : (
          <ul className="max-h-[70vh] overflow-y-auto p-2">
            {purposes.map((p, idx) => (
              <li key={p._id} className={cx('group flex items-center gap-1 rounded-xl pr-1', selected === p._id ? 'bg-gold/[0.08] ring-1 ring-inset ring-gold/30' : 'hover:bg-white/[0.04]')}>
                <button type="button" onClick={() => onSelect(p._id)} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left">
                  <CardIcon item={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ivory">{p.name}</span>
                    <span className="block text-xs text-lilac">{plural(countFor(p._id), 'intention')}</span>
                  </span>
                  {p.isActive === false && <Badge>Hidden</Badge>}
                </button>
                <Menu
                  items={[
                    { label: 'Edit', icon: Pencil, onClick: () => setEditPurpose(p) },
                    { label: 'Move up', icon: ArrowUp, disabled: idx === 0 || reorderPurposes.isPending, onClick: () => reorderPurposes.mutate(moveItem(purposes, idx, idx - 1)) },
                    { label: 'Move down', icon: ArrowDown, disabled: idx === purposes.length - 1 || reorderPurposes.isPending, onClick: () => reorderPurposes.mutate(moveItem(purposes, idx, idx + 1)) },
                    'divider',
                    { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDeletePurpose(p) },
                  ]}
                />
              </li>
            ))}
            {orphans.length > 0 && (
              <li className={cx('rounded-xl', selected === 'unassigned' ? 'bg-amber-400/[0.08] ring-1 ring-inset ring-amber-300/30' : 'hover:bg-white/[0.04]')}>
                <button type="button" onClick={() => onSelect('unassigned')} className="flex w-full items-center gap-3 px-2 py-2 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400/10 text-amber-200">
                    <AlertTriangle size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ivory">Unassigned</span>
                    <span className="block text-xs text-amber-200">{plural(orphans.length, 'intention')} without a purpose</span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        )}
      </Card>

      <Card padded={false} className="min-w-0">
        <div className="border-b border-white/[0.08] px-4 py-3">
          <CardHeader
            className="mb-0"
            title={selected === 'unassigned' ? 'Unassigned intentions' : selectedPurpose?.name || 'Intentions'}
            description={
              selected === 'unassigned'
                ? 'Their purpose was deleted, so customers cannot reach them. Edit each one to move it to a purpose.'
                : 'Each intention is a named bracelet. Customers pick intentions, then crystals from its bead list.'
            }
            actions={
              selected !== 'unassigned' &&
              selectedPurpose && (
                <>
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditPurpose(selectedPurpose)}>
                    Edit purpose
                  </Button>
                  <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditIntention({ isNew: true, purposeId: selectedPurpose._id })}>
                    New intention
                  </Button>
                </>
              )
            }
          />
        </div>
        <DataTable
          className="rounded-none border-0"
          dense
          columns={intentionColumns}
          rows={visibleIntentions}
          loading={loading}
          fetching={intentionsQ.isFetching || reorderIntentions.isPending}
          onRowClick={setBeadsFor}
          empty={
            <EmptyState
              icon={Sparkles}
              title={selectedPurpose ? 'No intentions yet' : 'Choose a purpose'}
              description={selectedPurpose ? `Add the bracelets customers can pick under ${selectedPurpose.name}.` : undefined}
              action={selectedPurpose && <Button icon={Plus} onClick={() => setEditIntention({ isNew: true, purposeId: selectedPurpose._id })}>New intention</Button>}
            />
          }
        />
      </Card>

      <PurposeDrawer key={`p-${editPurpose?._id || editPurpose || 'none'}`} purpose={editPurpose} purposes={purposes} onClose={() => setEditPurpose(null)} onCreated={(p) => p?._id && onSelect(p._id)} />
      <IntentionDrawer key={`i-${editIntention?._id || (editIntention ? 'new' : 'none')}`} intention={editIntention} purposes={purposes} intentions={intentions} onClose={() => setEditIntention(null)} />
      <MappingsDrawer key={`m-${beadsFor?._id || 'none'}`} intention={beadsFor} beads={beads} onClose={() => setBeadsFor(null)} />
    </div>
  );
}

function CardIcon({ item }) {
  if (item.image) return <img src={mediaUrl(item.image)} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover" />;
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-base" style={{ background: item.cardBg || 'rgba(255,255,255,0.04)', borderColor: item.cardAccent || undefined }}>
      {item.icon || <Gem size={14} className="text-lilac" />}
    </span>
  );
}

const CARD_EMPTY = { name: '', description: '', image: '', icon: '', cardBg: '', cardAccent: '', isActive: true };
const pickCard = (row, extra = {}) => ({
  name: row.name || '',
  description: row.description || '',
  image: row.image || '',
  icon: row.icon || '',
  cardBg: row.cardBg || '',
  cardAccent: row.cardAccent || '',
  isActive: row.isActive !== false,
  ...extra,
});

function CardFields({ form, folder, nameLabel, namePlaceholder, isNew }) {
  const v = form.values;
  return (
    <>
      <Field label={nameLabel} required error={form.errors.name}>
        {({ id }) => <Input id={id} {...form.bind('name')} placeholder={namePlaceholder} autoFocus={isNew} />}
      </Field>
      <Field label="Description">{({ id }) => <Textarea id={id} rows={3} {...form.bind('description')} />}</Field>
      <FormSection title="Card" description="How the box looks in the studio. The image wins over the icon.">
        <FormGrid>
          <Field label="Box image">
            <MediaInput folder={folder} value={v.image} onChange={(x) => form.set('image', x)} />
          </Field>
          <Field label="Icon" hint="An emoji, used when there is no image.">
            {({ id }) => <Input id={id} {...form.bind('icon')} placeholder="✨" className="w-24 text-lg" />}
          </Field>
        </FormGrid>
        <CardColorFields values={v} set={form.set} />
      </FormSection>
      <Switch label="Active" description="Hidden entries are not shown in the studio." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
    </>
  );
}

function PurposeDrawer({ purpose, purposes, onClose, onCreated }) {
  const isNew = purpose === 'new';
  const form = useForm(isNew || !purpose ? CARD_EMPTY : pickCard(purpose));
  const save = useApiMutation(
    (values) => {
      const body = { ...values, name: values.name.trim() };
      if (isNew) body.sortOrder = Math.max(0, ...purposes.map((p) => p.sortOrder || 0)) + 1;
      return isNew ? apiSend('post', `${STUDIO}/purposes`, body) : apiSend('put', `${STUDIO}/purposes/${purpose._id}`, body);
    },
    {
      invalidate: STUDIO_INVALIDATE,
      success: isNew ? 'Purpose created.' : 'Purpose saved.',
      onSuccess: (data) => {
        form.reset();
        if (isNew) onCreated?.(data?.purpose);
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );
  const submit = (e) => {
    e.preventDefault();
    const name = form.values.name.trim();
    if (!name) return form.setErrors({ name: 'Name is required.' });
    if (purposes.some((p) => p._id !== purpose?._id && slugify(p.name) === slugify(name))) return form.setErrors({ name: 'Another purpose already has this name.' });
    save.mutate(form.values);
  };
  return (
    <Drawer
      open={Boolean(purpose)}
      onClose={onClose}
      dirty={form.dirty}
      title={isNew ? 'New purpose' : `Edit ${purpose?.name || 'purpose'}`}
      description={!isNew && purpose?.slug ? `Slug: ${purpose.slug} (renaming changes it)` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="purpose-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create purpose' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="purpose-form" onSubmit={submit} className="space-y-6">
        <CardFields form={form} folder="purpose" nameLabel="Name" namePlaceholder="e.g. Love & relationships" isNew={isNew} />
      </form>
    </Drawer>
  );
}

function IntentionDrawer({ intention, purposes, intentions, onClose }) {
  const isNew = Boolean(intention?.isNew);
  const form = useForm(
    !intention
      ? { ...CARD_EMPTY, braceletName: '', purposeId: '' }
      : isNew
        ? { ...CARD_EMPTY, braceletName: '', purposeId: intention.purposeId || '' }
        : pickCard(intention, { braceletName: intention.braceletName || '', purposeId: purposes.some((p) => p._id === idOf(intention.purposeId)) ? idOf(intention.purposeId) : '' })
  );
  const v = form.values;
  const save = useApiMutation(
    (values) => {
      const body = { ...values, name: values.name.trim(), braceletName: values.braceletName.trim() };
      if (isNew || values.purposeId !== idOf(intention.purposeId)) {
        // New, or moved to another purpose: put it at the end of that purpose's list.
        body.sortOrder = Math.max(0, ...intentions.filter((i) => idOf(i.purposeId) === values.purposeId).map((i) => i.sortOrder || 0)) + 1;
      }
      return isNew ? apiSend('post', `${STUDIO}/intentions`, body) : apiSend('put', `${STUDIO}/intentions/${intention._id}`, body);
    },
    {
      invalidate: STUDIO_INVALIDATE,
      success: isNew ? 'Intention created.' : 'Intention saved.',
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
    else if (intentions.some((i) => i._id !== intention?._id && slugify(i.name) === slugify(name))) errors.name = 'Another intention already has this name (names must be unique across all purposes).';
    if (!v.purposeId) errors.purposeId = 'Choose a purpose.';
    form.setErrors(errors);
    if (Object.keys(errors).length) return;
    save.mutate(v);
  };
  return (
    <Drawer
      open={Boolean(intention)}
      onClose={onClose}
      dirty={form.dirty}
      title={isNew ? 'New intention' : `Edit ${intention?.name || 'intention'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="intention-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create intention' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="intention-form" onSubmit={submit} className="space-y-6">
        <Field label="Purpose" required error={form.errors.purposeId}>
          {({ id }) => <Select id={id} placeholder="Choose a purpose" options={purposes.map((p) => ({ value: p._id, label: p.name }))} {...form.bind('purposeId')} />}
        </Field>
        <CardFields form={form} folder="purpose" nameLabel="Intention" namePlaceholder="e.g. Attract a partner" isNew={isNew} />
        <Field label="Bracelet name" hint="The name given to the finished bracelet, e.g. “The Heartline”.">
          {({ id }) => <Input id={id} {...form.bind('braceletName')} />}
        </Field>
      </form>
    </Drawer>
  );
}

/** Ordered bead list for one intention (IntentionBead rows). */
function MappingsDrawer({ intention, beads, onClose }) {
  const qc = useQueryClient();
  const query = useApiQuery(`${STUDIO}/mappings`, { intentionId: intention?._id }, { enabled: Boolean(intention), keepPrevious: false });
  const server = useMemo(() => [...(query.data?.mappings || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [query.data]);
  const form = useForm({
    rows: server.map((m) => ({ _k: m._id, mappingId: m._id, beadId: idOf(m.beadId), bead: m.beadId || null, reason: m.reason || '' })),
  });
  const rows = form.values.rows;
  const [picking, setPicking] = useState(false);
  const beadById = useMemo(() => new Map(beads.map((b) => [b._id, b])), [beads]);

  const save = useApiMutation(
    async (list) => {
      // Diff against fresh server data so a retry after a partial failure never duplicates rows.
      const fresh = (await apiGet(`${STUDIO}/mappings`, { intentionId: intention._id })).mappings || [];
      const byId = new Map(fresh.map((m) => [m._id, m]));
      const byBead = new Map(fresh.filter((m) => idOf(m.beadId)).map((m) => [idOf(m.beadId), m]));
      const matched = new Set();
      const plan = list.map((row, i) => {
        const existing = (row.mappingId && byId.get(row.mappingId)) || (row.beadId && byBead.get(row.beadId)) || null;
        if (existing) matched.add(existing._id);
        return { row, existing, sortOrder: i + 1 };
      });
      for (const m of fresh) if (!matched.has(m._id)) await apiSend('delete', `${STUDIO}/mappings/${m._id}`);
      for (const { row, existing, sortOrder } of plan) {
        const reason = row.reason.trim();
        if (existing) {
          if (existing.reason !== reason || existing.sortOrder !== sortOrder) await apiSend('put', `${STUDIO}/mappings/${existing._id}`, { reason, sortOrder });
        } else {
          await apiSend('post', `${STUDIO}/mappings`, { intentionId: intention._id, beadId: row.beadId, reason, sortOrder });
        }
      }
    },
    {
      invalidate: STUDIO_INVALIDATE,
      success: 'Bead list saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      // Part of the list may have been saved; refresh so counts elsewhere are right.
      onError: () => STUDIO_INVALIDATE.forEach((prefix) => qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith(prefix) })),
    }
  );

  const setRows = (next) => form.set('rows', next);
  const submit = (e) => {
    e.preventDefault();
    const errors = {};
    rows.forEach((r, i) => {
      if (!r.reason.trim()) errors[`rows.${i}.reason`] = 'Say why this bead fits the intention.';
    });
    form.setErrors(errors);
    if (Object.keys(errors).length) return;
    save.mutate(rows);
  };

  return (
    <Drawer
      open={Boolean(intention)}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={intention ? `Beads for ${intention.name}` : 'Beads'}
      description="Recommended crystals, in order."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="mappings-form" loading={save.isPending} disabled={!form.dirty || query.isLoading}>
            Save bead list
          </Button>
        </>
      }
    >
      <form id="mappings-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-gold/20 bg-gold/[0.05] px-4 py-3 text-xs text-lilac">
          <p>
            <span className="font-medium text-gold">The first bead is the primary crystal.</span> When the studio builds a strand, the customer’s Mulank number decides how many of the
            primary bead go on it, and the other beads fill the remaining positions in this order. Customers can still adjust quantities afterwards.
          </p>
          <p className="mt-1.5">Hidden beads are skipped on the storefront.</p>
        </div>
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : query.error ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          <>
            {rows.length === 0 && <EmptyState icon={Gem} title="No beads yet" description="Add the crystals this intention recommends. Customers choose from this list." />}
            <ol className="space-y-2">
              {rows.map((row, i) => {
                const bead = beadById.get(row.beadId) || row.bead;
                const missing = !row.beadId || !bead;
                return (
                  <li key={row._k} className={cx('rounded-xl border p-3', i === 0 ? 'border-gold/40 bg-gold/[0.04]' : 'border-white/10 bg-white/[0.02]')}>
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-xs tabular-nums text-lilac">{i + 1}</span>
                      <BeadThumb bead={bead} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm text-ivory">{missing ? 'Missing bead' : bead.name}</span>
                          {i === 0 && <Badge tone="gold">Primary</Badge>}
                          {missing && <Badge tone="danger">Deleted</Badge>}
                          {bead?.isActive === false && <Badge>Hidden</Badge>}
                        </div>
                        {!missing && bead.pricePerBead != null && <div className="text-xs text-lilac">{money(bead.pricePerBead)} / bead</div>}
                      </div>
                      <IconButton icon={ArrowUp} size="sm" label="Move up" disabled={i === 0} onClick={() => setRows(moveItem(rows, i, i - 1))} />
                      <IconButton icon={ArrowDown} size="sm" label="Move down" disabled={i === rows.length - 1} onClick={() => setRows(moveItem(rows, i, i + 1))} />
                      <IconButton icon={X} size="sm" label="Remove bead" onClick={() => setRows(rows.filter((_, j) => j !== i))} />
                    </div>
                    <Field className="mt-2" error={form.errors[`rows.${i}.reason`]}>
                      {({ id }) => (
                        <Textarea
                          id={id}
                          rows={2}
                          aria-label="Why this bead"
                          placeholder="Why this bead? Shown to customers."
                          value={row.reason}
                          onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, reason: e.target.value } : r)))}
                        />
                      )}
                    </Field>
                  </li>
                );
              })}
            </ol>
            <Button icon={Plus} onClick={() => setPicking(true)}>
              Add beads
            </Button>
          </>
        )}
      </form>
      <BeadPickerModal
        open={picking}
        onClose={() => setPicking(false)}
        beads={beads}
        multiple
        exclude={rows.map((r) => r.beadId).filter(Boolean)}
        onPick={(picked) => setRows([...rows, ...picked.map((b) => ({ _k: newKey(), mappingId: null, beadId: b._id, bead: b, reason: '' }))])}
      />
    </Drawer>
  );
}

/* ───────────────────────── Mulank ───────────────────────── */

function MulankTab() {
  const confirm = useConfirm();
  const query = useApiQuery(`${STUDIO}/mulank`);
  const { beads } = useStudioBeads();
  const [editing, setEditing] = useState(null); // { number, mapping }
  const mappings = useMemo(() => query.data?.mappings || [], [query.data]);
  const rows = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ _id: `n${i + 1}`, number: i + 1, mapping: mappings.find((m) => Number(m.number) === i + 1) || null })), [mappings]);
  const remove = useApiMutation((id) => apiSend('delete', `${STUDIO}/mulank/${id}`), { invalidate: STUDIO_INVALIDATE, success: 'Mulank crystal removed.' });

  const columns = [
    { key: 'number', header: 'Mulank', width: '6rem', render: (r) => <span className="font-serif text-xl text-gold">{r.number}</span> },
    {
      key: 'bead',
      header: 'Crystal',
      render: (r) => {
        if (!r.mapping) return <span className="text-sm text-lilac">Built-in default</span>;
        const bead = r.mapping.beadId;
        if (!bead) return <Badge tone="danger">Missing bead</Badge>;
        return (
          <span className="flex items-center gap-2">
            <BeadThumb bead={beads.find((b) => b._id === bead._id) || bead} size={28} />
            {bead.name}
          </span>
        );
      },
    },
    { key: 'reason', header: 'Reason', hideBelow: 'md', render: (r) => <span className="line-clamp-2 text-sm text-lilac">{r.mapping?.reason || '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => (!r.mapping ? <Badge>Not set</Badge> : r.mapping.isActive === false ? <Badge>Off</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Menu
          items={[
            { label: r.mapping ? 'Edit' : 'Set crystal', icon: Pencil, onClick: () => setEditing(r) },
            {
              label: 'Remove',
              icon: Trash2,
              tone: 'danger',
              hidden: !r.mapping,
              onClick: async () => {
                if (await confirm({ title: `Remove the Mulank ${r.number} crystal?`, message: 'The studio goes back to its built-in crystal for this number.', confirmLabel: 'Remove', tone: 'danger' })) remove.mutate(r.mapping._id);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <p className="mb-3 max-w-2xl text-sm text-lilac">
        The Mulank (birth number 1–9) crystal is added to numerology bracelets. Numbers that are not set, are switched off, or point at a hidden bead use the studio’s built-in crystal.
      </p>
      <DataTable columns={columns} rows={rows} loading={query.isLoading} fetching={query.isFetching} error={query.error} onRetry={query.refetch} onRowClick={setEditing} />
      <MulankDrawer key={editing ? `mk-${editing.number}-${editing.mapping?._id || 'new'}` : 'mk-none'} entry={editing} beads={beads} onClose={() => setEditing(null)} />
    </>
  );
}

function MulankDrawer({ entry, beads, onClose }) {
  const confirm = useConfirm();
  const mapping = entry?.mapping;
  const form = useForm({ beadId: idOf(mapping?.beadId), reason: mapping?.reason || '', isActive: mapping ? mapping.isActive !== false : true });
  const save = useApiMutation(({ id, body }) => (id ? apiSend('put', `${STUDIO}/mulank/${id}`, body) : apiSend('post', `${STUDIO}/mulank`, body)), {
    invalidate: STUDIO_INVALIDATE,
    success: 'Mulank crystal saved.',
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => form.setServerErrors(info.fields),
  });

  async function submit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.values.beadId) errors.beadId = 'Choose a crystal.';
    if (!form.values.reason.trim()) errors.reason = 'Reason is required.';
    form.setErrors(errors);
    if (Object.keys(errors).length) return;
    const body = { number: entry.number, beadId: form.values.beadId, reason: form.values.reason.trim(), isActive: form.values.isActive };
    let id = mapping?._id;
    if (!id) {
      // Creating is an upsert on the server: check nobody set this number meanwhile, and edit that row explicitly.
      try {
        const fresh = await apiGet(`${STUDIO}/mulank`);
        const existing = (fresh.mappings || []).find((m) => Number(m.number) === entry.number);
        if (existing) {
          const ok = await confirm({
            title: `Mulank ${entry.number} is already set`,
            message: `It currently uses ${existing.beadId?.name || 'a missing bead'}. Replace it with your choice?`,
            confirmLabel: 'Replace',
          });
          if (!ok) return;
          id = existing._id;
        }
      } catch {
        // fall through; the save itself will report connection problems
      }
    }
    save.mutate({ id, body });
  }

  return (
    <Drawer
      open={Boolean(entry)}
      onClose={onClose}
      dirty={form.dirty}
      title={entry ? `Mulank ${entry.number} crystal` : 'Mulank crystal'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="mulank-form" loading={save.isPending} disabled={!form.dirty}>
            Save
          </Button>
        </>
      }
    >
      <form id="mulank-form" onSubmit={submit} className="space-y-5">
        <Field label="Crystal" required error={form.errors.beadId}>
          <BeadField beads={beads} value={form.values.beadId} fallback={mapping?.beadId} onChange={(x) => form.set('beadId', x)} invalid={Boolean(form.errors.beadId)} />
        </Field>
        <Field label="Reason" required error={form.errors.reason} hint="Shown to the customer as the calibration note.">
          {({ id }) => <Textarea id={id} rows={3} {...form.bind('reason')} />}
        </Field>
        <Switch label="Active" description="When off, the studio uses its built-in crystal for this number." checked={form.values.isActive} onChange={(x) => form.set('isActive', x)} />
      </form>
    </Drawer>
  );
}

/* ───────────────────────── Zodiac ───────────────────────── */

/** Days of a non-leap year not covered by any active mapping (ranges may wrap Dec → Jan). */
function uncoveredDays(mappings) {
  const active = mappings.filter((m) => m.isActive !== false && m.fromMonth && m.toMonth);
  if (!active.length) return [];
  const dayIndex = (month, day) => {
    const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return lengths.slice(0, month - 1).reduce((a, b) => a + b, 0) + day;
  };
  const gaps = [];
  const date = new Date(2001, 0, 1);
  for (let d = 1; d <= 365; d += 1) {
    const covered = active.some((m) => {
      const from = dayIndex(m.fromMonth, m.fromDay);
      const to = dayIndex(m.toMonth, m.toDay);
      return from <= to ? d >= from && d <= to : d >= from || d <= to;
    });
    if (!covered) gaps.push(new Date(date.getTime() + (d - 1) * 86400000));
  }
  return gaps;
}

function ZodiacTab() {
  const confirm = useConfirm();
  const query = useApiQuery(`${STUDIO}/zodiac`);
  const { beads } = useStudioBeads();
  const [editing, setEditing] = useState(null); // mapping | { isNew, preset }
  const mappings = useMemo(() => query.data?.mappings || [], [query.data]);
  const remove = useApiMutation((id) => apiSend('delete', `${STUDIO}/zodiac/${id}`), { invalidate: STUDIO_INVALIDATE, success: 'Zodiac mapping deleted.' });
  const missingSigns = ZODIAC_SIGNS.filter((z) => !mappings.some((m) => slugify(m.sign) === slugify(z.sign)));
  const gaps = useMemo(() => uncoveredDays(mappings), [mappings]);

  const columns = [
    { key: 'sign', header: 'Sign', render: (m) => <span className="font-medium">{m.sign}</span> },
    { key: 'dates', header: 'Dates', render: (m) => <span className="whitespace-nowrap text-sm">{dateRange(m) || '—'}</span> },
    {
      key: 'bead',
      header: 'Bead',
      render: (m) =>
        m.beadId ? (
          <span className="flex items-center gap-2">
            <BeadThumb bead={beads.find((b) => b._id === m.beadId._id) || m.beadId} size={28} />
            {m.beadId.name}
          </span>
        ) : (
          <Badge tone="danger">Missing bead</Badge>
        ),
    },
    { key: 'reason', header: 'Reason', hideBelow: 'lg', render: (m) => <span className="line-clamp-2 text-sm text-lilac">{m.reason}</span> },
    { key: 'isActive', header: 'Status', render: (m) => (m.isActive === false ? <Badge>Off</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(m) },
            {
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              onClick: async () => {
                const ok = await confirm({
                  title: `Delete the ${m.sign} mapping?`,
                  message: 'Customers born under this sign get no zodiac bead until you add it again, because the studio only uses the signs listed here.',
                  confirmLabel: 'Delete',
                  tone: 'danger',
                });
                if (ok) remove.mutate(m._id);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <Toolbar
        right={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ isNew: true, preset: missingSigns[0] || null })}>
            New zodiac mapping
          </Button>
        }
      >
        <p className="max-w-xl text-sm text-lilac">The zodiac bead sits either side of the charm when a customer adds their sign. The studio matches the birthday against these date ranges.</p>
      </Toolbar>
      {!query.isLoading && mappings.length > 0 && (missingSigns.length > 0 || gaps.length > 0) && (
        <div className="mb-3 flex gap-3 rounded-xl border border-amber-300/25 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-200" />
          <div className="space-y-1">
            {gaps.length > 0 && (
              <p>
                {plural(gaps.length, 'day')} of the year {gaps.length === 1 ? 'is' : 'are'} not covered by any active range (for example{' '}
                {gaps[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}). Customers born then get no zodiac bead.
              </p>
            )}
            {missingSigns.length > 0 && (
              <p className="flex flex-wrap items-center gap-1.5">
                Not mapped yet:
                {missingSigns.map((z) => (
                  <Button key={z.sign} size="sm" variant="ghost" onClick={() => setEditing({ isNew: true, preset: z })}>
                    {z.sign}
                  </Button>
                ))}
              </p>
            )}
          </div>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={mappings}
        loading={query.isLoading}
        fetching={query.isFetching}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={Star}
            title="No zodiac mappings yet"
            description="Until you add one, the studio uses its built-in sign table."
            action={<Button icon={Plus} onClick={() => setEditing({ isNew: true, preset: ZODIAC_SIGNS[0] })}>New zodiac mapping</Button>}
          />
        }
      />
      <ZodiacDrawer
        key={editing ? `z-${editing._id || `new-${editing.preset?.sign || ''}`}` : 'z-none'}
        entry={editing}
        mappings={mappings}
        beads={beads}
        onClose={() => setEditing(null)}
        onSwitch={(m) => setEditing(m)}
      />
    </>
  );
}

function ZodiacDrawer({ entry, mappings, beads, onClose, onSwitch }) {
  const confirm = useConfirm();
  const isNew = Boolean(entry?.isNew);
  const preset = entry?.preset;
  const form = useForm(
    !entry
      ? { sign: '', fromMonth: '', fromDay: '', toMonth: '', toDay: '', beadId: '', reason: '', isActive: true }
      : isNew
        ? { sign: preset?.sign || '', fromMonth: preset?.fromMonth ?? '', fromDay: preset?.fromDay ?? '', toMonth: preset?.toMonth ?? '', toDay: preset?.toDay ?? '', beadId: '', reason: '', isActive: true }
        : {
            sign: entry.sign || '',
            fromMonth: entry.fromMonth ?? '',
            fromDay: entry.fromDay ?? '',
            toMonth: entry.toMonth ?? '',
            toDay: entry.toDay ?? '',
            beadId: idOf(entry.beadId),
            reason: entry.reason || '',
            isActive: entry.isActive !== false,
          }
  );
  const v = form.values;
  const slug = slugify(v.sign);
  const duplicate = slug ? mappings.find((m) => m._id !== entry?._id && (m.slug === slug || slugify(m.sign) === slug)) : null;

  const save = useApiMutation(({ id, body }) => (id ? apiSend('put', `${STUDIO}/zodiac/${id}`, body) : apiSend('post', `${STUDIO}/zodiac`, body)), {
    invalidate: STUDIO_INVALIDATE,
    success: 'Zodiac mapping saved.',
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => form.setServerErrors(info.fields),
  });

  const fillStandardDates = () => {
    const std = ZODIAC_SIGNS.find((z) => slugify(z.sign) === slug);
    if (std && !v.fromMonth && !v.toMonth) form.set({ fromMonth: std.fromMonth, fromDay: std.fromDay, toMonth: std.toMonth, toDay: std.toDay });
  };

  async function submit(e) {
    e.preventDefault();
    const errors = {};
    if (!v.sign.trim()) errors.sign = 'Sign is required.';
    const fromErr = checkDayMonth(v.fromMonth, v.fromDay);
    const toErr = checkDayMonth(v.toMonth, v.toDay);
    if (fromErr) errors.fromMonth = fromErr;
    if (toErr) errors.toMonth = toErr;
    if (!v.beadId) errors.beadId = 'Choose a bead.';
    if (!v.reason.trim()) errors.reason = 'Reason is required.';
    if (!isNew && duplicate) errors.sign = `${duplicate.sign} already has its own mapping. Use a different sign.`;
    form.setErrors(errors);
    if (Object.keys(errors).length) return;

    const body = {
      sign: v.sign.trim(),
      fromMonth: Number(v.fromMonth),
      fromDay: Number(v.fromDay),
      toMonth: Number(v.toMonth),
      toDay: Number(v.toDay),
      beadId: v.beadId,
      reason: v.reason.trim(),
      isActive: v.isActive,
    };
    let id = isNew ? null : entry._id;
    if (isNew) {
      // The server upserts by sign: never overwrite an existing sign without asking, and then edit it explicitly.
      let existing = duplicate;
      try {
        const fresh = (await apiGet(`${STUDIO}/zodiac`)).mappings || [];
        existing = fresh.find((m) => m.slug === slug || slugify(m.sign) === slug) || null;
      } catch {
        // use the list we already have
      }
      if (existing) {
        const ok = await confirm({
          title: `${existing.sign} already has a mapping`,
          message: `It currently uses ${existing.beadId?.name || 'a missing bead'} (${dateRange(existing) || 'no dates'}). Replace its bead, dates and reason with yours?`,
          confirmLabel: `Update ${existing.sign}`,
        });
        if (!ok) return;
        id = existing._id;
      }
    }
    save.mutate({ id, body });
  }

  return (
    <Drawer
      open={Boolean(entry)}
      onClose={onClose}
      dirty={form.dirty}
      title={isNew ? 'New zodiac mapping' : `Edit ${entry?.sign || 'zodiac mapping'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="zodiac-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew && duplicate ? `Update ${duplicate.sign}` : isNew ? 'Create mapping' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="zodiac-form" onSubmit={submit} className="space-y-5">
        <Field
          label="Sign"
          required
          error={form.errors.sign}
          hint={
            isNew && duplicate ? (
              <span className="text-amber-200">
                {duplicate.sign} is already mapped.{' '}
                <button type="button" className="text-gold underline-offset-2 hover:underline" onClick={() => onSwitch(duplicate)}>
                  Open it instead
                </button>
              </span>
            ) : undefined
          }
        >
          {({ id }) => <Input id={id} list="zodiac-sign-list" {...form.bind('sign')} onBlur={fillStandardDates} placeholder="e.g. Aries" autoFocus={isNew} />}
        </Field>
        <datalist id="zodiac-sign-list">
          {ZODIAC_SIGNS.map((z) => (
            <option key={z.sign} value={z.sign} />
          ))}
        </datalist>
        <DateRangeFields values={v} set={form.set} errors={form.errors} />
        <Field label="Bead" required error={form.errors.beadId}>
          <BeadField beads={beads} value={v.beadId} fallback={entry?.beadId && typeof entry.beadId === 'object' ? entry.beadId : null} onChange={(x) => form.set('beadId', x)} invalid={Boolean(form.errors.beadId)} />
        </Field>
        <Field label="Reason" required error={form.errors.reason} hint="Shown to the customer.">
          {({ id }) => <Textarea id={id} rows={3} {...form.bind('reason')} />}
        </Field>
        <Switch label="Active" description="Inactive signs are ignored when matching birthdays." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
      </form>
    </Drawer>
  );
}
