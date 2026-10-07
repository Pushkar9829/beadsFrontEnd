import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { usePermissions } from '../lib/permissions';
import { money } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  Field,
  FormGrid,
  Input,
  Menu,
  MoneyInput,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Skeleton,
  Switch,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';

const BASE = '/admin/pincodes';
const EMPTY = { pincode: '', city: '', state: '', serviceable: true, extraFee: 0, estimatedDays: 5 };
const PIN_RX = /^[1-9]\d{5}$/;

export default function Shipping() {
  const [state, set] = useUrlState({ q: '', page: 1 });
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { canManageSettings } = usePermissions();

  const list = useApiList(BASE, { q: state.q, page: state.page, limit: 25, sort: '-createdAt' }, { key: 'items' });
  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: [BASE, '/pincode'], success: 'Pincode override removed.' });

  const columns = [
    { key: 'pincode', header: 'Pincode', render: (p) => <span className="font-mono font-medium">{p.pincode}</span> },
    { key: 'place', header: 'Area', hideBelow: 'sm', render: (p) => [p.city, p.state].filter(Boolean).join(', ') || <span className="text-lilac/60">—</span> },
    { key: 'serviceable', header: 'Delivery', render: (p) => (p.serviceable === false ? <Badge tone="danger" dot>Blocked</Badge> : <Badge tone="success" dot>Delivers</Badge>) },
    { key: 'extraFee', header: 'Extra fee', align: 'right', render: (p) => (Number(p.extraFee) ? money(p.extraFee) : <span className="text-lilac/60">—</span>) },
    { key: 'estimatedDays', header: 'Days', align: 'right', hideBelow: 'md', render: (p) => p.estimatedDays ?? '—' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(p) },
            {
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              onClick: async () => {
                if (await confirm({ title: `Remove override for ${p.pincode}?`, message: 'Checkout falls back to iThink and the default shipping fee for this pincode.', confirmLabel: 'Remove', tone: 'danger' })) remove.mutate(p._id);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Shipping"
        description="Local pincode overrides for extra fees, delivery estimates and blocked areas. Default rates and iThink credentials are in Settings."
        actions={
          <>
            {canManageSettings && (<Button variant="ghost" icon={Settings2} onClick={() => navigate('/admin/settings?tab=shipping')}>
              Shipping settings
            </Button>)}
            <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
              Add pincode
            </Button>
          </>
        }
      />
      <PincodeChecker onEdit={setEditing} />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search pincode or city…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={MapPin}
            title={state.q ? 'No overrides match your search' : 'No pincode overrides'}
            description={state.q ? undefined : 'Every pincode uses iThink serviceability and the default fee. Add an override to charge extra or block an area.'}
            action={
              !state.q && (
                <Button icon={Plus} onClick={() => setEditing('new')}>
                  Add pincode
                </Button>
              )
            }
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <PincodeDrawer key={editing?._id || (editing === 'new' ? 'new' : editing ? `new-${editing.pincode}` : 'none')} pin={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function PincodeChecker({ onEdit }) {
  const [draft, setDraft] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const check = useApiQuery(pin ? `/pincode/${pin}` : null, undefined, { keepPrevious: false, retry: false, staleTime: 0 });
  // Find a local override for the same pincode (exact match on the list endpoint).
  const override = useApiList(pin ? BASE : null, { q: pin, limit: 5 }, { key: 'items' });
  const existing = override.rows.find((r) => r.pincode === pin);
  const r = check.data;

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (!PIN_RX.test(v)) return setError('Enter a 6-digit Indian pincode.');
    setError(null);
    if (v === pin) check.refetch();
    else setPin(v);
  };

  return (
    <Card className="mb-5">
      <CardHeader title="Check a pincode" description="See exactly what checkout will show for an address: serviceability, COD, fee and delivery time." />
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="sm:w-48">
          <Input
            value={draft}
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 560001"
            aria-label="Pincode to check"
            invalid={Boolean(error)}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          />
          {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
        </div>
        <Button type="submit" icon={Search} loading={check.isFetching}>
          Check
        </Button>
      </form>
      {pin && (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-raised/40 p-4">
          {check.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : check.error ? (
            <p className="text-sm text-rose-300">{check.error.message || 'Could not check this pincode.'}</p>
          ) : r ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base text-ivory">{pin}</span>
                {r.serviceable === false ? <Badge tone="danger">Not serviceable</Badge> : <Badge tone="success">Serviceable</Badge>}
                {r.cod != null && (r.cod ? <Badge tone="info">COD available</Badge> : <Badge tone="warning">No COD</Badge>)}
                {r.prepaid === false && <Badge tone="warning">No prepaid</Badge>}
                {r.source && <Badge>Source: {r.source}</Badge>}
              </div>
              <DescriptionList
                items={[
                  { label: 'Area', value: [r.city, r.state].filter(Boolean).join(', ') || '—' },
                  { label: 'Delivery estimate', value: r.estimatedDays ? `${r.estimatedDays} days` : '—' },
                  { label: 'Extra fee', value: Number(r.extraFee) ? money(r.extraFee) : 'None' },
                  { label: 'Carriers', value: Array.isArray(r.carriers) && r.carriers.length ? r.carriers.map((c) => (typeof c === 'string' ? c : c?.name || c?.logistics)).filter(Boolean).join(', ') : '—' },
                ]}
              />
              <div>
                {existing ? (
                  <Button size="sm" icon={Pencil} onClick={() => onEdit(existing)}>
                    Edit local override
                  </Button>
                ) : (
                  <Button size="sm" icon={Plus} onClick={() => onEdit({ ...EMPTY, pincode: pin, city: r.city || '', state: r.state || '', _new: true })}>
                    Add override for {pin}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function PincodeDrawer({ pin, onClose }) {
  const isNew = pin === 'new' || Boolean(pin?._new);
  const seed = pin === 'new' || !pin ? EMPTY : { ...EMPTY, ...pin };
  const form = useForm(seed);
  const save = useApiMutation(
    (values) => {
      const body = toPayload(values, { numbers: ['extraFee', 'estimatedDays'], nullable: ['city', 'state'], omit: ['_new'] });
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${pin._id}`, body);
    },
    {
      invalidate: [BASE, '/pincode'],
      success: isNew ? 'Pincode override added.' : 'Pincode override saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => {
        if (info.status === 409) form.setErrors({ pincode: 'This pincode already has an override. Search for it and edit it instead.' });
        else form.setServerErrors(info.fields);
      },
    }
  );
  const submit = (e) => {
    e.preventDefault();
    const v = form.values;
    const errors = {};
    if (!PIN_RX.test(String(v.pincode).trim())) errors.pincode = 'Enter a 6-digit pincode.';
    if (v.extraFee !== '' && Number(v.extraFee) < 0) errors.extraFee = 'Must be 0 or more.';
    if (v.estimatedDays !== '' && (Number(v.estimatedDays) < 0 || Number(v.estimatedDays) > 60)) errors.estimatedDays = 'Between 0 and 60 days.';
    if (Object.keys(errors).length) return form.setErrors(errors);
    save.mutate({ ...v, pincode: String(v.pincode).trim(), extraFee: v.extraFee === '' ? 0 : v.extraFee, estimatedDays: v.estimatedDays === '' ? 5 : v.estimatedDays });
  };

  return (
    <Drawer
      open={Boolean(pin)}
      onClose={onClose}
      dirty={form.dirty}
      width="sm"
      title={isNew ? 'Add pincode override' : `Edit ${pin?.pincode}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="pincode-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Add override' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="pincode-form" onSubmit={submit} className="space-y-5">
        <Field label="Pincode" required error={form.errors.pincode}>
          {({ id }) => (
            <Input
              id={id}
              inputMode="numeric"
              maxLength={6}
              className="font-mono"
              value={form.values.pincode}
              onChange={(e) => form.set('pincode', e.target.value.replace(/\D/g, ''))}
              invalid={Boolean(form.errors.pincode)}
              autoFocus={isNew}
            />
          )}
        </Field>
        <FormGrid>
          <Field label="City">{({ id }) => <Input id={id} {...form.bind('city')} />}</Field>
          <Field label="State">{({ id }) => <Input id={id} {...form.bind('state')} />}</Field>
        </FormGrid>
        <Switch
          label="Deliver to this pincode"
          description="Turn off to block checkout for this pincode, even if iThink can deliver."
          checked={form.values.serviceable !== false}
          onChange={(v) => form.set('serviceable', v)}
        />
        <FormGrid>
          <Field label="Extra fee" error={form.errors.extraFee} hint="Added on top of the normal shipping fee.">
            {({ id }) => <MoneyInput id={id} value={form.values.extraFee} onChange={(v) => form.set('extraFee', v)} />}
          </Field>
          <Field label="Delivery estimate" error={form.errors.estimatedDays}>
            {({ id }) => <NumberInput id={id} min={0} max={60} value={form.values.estimatedDays} onChange={(v) => form.set('estimatedDays', v)} suffix="days" />}
          </Field>
        </FormGrid>
      </form>
    </Drawer>
  );
}
