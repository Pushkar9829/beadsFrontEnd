import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Moon, RefreshCw, Save, Trash2 } from 'lucide-react';
import { apiSend, useApiList, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { usePermissions } from '../lib/permissions';
import { KUNDLI_STATUS_META } from '../lib/status';
import { date, dateTime, number, relative } from '../lib/format';
import { KUNDLI_SECTION_LABELS, birthFormError, birthPayload, birthToForm, svgDataUrl } from '../../lib/kundli';
import PlaceAutocomplete from '../../components/kundli/PlaceAutocomplete';
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  Field,
  FormGrid,
  FormSection,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  Spinner,
  StatusBadge,
  Toolbar,
  inputBase,
  useConfirm,
} from '../ui';

const BASE = '/admin/kundli';
const INVALIDATE = [BASE, '/admin/notifications'];
const WORKING = ['queued', 'generating'];

// Tailwind look for the shared place autocomplete (the storefront .kd-* CSS is not loaded in the admin).
const PLACE_CLASSES = {
  root: 'relative',
  list: 'absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-raised p-1 shadow-xl',
  option: 'flex cursor-pointer items-baseline justify-between gap-3 rounded-md px-2.5 py-2 text-sm text-ivory hover:bg-white/[0.06]',
  active: 'bg-white/[0.08]',
  note: 'mt-1 block text-xs text-lilac',
  bad: 'text-rose-300',
};

function customerOf(k) {
  return {
    name: k.birth?.name || k.userId?.name || '—',
    email: k.userId?.email || k.email || '',
  };
}

export default function Kundli() {
  const [state, set] = useUrlState({ q: '', status: 'all', page: 1 });
  const [openId, setOpenId] = useState(null);
  const list = useApiList(BASE, { q: state.q.trim(), status: state.status, page: state.page, limit: 25 }, { key: 'kundlis' });
  const counts = list.raw?.counts || {};
  const api = list.raw?.api;
  const total = Object.values(counts).reduce((n, c) => n + c, 0);

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (k) => {
        const c = customerOf(k);
        return (
          <div className="min-w-0 max-w-[15rem]">
            <p className="truncate font-medium">{c.name}</p>
            <p className="truncate text-xs text-lilac">{c.email}</p>
          </div>
        );
      },
    },
    { key: 'order', header: 'Order #', render: (k) => k.eligibleOrderNumber || <span className="text-lilac/60">—</span> },
    { key: 'status', header: 'Status', render: (k) => <StatusBadge meta={KUNDLI_STATUS_META} value={k.status} /> },
    { key: 'eligibleAt', header: 'Eligible', hideBelow: 'md', render: (k) => <span className="whitespace-nowrap">{k.eligibleAt ? date(k.eligibleAt) : '—'}</span> },
    {
      key: 'generatedAt',
      header: 'Generated',
      hideBelow: 'sm',
      render: (k) => (k.generatedAt ? <span title={dateTime(k.generatedAt)} className="whitespace-nowrap">{relative(k.generatedAt)}</span> : '—'),
    },
    { key: 'apiCalls', header: 'API calls', align: 'right', hideBelow: 'lg', render: (k) => <span className="tabular-nums">{number(k.apiCalls)}</span> },
  ];

  const filters = [
    { value: 'all', label: 'All', count: total || null },
    ...Object.entries(KUNDLI_STATUS_META).map(([value, m]) => ({ value, label: m.label, count: counts[value] || null })),
  ];
  const filtered = state.status !== 'all' || Boolean(state.q);

  return (
    <>
      <PageHeader
        title="Kundli"
        description="Free Vedic Kundlis (AstrologyAPI) for customers whose order reaches the Kundali offer amount. Generated automatically when the order is confirmed."
        meta={api ? api.mock ? <Badge tone="warning">Mock mode</Badge> : api.configured ? <Badge tone="success">AstrologyAPI connected</Badge> : <Badge tone="danger">Not configured</Badge> : null}
      />
      <Segmented className="mb-3" items={filters} value={state.status} onChange={(status) => set({ status })} />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Name, email or order no.…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(k) => setOpenId(k._id)}
        empty={
          <EmptyState
            icon={Moon}
            title={filtered ? 'No Kundlis match these filters' : 'No Kundlis yet'}
            description={
              filtered
                ? undefined
                : 'Kundlis appear when customers enter birth details in the home Kundali popup or Account → My Kundli, or place a qualifying order. The server needs ASTROLOGY_API_USER_ID and ASTROLOGY_API_KEY in its environment (Render → Environment); without them, non-production servers use mock data and production cannot generate.'
            }
            action={filtered && <Button size="sm" onClick={() => set({ status: 'all', q: '' })}>Clear filters</Button>}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      {openId && <KundliDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function KundliDrawer({ id, onClose }) {
  const { canManageKundli } = usePermissions();
  const confirm = useConfirm();
  const query = useApiQuery(`${BASE}/${id}`, undefined, {
    keepPrevious: false,
    refetchInterval: (q) => (WORKING.includes(q.state.data?.kundli?.status) ? 3000 : false),
  });
  const k = query.data?.kundli;

  const regenerate = useApiMutation(() => apiSend('post', `${BASE}/${id}/generate`), {
    invalidate: INVALIDATE,
    success: 'Generation started.',
  });
  const remove = useApiMutation(() => apiSend('delete', `${BASE}/${id}`), {
    invalidate: INVALIDATE,
    success: 'Kundli deleted.',
    onSuccess: onClose,
  });

  const askRegenerate = async () => {
    const ok = await confirm({
      title: k.generatedAt ? 'Regenerate this Kundli?' : 'Generate this Kundli?',
      message: 'This makes 8 AstrologyAPI calls and spends credits. The current result is replaced.',
      confirmLabel: k.generatedAt ? 'Regenerate' : 'Generate',
    });
    if (ok) regenerate.mutate();
  };
  const askDelete = async () => {
    const ok = await confirm({
      title: 'Delete this Kundli?',
      message: 'The birth details and the generated Kundli are removed. The customer can submit details again.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) remove.mutate();
  };

  const c = k ? customerOf(k) : null;
  const working = WORKING.includes(k?.status);

  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      title={c?.name || 'Kundli'}
      description={k ? `Updated ${dateTime(k.updatedAt)}` : undefined}
      footer={
        k &&
        canManageKundli && (
          <>
            <Button variant="danger" icon={Trash2} loading={remove.isPending} onClick={askDelete} className="mr-auto">
              Delete
            </Button>
            <Button variant="primary" icon={RefreshCw} loading={regenerate.isPending || working} disabled={!k.birth?.dob || working} onClick={askRegenerate}>
              {k.generatedAt ? 'Regenerate' : 'Generate'}
            </Button>
          </>
        )
      }
    >
      {!k ? (
        query.isLoading ? (
          <Spinner />
        ) : (
          <p className="text-sm text-lilac">{query.error?.message || 'Kundli not found.'}</p>
        )
      ) : (
        <div className="space-y-6">
          <DescriptionList
            items={[
              { label: 'Status', value: <StatusBadge meta={KUNDLI_STATUS_META} value={k.status} /> },
              {
                label: 'Customer',
                value: k.userId?._id ? (
                  <Link className="text-gold hover:text-gold-light" to={`/admin/customers/${k.userId._id}`}>
                    {k.userId.name || k.userId.email}
                  </Link>
                ) : (
                  `${k.email || '—'} (not signed up yet)`
                ),
              },
              {
                label: 'Qualifying order',
                value: k.eligibleOrderId?._id ? (
                  <Link className="text-gold hover:text-gold-light" to={`/admin/orders/${k.eligibleOrderId._id}`}>
                    {k.eligibleOrderNumber}
                  </Link>
                ) : (
                  k.eligibleOrderNumber || '—'
                ),
              },
              { label: 'Eligible', value: k.eligibleAt ? dateTime(k.eligibleAt) : '—' },
              { label: 'Generated', value: k.generatedAt ? dateTime(k.generatedAt) : '—' },
              { label: 'Runs / API calls', value: `${number(k.attempts)} / ${number(k.apiCalls)}` },
              k.pdfUrl && {
                label: 'PDF',
                full: true,
                value: (
                  <a className="inline-flex items-center gap-1 text-gold hover:text-gold-light" href={k.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Open Kundli PDF <ExternalLink size={12} />
                  </a>
                ),
              },
              k.lastError && { label: 'Last error', full: true, value: <span className="text-rose-200">{k.lastError}</span> },
            ]}
          />

          <BirthForm key={`${k._id}-${k.updatedAt}`} kundli={k} />

          <Sections kundli={k} />
        </div>
      )}
    </Drawer>
  );
}

function BirthForm({ kundli }) {
  const [form, setForm] = useState(() => birthToForm(kundli.birth));
  const [error, setError] = useState('');
  const save = useApiMutation((body) => apiSend('patch', `${BASE}/${kundli._id}/details`, body), {
    invalidate: INVALIDATE,
    success: 'Birth details saved.',
    onError: (info) => setError(info.message),
  });
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const submit = (e) => {
    e.preventDefault();
    const invalid = birthFormError(form);
    setError(invalid);
    if (!invalid) save.mutate(birthPayload(form));
  };

  return (
    <form onSubmit={submit}>
      <FormSection
        title="Birth details"
        description={
          kundli.status === 'ready'
            ? 'Saving keeps the current Kundli. Press Regenerate to rebuild it from the new details.'
            : 'Fix typos or the place here. A Kundli waiting for details starts generating once saved.'
        }
      >
        <FormGrid>
          <Field label="Name" required>
            <Input value={form.name} onChange={setField('name')} />
          </Field>
          <Field label="Gender" required>
            <Select value={form.gender} onChange={setField('gender')} placeholder="Select" options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]} />
          </Field>
          <Field label="Date of birth" required>
            <Input type="date" value={form.dob} onChange={setField('dob')} />
          </Field>
          <Field label="Time of birth" hint={form.tobUnknown ? '12:00 noon is used.' : undefined}>
            <div className="space-y-2">
              <Input type="time" value={form.tob} onChange={setField('tob')} disabled={form.tobUnknown} />
              <Checkbox checked={form.tobUnknown} onChange={(v) => setForm((f) => ({ ...f, tobUnknown: v }))} label="Birth time unknown" />
            </div>
          </Field>
          <Field
            label="Place of birth"
            required
            className="sm:col-span-2"
            hint={form.place ? `${form.place.lat}, ${form.place.lon} · ${form.place.timezoneId}${kundli.birth?.tzone !== undefined && form.place.label === kundli.birth?.place ? ` (UTC${kundli.birth.tzone >= 0 ? '+' : ''}${kundli.birth.tzone})` : ''}` : 'Search and pick a place.'}
          >
            <PlaceAutocomplete
              value={form.place}
              onChange={(place) => setForm((f) => ({ ...f, place }))}
              inputClassName={`${inputBase} h-9`}
              classes={PLACE_CLASSES}
            />
          </Field>
        </FormGrid>
        {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button type="submit" icon={Save} loading={save.isPending} disabled={kundli.status === 'generating'}>
            Save details
          </Button>
        </div>
      </FormSection>
    </form>
  );
}

function summarize(key, value) {
  if (value === undefined || value === null) return null;
  if (key === 'astro') return ['ascendant', 'sign', 'Naksahtra', 'NaksahtraLord', 'Gan', 'Nadi', 'Varna'].map((f) => value[f] && `${f}: ${value[f]}`).filter(Boolean).join(' · ');
  if (key === 'planets' && Array.isArray(value)) return value.map((p) => `${p.name} ${p.sign} H${p.house}${String(p.isRetro) === 'true' ? ' R' : ''}`).join(' · ');
  if (key === 'dasha') return ['major', 'minor', 'sub_minor'].map((f) => value[f]?.planet).filter(Boolean).join(' › ');
  if (key === 'manglik') return `${value.manglik_status || (value.is_present ? 'Manglik' : 'Not manglik')} · ${value.percentage_manglik_present ?? '?'}%`;
  if (key === 'gems') return ['LIFE', 'BENEFIC', 'LUCKY'].map((f) => value[f] && `${f}: ${value[f].name}`).filter(Boolean).join(' · ');
  if (key === 'rudraksha') return value.name || value.rudraksha_key || '';
  return '';
}

function Sections({ kundli }) {
  const s = kundli.sections || {};
  const errors = s.errors || {};
  const chart = svgDataUrl(s.chartSvg);
  const keys = ['astro', 'planets', 'dasha', 'manglik', 'gems', 'rudraksha'];
  if (!kundli.generatedAt && !Object.keys(errors).length) {
    return <p className="text-sm text-lilac">Not generated yet.</p>;
  }
  return (
    <FormSection title="Generated sections" description="Raw AstrologyAPI results as stored. The customer sees them in Account → My Kundli.">
      {Object.keys(errors).length > 0 && (
        <div className="mb-4 space-y-1 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
          {Object.entries(errors).map(([key, msg]) => (
            <p key={key}>
              <strong>{KUNDLI_SECTION_LABELS[key] || key}:</strong> {String(msg)}
            </p>
          ))}
        </div>
      )}
      {chart && <img src={chart} alt="D1 chart" className="mb-4 w-full max-w-[280px] rounded-lg border border-white/10 bg-[#fff8e7]" />}
      <div className="space-y-2">
        {keys.map((key) => {
          const value = s[key];
          return (
            <details key={key} className="rounded-lg border border-white/[0.08] bg-raised/50 px-3 py-2">
              <summary className="cursor-pointer text-sm text-ivory">
                <span className="font-medium">{KUNDLI_SECTION_LABELS[key]}</span>{' '}
                {value === undefined ? <Badge tone="danger">missing</Badge> : <span className="text-xs text-lilac">{summarize(key, value)}</span>}
              </summary>
              {value !== undefined && <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-lilac">{JSON.stringify(value, null, 2)}</pre>}
            </details>
          );
        })}
      </div>
    </FormSection>
  );
}
