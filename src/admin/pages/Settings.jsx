import { useEffect, useMemo, useState } from 'react';
import { Bell, CreditCard, Globe, Lock, Percent, RefreshCw, Save, Search, Store, Truck, Webhook, Warehouse } from 'lucide-react';
import { apiSend, useApiMutation, useApiQuery } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, relative } from '../lib/format';
import { usePermissions } from '../lib/permissions';
import { useSettingsStore } from '../../store/settingsStore';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  FormSection,
  Input,
  MediaInput,
  MoneyInput,
  NumberInput,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
  useConfirm,
  useForm,
  useUnsavedWarning,
} from '../ui';
import { CopyField } from './people/shared';

const TABS = [
  { value: 'general', label: 'General', icon: Store },
  { value: 'payment', label: 'Payment', icon: CreditCard },
  { value: 'shipping', label: 'Shipping', icon: Truck },
  { value: 'tax', label: 'Tax', icon: Percent },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'seo', label: 'SEO', icon: Search },
  { value: 'webhooks', label: 'Webhooks', icon: Webhook },
];

const SECRET_PLACEHOLDER = 'Saved — leave blank to keep';

// Defaults mirror the StoreSettings schema; used only to fill gaps in the GET response.
const DEFAULTS = {
  general: { storeName: 'Kuberstones', logo: '', email: '', phone: '', currency: 'INR' },
  payment: { cod: true, upi: true, gateway: 'Cashfree', gatewayKeyId: '', upiId: '', cashfreeEnabled: true, cashfreeAppId: '', cashfreeSecret: '', cashfreeEnv: 'sandbox' },
  shipping: {
    fee: 0,
    freeThreshold: 999,
    estimatedDays: 5,
    ithinkEnabled: true,
    ithinkEnv: 'production',
    ithinkAccessToken: '',
    ithinkSecretKey: '',
    ithinkWebhookSecret: '',
    ithinkPickupAddressId: '',
    ithinkReturnAddressId: '',
    ithinkLogistics: 'delhivery',
    ithinkServiceType: '',
    defaultLengthCm: 10,
    defaultWidthCm: 10,
    defaultHeightCm: 5,
    defaultWeightGrams: 400,
  },
  tax: { gstPercent: 0 },
  notifications: { email: true, sms: false, whatsapp: false },
  seo: { title: 'Kuberstones', description: '', keywords: '', ogImage: '', noIndex: false },
};

const SECRETS = { payment: ['cashfreeSecret'], shipping: ['ithinkAccessToken', 'ithinkSecretKey', 'ithinkWebhookSecret'] };
const NUMBERS = {
  shipping: ['fee', 'freeThreshold', 'estimatedDays', 'defaultLengthCm', 'defaultWidthCm', 'defaultHeightCm', 'defaultWeightGrams'],
  tax: ['gstPercent'],
};

/** Form values for one tab, from the (masked) settings. Secrets always start empty. */
function sectionValues(section, settings) {
  const s = settings || {};
  const defaults = DEFAULTS[section];
  const source = section === 'general' ? s : s[section] || {};
  const out = {};
  for (const key of Object.keys(defaults)) {
    const v = source[key];
    out[key] = v === undefined || v === null ? defaults[key] : v;
  }
  for (const key of SECRETS[section] || []) out[key] = '';
  return out;
}

/** Request body for one tab: blank secrets are omitted (server keeps the stored value). */
function sectionBody(section, values) {
  const out = { ...values };
  for (const key of SECRETS[section] || []) {
    const v = String(out[key] || '').trim();
    if (v) out[key] = v;
    else delete out[key];
  }
  for (const key of NUMBERS[section] || []) out[key] = out[key] === '' || out[key] == null ? 0 : Number(out[key]);
  if (section === 'general') return { ...out, currency: String(out.currency || 'INR').trim().toUpperCase() };
  return { [section]: out };
}

export default function Settings() {
  const { canManageSettings } = usePermissions();
  if (!canManageSettings) {
    return (
      <>
        <PageHeader title="Settings" />
        <Card padded={false}>
          <EmptyState icon={Lock} title="Only admins can change store settings" description="Payment keys, shipping credentials and store details are limited to admins. Ask an admin if something needs to change." />
        </Card>
      </>
    );
  }
  return <SettingsAdmin />;
}

function SettingsAdmin() {
  const [state, set] = useUrlState({ tab: 'general' });
  const tab = TABS.some((t) => t.value === state.tab) ? state.tab : 'general';
  const confirm = useConfirm();
  const [dirty, setDirty] = useState(false);
  useUnsavedWarning(dirty);

  const query = useApiQuery('/admin/settings', undefined, { keepPrevious: false });
  const settings = query.data?.settings;

  const changeTab = async (next) => {
    if (next === tab) return;
    if (dirty && !(await confirm({ title: 'Discard unsaved changes?', message: `Your changes on the ${TABS.find((t) => t.value === tab)?.label} tab have not been saved.`, confirmLabel: 'Discard', tone: 'danger' }))) return;
    setDirty(false);
    set({ tab: next });
  };

  let body;
  if (tab === 'webhooks') body = <WebhooksTab />;
  else if (query.isLoading) body = <FormSkeleton />;
  else if (query.error) body = <Card padded={false}><ErrorState error={query.error} onRetry={query.refetch} /></Card>;
  else if (settings) body = <SectionForm key={tab} section={tab} settings={settings} onDirty={setDirty} />;

  return (
    <>
      <PageHeader title="Settings" description="Store details, payments, shipping, tax and integrations." actions={<SyncButton />} />
      <Tabs items={TABS} value={tab} onChange={changeTab} />
      <div className="max-w-3xl">{body}</div>
    </>
  );
}

function SectionForm({ section, settings, onDirty }) {
  const initial = useMemo(() => sectionValues(section, settings), [section, settings]);
  const form = useForm(initial);
  const save = useApiMutation((values) => apiSend('put', '/admin/settings', sectionBody(section, values)), {
    invalidate: ['/admin/settings', '/admin/webhooks'],
    success: 'Settings saved.',
    onSuccess: (data, values) => {
      form.reset(data?.settings ? sectionValues(section, data.settings) : sectionValues(section, { ...settings, ...sectionBody(section, values) }));
      useSettingsStore.getState().load?.(true);
    },
    onError: (info) => form.setServerErrors(info.fields),
  });

  useEffect(() => {
    onDirty(form.dirty);
  }, [form.dirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);

  const submit = (e) => {
    e.preventDefault();
    const errors = validate(section, form.values);
    if (Object.keys(errors).length) return form.setErrors(errors);
    save.mutate(form.values);
  };

  const Section = SECTIONS[section];
  return (
    <form onSubmit={submit} className="space-y-5">
      <Section form={form} settings={settings} />
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 rounded-xl border border-white/[0.08] bg-surface/95 px-4 py-3 backdrop-blur">
        {form.dirty && <span className="mr-auto text-xs text-amber-200">Unsaved changes</span>}
        <Button variant="ghost" disabled={!form.dirty || save.isPending} onClick={() => form.reset()}>
          Discard
        </Button>
        <Button variant="primary" type="submit" icon={Save} loading={save.isPending} disabled={!form.dirty}>
          Save {TABS.find((t) => t.value === section)?.label.toLowerCase()}
        </Button>
      </div>
    </form>
  );
}

function validate(section, v) {
  const e = {};
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (section === 'general') {
    if (!String(v.storeName).trim()) e.storeName = 'Store name is required.';
    if (v.email && !email.test(v.email.trim())) e.email = 'Enter a valid email.';
    if (!/^[A-Za-z]{3}$/.test(String(v.currency).trim())) e.currency = 'Use a 3-letter ISO code like INR.';
  }
  if (section === 'payment' && v.upi && v.upiId && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v.upiId.trim())) e.upiId = 'UPI IDs look like store@bank.';
  if (section === 'shipping') {
    for (const k of NUMBERS.shipping) if (v[k] !== '' && Number(v[k]) < 0) e[k] = 'Must be 0 or more.';
  }
  if (section === 'tax' && (Number(v.gstPercent) < 0 || Number(v.gstPercent) > 100)) e.gstPercent = 'Between 0 and 100.';
  return e;
}

/* ---------------- Tabs ---------------- */

function GeneralSection({ form }) {
  return (
    <Card>
      <CardHeader title="Store" description="Email and phone fill the footer and grievance pages when the site content leaves them empty." />
      <div className="space-y-5">
        <FormGrid>
          <Field label="Store name" required error={form.errors.storeName}>
            {({ id }) => <Input id={id} {...form.bind('storeName')} />}
          </Field>
          <Field label="Currency" error={form.errors.currency} hint="ISO code used for every storefront price.">
            {({ id }) => <Input id={id} {...form.bind('currency')} maxLength={3} className="uppercase" placeholder="INR" />}
          </Field>
          <Field label="Support email" error={form.errors.email}>
            {({ id }) => <Input id={id} type="email" {...form.bind('email')} placeholder="hello@kuberstones.com" />}
          </Field>
          <Field label="Support phone">{({ id }) => <Input id={id} type="tel" {...form.bind('phone')} />}</Field>
        </FormGrid>
        <Field label="Logo">
          <div className="max-w-[10rem]">
            <MediaInput value={form.values.logo} onChange={(v) => form.set('logo', v)} folder="logo" />
          </div>
        </Field>
      </div>
    </Card>
  );
}

function PaymentSection({ form, settings }) {
  const set = settings?.payment || {};
  return (
    <>
      <Card>
        <CardHeader title="Checkout methods" />
        <div className="space-y-4">
          <Switch label="Cash on delivery" checked={form.values.cod} onChange={(v) => form.set('cod', v)} />
          <Switch label="UPI" description="Customers pay to your UPI ID and you confirm the payment manually." checked={form.values.upi} onChange={(v) => form.set('upi', v)} />
          {form.values.upi && (
            <Field label="UPI ID" error={form.errors.upiId}>
              {({ id }) => <Input id={id} {...form.bind('upiId')} placeholder="store@upi" />}
            </Field>
          )}
        </div>
      </Card>
      <Card>
        <CardHeader title="Cashfree" description="Online card, UPI and netbanking payments." actions={set.cashfreeSecretSet ? <Badge tone="success">Secret saved</Badge> : <Badge tone="warning">No secret</Badge>} />
        <div className="space-y-4">
          <Switch label="Enable Cashfree checkout" checked={form.values.cashfreeEnabled !== false} onChange={(v) => form.set('cashfreeEnabled', v)} />
          <FormGrid>
            <Field label="Environment">
              {({ id }) => (
                <Select
                  id={id}
                  options={[
                    { value: 'sandbox', label: 'Sandbox (testing)' },
                    { value: 'production', label: 'Production (live)' },
                  ]}
                  {...form.bind('cashfreeEnv')}
                />
              )}
            </Field>
            <Field label="Checkout label" hint="Shown to customers.">{({ id }) => <Input id={id} {...form.bind('gateway')} />}</Field>
          </FormGrid>
          <Field label="App ID (x-client-id)">{({ id }) => <Input id={id} {...form.bind('cashfreeAppId')} placeholder="From the Cashfree dashboard" autoComplete="off" />}</Field>
          <Field label="Secret key (x-client-secret)" hint="Never shown again after saving. Type a new one to replace it.">
            {({ id }) => <Input id={id} type="password" autoComplete="new-password" {...form.bind('cashfreeSecret')} placeholder={set.cashfreeSecretSet ? SECRET_PLACEHOLDER : 'From the Cashfree dashboard'} />}
          </Field>
          {form.values.gatewayKeyId ? (
            <Field label="Legacy gateway key ID">{({ id }) => <Input id={id} {...form.bind('gatewayKeyId')} />}</Field>
          ) : null}
          <p className="text-xs text-lilac">Set the payment webhook in Cashfree (Developers → Webhooks, version 2025-01-01). The URL is on the Webhooks tab.</p>
        </div>
      </Card>
    </>
  );
}

function ShippingSection({ form, settings }) {
  const s = settings?.shipping || {};
  return (
    <>
      <Card>
        <CardHeader title="Rates" description="Local pincode overrides (extra fees, blocked areas) live under Shipping." />
        <FormGrid cols={3}>
          <Field label="Shipping fee" error={form.errors.fee}>
            {({ id }) => <MoneyInput id={id} value={form.values.fee} onChange={(v) => form.set('fee', v)} />}
          </Field>
          <Field label="Free shipping above" error={form.errors.freeThreshold} hint="0 = never free.">
            {({ id }) => <MoneyInput id={id} value={form.values.freeThreshold} onChange={(v) => form.set('freeThreshold', v)} />}
          </Field>
          <Field label="Delivery estimate" error={form.errors.estimatedDays}>
            {({ id }) => <NumberInput id={id} min={0} value={form.values.estimatedDays} onChange={(v) => form.set('estimatedDays', v)} suffix="days" />}
          </Field>
        </FormGrid>
      </Card>

      <Card>
        <CardHeader
          title="iThink Logistics"
          description="Forward shipments, reverse pickups for approved returns, and live pincode checks."
          actions={s.ithinkAccessTokenSet || s.hasIthinkAccessToken ? <Badge tone="success">Connected</Badge> : <Badge tone="warning">Not connected</Badge>}
        />
        <div className="space-y-5">
          <Switch label="Enable iThink bookings and pincode checks" checked={form.values.ithinkEnabled !== false} onChange={(v) => form.set('ithinkEnabled', v)} />
          <FormSection title="Credentials" description={<>From the API settings at <a className="text-gold hover:text-gold-light" href="https://my.ithinklogistics.com/" target="_blank" rel="noreferrer">my.ithinklogistics.com</a>. Saved secrets are never shown again.</>}>
            <FormGrid>
              <Field label="Environment">
                {({ id }) => (
                  <Select
                    id={id}
                    options={[
                      { value: 'production', label: 'Production' },
                      { value: 'staging', label: 'Staging' },
                    ]}
                    {...form.bind('ithinkEnv')}
                  />
                )}
              </Field>
              <div />
              <Field label="Access token">
                {({ id }) => <Input id={id} type="password" autoComplete="new-password" {...form.bind('ithinkAccessToken')} placeholder={s.ithinkAccessTokenSet || s.hasIthinkAccessToken ? SECRET_PLACEHOLDER : 'From iThink API credentials'} />}
              </Field>
              <Field label="Secret key">
                {({ id }) => <Input id={id} type="password" autoComplete="new-password" {...form.bind('ithinkSecretKey')} placeholder={s.ithinkSecretSet ? SECRET_PLACEHOLDER : 'From iThink API credentials'} />}
              </Field>
              <Field label="Webhook token" hint="iThink must send this in the x-ithink-token header.">
                {({ id }) => <Input id={id} type="password" autoComplete="new-password" {...form.bind('ithinkWebhookSecret')} placeholder={s.ithinkWebhookSecretSet ? SECRET_PLACEHOLDER : 'Shared secret for iThink callbacks'} />}
              </Field>
            </FormGrid>
          </FormSection>
          <FormSection title="Booking defaults">
            <FormGrid>
              <Field label="Preferred courier">
                {({ id }) => <Select id={id} options={['delhivery', 'bluedart', 'xpressbees', 'ecom', 'ekart'].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))} {...form.bind('ithinkLogistics')} />}
              </Field>
              <Field label="Service type" hint="Optional, e.g. air or surface.">{({ id }) => <Input id={id} {...form.bind('ithinkServiceType')} />}</Field>
              <Field label="Pickup warehouse ID">{({ id }) => <Input id={id} {...form.bind('ithinkPickupAddressId')} />}</Field>
              <Field label="Return warehouse ID">{({ id }) => <Input id={id} {...form.bind('ithinkReturnAddressId')} />}</Field>
            </FormGrid>
            <WarehousePicker form={form} />
          </FormSection>
          <FormSection title="Default parcel" description="Used when a product has no dimensions.">
            <FormGrid cols={4}>
              <Field label="Length" error={form.errors.defaultLengthCm}>{({ id }) => <NumberInput id={id} min={0} value={form.values.defaultLengthCm} onChange={(v) => form.set('defaultLengthCm', v)} suffix="cm" />}</Field>
              <Field label="Width" error={form.errors.defaultWidthCm}>{({ id }) => <NumberInput id={id} min={0} value={form.values.defaultWidthCm} onChange={(v) => form.set('defaultWidthCm', v)} suffix="cm" />}</Field>
              <Field label="Height" error={form.errors.defaultHeightCm}>{({ id }) => <NumberInput id={id} min={0} value={form.values.defaultHeightCm} onChange={(v) => form.set('defaultHeightCm', v)} suffix="cm" />}</Field>
              <Field label="Weight" error={form.errors.defaultWeightGrams}>{({ id }) => <NumberInput id={id} min={0} value={form.values.defaultWeightGrams} onChange={(v) => form.set('defaultWeightGrams', v)} suffix="g" />}</Field>
            </FormGrid>
          </FormSection>
        </div>
      </Card>
    </>
  );
}

function WarehousePicker({ form }) {
  const [load, setLoad] = useState(false);
  const q = useApiQuery('/admin/ithink/warehouses', undefined, { enabled: load, keepPrevious: false, retry: false });
  const rows = q.data?.warehouses || [];
  const idOf = (w) => String(w.id ?? w.warehouse_id ?? '');
  return (
    <div className="space-y-2">
      <Button size="sm" icon={Warehouse} loading={q.isFetching} onClick={() => (load ? q.refetch() : setLoad(true))}>
        {load ? 'Reload warehouses' : 'Load warehouses from iThink'}
      </Button>
      {load && q.error && <p className="text-xs text-rose-300">{q.error.message || 'Could not load warehouses.'} Save your credentials first.</p>}
      {load && q.isSuccess && !rows.length && <p className="text-xs text-lilac">iThink returned no warehouses.</p>}
      {rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((w) => {
            const id = idOf(w);
            const isPickup = String(form.values.ithinkPickupAddressId) === id;
            const isReturn = String(form.values.ithinkReturnAddressId) === id;
            return (
              <li key={id} className="flex flex-col gap-2 rounded-lg border border-white/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 text-xs text-lilac">
                  <span className="font-mono text-ivory">{id}</span> · {w.company_name || w.city_name || 'Warehouse'} · {[w.address1, w.pincode].filter(Boolean).join(' ')}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant={isPickup ? 'primary' : 'secondary'} onClick={() => form.set('ithinkPickupAddressId', id)}>
                    {isPickup ? 'Pickup ✓' : 'Use for pickup'}
                  </Button>
                  <Button size="sm" variant={isReturn ? 'primary' : 'secondary'} onClick={() => form.set('ithinkReturnAddressId', id)}>
                    {isReturn ? 'Returns ✓' : 'Use for returns'}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TaxSection({ form }) {
  return (
    <Card>
      <CardHeader title="Tax" description="GST added at checkout. Use 0 if prices already include tax." />
      <div className="max-w-[12rem]">
        <Field label="GST" error={form.errors.gstPercent}>
          {({ id }) => <NumberInput id={id} min={0} max={100} step="0.01" value={form.values.gstPercent} onChange={(v) => form.set('gstPercent', v)} suffix="%" />}
        </Field>
      </div>
    </Card>
  );
}

function NotificationsSection({ form }) {
  return (
    <Card>
      <CardHeader title="Alert channels" description="These only tag alerts in the admin notification centre. Customer email, SMS and WhatsApp are not sent yet." />
      <div className="space-y-4">
        <Switch label="Email" checked={form.values.email} onChange={(v) => form.set('email', v)} />
        <Switch label="SMS" checked={form.values.sms} onChange={(v) => form.set('sms', v)} />
        <Switch label="WhatsApp" checked={form.values.whatsapp} onChange={(v) => form.set('whatsapp', v)} />
      </div>
    </Card>
  );
}

function SeoSection({ form }) {
  const desc = form.values.description || '';
  return (
    <Card>
      <CardHeader title="Search & sharing" description="Defaults for pages without their own SEO fields." />
      <div className="space-y-5">
        <Field label="Default title" hint={`${(form.values.title || '').length}/60 characters`}>
          {({ id }) => <Input id={id} {...form.bind('title')} />}
        </Field>
        <Field label="Meta description" hint={`${desc.length}/160 characters`}>
          {({ id }) => <Textarea id={id} rows={3} {...form.bind('description')} />}
        </Field>
        <Field label="Keywords" hint="Comma separated.">{({ id }) => <Input id={id} {...form.bind('keywords')} />}</Field>
        <Field label="Share image (Open Graph)" hint="1200 × 630 works best.">
          <div className="max-w-xs">
            <MediaInput value={form.values.ogImage} onChange={(v) => form.set('ogImage', v)} folder="logo" aspect="aspect-[1200/630]" />
          </div>
        </Field>
        <Switch label="Hide the store from search engines" description="Adds noindex. Use only while the store is not ready." checked={form.values.noIndex} onChange={(v) => form.set('noIndex', v)} />
      </div>
    </Card>
  );
}

const SECTIONS = {
  general: GeneralSection,
  payment: PaymentSection,
  shipping: ShippingSection,
  tax: TaxSection,
  notifications: NotificationsSection,
  seo: SeoSection,
};

/* ---------------- Webhooks ---------------- */

const EVENT_TONE = { applied: 'success', ignored: 'neutral', processing: 'info', mismatch: 'warning', failed: 'danger' };

function WebhooksTab() {
  const urls = useApiQuery('/admin/webhooks/urls');
  const events = useApiQuery('/admin/webhooks');
  const hooks = { ...(events.data?.webhooks || {}), ...(urls.data?.webhooks || {}) };
  const rows = events.data?.events || [];

  const columns = [
    { key: 'createdAt', header: 'When', render: (e) => <span title={dateTime(e.createdAt)}>{relative(e.createdAt)}</span> },
    { key: 'provider', header: 'Provider', render: (e) => <span className="capitalize">{e.provider}</span> },
    { key: 'eventType', header: 'Event', hideBelow: 'sm', render: (e) => <span className="text-xs">{e.eventType || '—'}</span> },
    { key: 'status', header: 'Result', render: (e) => <Badge tone={EVENT_TONE[e.status] || 'neutral'}>{e.status}</Badge> },
    { key: 'ref', header: 'Reference', hideBelow: 'md', render: (e) => <span className="font-mono text-xs">{e.ref || '—'}</span> },
    { key: 'message', header: 'Note', hideBelow: 'lg', render: (e) => <span className="line-clamp-2 max-w-xs text-xs text-lilac">{e.message || '—'}</span> },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Cashfree payments" description="Cashfree dashboard → Payment Gateway → Developers → Webhooks. Version 2025-01-01." />
        {urls.isLoading ? <Skeleton className="h-10" /> : <CopyField value={hooks.cashfree} label="Copy Cashfree URL" />}
        <p className="mt-2 text-xs text-lilac">Subscribe to Success Payment, Failed Payment, User Dropped Payment and Refund. Requests are verified with Cashfree’s signature.</p>
      </Card>
      <Card>
        <CardHeader title="iThink shipping updates" description="iThink panel → Settings → Webhook / callback URL." />
        {urls.isLoading ? <Skeleton className="h-10" /> : <CopyField value={hooks.ithink} label="Copy iThink URL" />}
        <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-400/[0.06] px-3 py-2.5 text-xs leading-relaxed text-amber-100">
          iThink must send your webhook token in the <code className="rounded bg-white/10 px-1 font-mono">x-ithink-token</code> request header. Tokens in the URL (<code className="font-mono">?token=</code>) are not accepted. Set the token on the Shipping tab.
        </div>
        {hooks.ithinkSync && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-lilac">Fallback sync endpoint for a scheduled job (needs the x-sync-secret header):</p>
            <CopyField value={hooks.ithinkSync} label="Copy sync URL" />
          </div>
        )}
      </Card>
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ivory">Recent events</h3>
            <p className="text-xs text-lilac">Latest 50 webhook calls received.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" icon={RefreshCw} loading={events.isFetching && !events.isLoading} onClick={() => events.refetch()}>
              Refresh
            </Button>
            <SyncButton size="sm" />
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(e) => e._id || `${e.provider}-${e.eventId}-${e.createdAt}`}
          loading={events.isLoading}
          fetching={events.isFetching}
          error={events.error}
          onRetry={events.refetch}
          dense
          empty={<EmptyState icon={Globe} title="No webhook events yet" description="Events appear here as soon as Cashfree or iThink call the URLs above." />}
        />
      </div>
    </div>
  );
}

function SyncButton({ size = 'md' }) {
  const sync = useApiMutation(() => apiSend('post', '/shipping/ithink/sync/admin', { minutes: 25 }), {
    invalidate: ['/admin/webhooks', '/orders/admin', '/admin/dashboard', '/admin/returns'],
    success: (data) => {
      const results = data?.results || [];
      const updated = results.filter((r) => r.status).length;
      const failed = results.filter((r) => r.error).length;
      const checked = data?.totalChanged ?? results.length;
      if (!checked) return 'Sync done. No shipment updates from iThink.';
      return `Sync done. ${checked} changed, ${updated} order${updated === 1 ? '' : 's'} updated${failed ? `, ${failed} failed` : ''}${data?.truncated ? ' (first 50 only)' : ''}.`;
    },
  });
  return (
    <Button size={size} icon={RefreshCw} loading={sync.isPending} onClick={() => sync.mutate()} title="Pull shipment status changes from iThink for the last 25 minutes">
      Sync shipments now
    </Button>
  );
}

function FormSkeleton() {
  return (
    <Card className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}
