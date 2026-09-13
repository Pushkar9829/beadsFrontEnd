import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminHeader, { fieldClass, labelClass } from '../../components/admin/AdminHeader';
import { toast } from '../../lib/adminToast';

const empty = {
  storeName: 'Kuberstones',
  logo: '',
  email: '',
  phone: '',
  currency: 'INR',
  payment: {
    cod: true,
    upi: true,
    gateway: 'Cashfree',
    gatewayKeyId: '',
    upiId: '',
    cashfreeEnabled: true,
    cashfreeAppId: '',
    cashfreeSecret: '',
    cashfreeSecretSet: false,
    cashfreeEnv: 'sandbox',
  },
  shipping: {
    fee: 0,
    freeThreshold: 999,
    estimatedDays: 5,
    ithinkEnabled: true,
    ithinkEnv: 'production',
    ithinkAccessToken: '',
    ithinkSecretKey: '',
    ithinkSecretSet: false,
    ithinkPickupAddressId: '',
    ithinkReturnAddressId: '',
    ithinkLogistics: 'delhivery',
    ithinkServiceType: '',
    ithinkWebhookSecret: '',
    ithinkWebhookSecretSet: false,
    defaultLengthCm: 10,
    defaultWidthCm: 10,
    defaultHeightCm: 5,
    defaultWeightGrams: 400,
  },
  tax: { gstPercent: 0 },
  notifications: { email: true, sms: false, whatsapp: false },
  seo: { title: 'Kuberstones', description: '', keywords: '', ogImage: '', noIndex: false },
};

export default function AdminSettings() {
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('general');
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseNote, setWarehouseNote] = useState('');
  const [hooks, setHooks] = useState({ cashfree: 'https://beadbackend.onrender.com/api/payments/cashfree/webhook', ithink: 'https://beadbackend.onrender.com/api/shipping/ithink/webhook', ithinkSync: 'https://beadbackend.onrender.com/api/shipping/ithink/sync' });
  const [hookEvents, setHookEvents] = useState([]);

  useEffect(() => {
    api.get('/admin/webhooks').then(({ data }) => {
      if (data.webhooks) setHooks(data.webhooks);
      setHookEvents(data.events || []);
    }).catch(() => {});
    api.get('/admin/settings').then(({ data }) => setForm({
      ...empty,
      ...data.settings,
      payment: { ...empty.payment, ...data.settings?.payment },
      shipping: { ...empty.shipping, ...data.settings?.shipping },
      tax: { ...empty.tax, ...data.settings?.tax },
      notifications: { ...empty.notifications, ...data.settings?.notifications },
      seo: { ...empty.seo, ...data.settings?.seo },
    }));
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      const { data } = await api.put('/admin/settings', form);
      if (data.settings) {
        setForm({
          ...empty,
          ...data.settings,
          payment: { ...empty.payment, ...data.settings.payment },
          shipping: { ...empty.shipping, ...data.settings.shipping },
          tax: { ...empty.tax, ...data.settings.tax },
          notifications: { ...empty.notifications, ...data.settings.notifications },
          seo: { ...empty.seo, ...data.settings.seo },
        });
      }
      toast('Settings saved.');
    } catch (err) {
      toast(err.message || 'Could not save settings.', 'error');
    }
  }

  const tabs = [
    ['general', 'General'],
    ['payment', 'Payment'],
    ['shipping', 'Shipping'],
    ['tax', 'Tax'],
    ['notifications', 'Notifications'],
    ['seo', 'SEO'],
    ['webhooks', 'Webhooks'],
  ];

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Store identity, payment flags, shipping, tax, and alerts." />
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest ${tab === id ? 'border-gold bg-gold/15 text-gold' : 'border-gold/30 text-lilac'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={save} className="max-w-xl space-y-3">
        {tab === 'general' && (
          <>
            <label className={labelClass}>Store name<input className={`${fieldClass} mt-1`} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></label>
            <label className={labelClass}>Logo URL<input className={`${fieldClass} mt-1`} value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></label>
            <label className={labelClass}>Email<input className={`${fieldClass} mt-1`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className={labelClass}>Phone<input className={`${fieldClass} mt-1`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className={labelClass}>Currency<input className={`${fieldClass} mt-1`} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></label>
          </>
        )}
        {tab === 'payment' && (
          <>
            <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.payment.cod} onChange={(e) => setForm({ ...form, payment: { ...form.payment, cod: e.target.checked } })} /> Cash on delivery</label>
            <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.payment.upi} onChange={(e) => setForm({ ...form, payment: { ...form.payment, upi: e.target.checked } })} /> UPI</label>
            <label className={labelClass}>UPI ID<input className={`${fieldClass} mt-1`} value={form.payment.upiId || ''} onChange={(e) => setForm({ ...form, payment: { ...form.payment, upiId: e.target.value } })} placeholder="store@upi" /></label>
            <div className="rounded-2xl border border-gold/20 p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-gold">Cashfree</p>
              <label className="flex items-center gap-2 text-sm text-lilac">
                <input type="checkbox" checked={form.payment.cashfreeEnabled !== false} onChange={(e) => setForm({ ...form, payment: { ...form.payment, cashfreeEnabled: e.target.checked } })} />
                Enable Cashfree checkout
              </label>
              <label className={labelClass}>Environment
                <select className={`${fieldClass} mt-1`} value={form.payment.cashfreeEnv || 'sandbox'} onChange={(e) => setForm({ ...form, payment: { ...form.payment, cashfreeEnv: e.target.value } })}>
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </label>
              <label className={labelClass}>App ID / x-client-id
                <input className={`${fieldClass} mt-1`} value={form.payment.cashfreeAppId || ''} onChange={(e) => setForm({ ...form, payment: { ...form.payment, cashfreeAppId: e.target.value } })} placeholder="From Cashfree dashboard" />
              </label>
              <label className={labelClass}>Secret key / x-client-secret
                <input className={`${fieldClass} mt-1`} type="password" value={form.payment.cashfreeSecret || ''} onChange={(e) => setForm({ ...form, payment: { ...form.payment, cashfreeSecret: e.target.value } })} placeholder={form.payment.cashfreeSecretSet ? 'Saved — leave blank to keep' : 'From Cashfree dashboard'} />
              </label>
              <p className="text-xs text-lilac">
                Production webhook (Cashfree Dashboard → Developers → Webhooks, version 2025-01-01):
                <code className="mt-1 block break-all text-ivory/80">{hooks.cashfree}</code>
                Subscribe to Success Payment, Failed Payment, User Dropped Payment, and Refund.
              </p>
            </div>
          </>
        )}
        {tab === 'shipping' && (
          <>
            <label className={labelClass}>Shipping fee<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.fee} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, fee: Number(e.target.value) } })} /></label>
            <label className={labelClass}>Free shipping above<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.freeThreshold} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, freeThreshold: Number(e.target.value) } })} /></label>
            <label className={labelClass}>Default delivery days<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.estimatedDays || 5} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, estimatedDays: Number(e.target.value) } })} /></label>
            <div className="rounded-2xl border border-gold/20 p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-gold">iThink Logistics</p>
              <p className="text-xs text-lilac">Forward shipping, reverse pickup for approved returns/exchanges, and pincode checks use <a className="text-gold" href="https://my.ithinklogistics.com/" target="_blank" rel="noreferrer">my.ithinklogistics.com</a>.</p>
              <label className="flex items-center gap-2 text-sm text-lilac">
                <input type="checkbox" checked={form.shipping.ithinkEnabled !== false} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkEnabled: e.target.checked } })} />
                Enable iThink bookings and pincode checks
              </label>
              <label className={labelClass}>Environment
                <select className={`${fieldClass} mt-1`} value={form.shipping.ithinkEnv || 'production'} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkEnv: e.target.value } })}>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </label>
              <label className={labelClass}>Access token
                <input className={`${fieldClass} mt-1`} value={form.shipping.ithinkAccessToken || ''} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkAccessToken: e.target.value } })} placeholder="From iThink API credentials" />
              </label>
              <label className={labelClass}>Secret key
                <input className={`${fieldClass} mt-1`} type="password" value={form.shipping.ithinkSecretKey || ''} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkSecretKey: e.target.value } })} placeholder={form.shipping.ithinkSecretSet ? 'Saved — leave blank to keep' : 'From iThink API credentials'} />
              </label>
              <label className={labelClass}>Preferred courier
                <select className={`${fieldClass} mt-1`} value={form.shipping.ithinkLogistics || 'delhivery'} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkLogistics: e.target.value } })}>
                  {['delhivery', 'bluedart', 'xpressbees', 'ecom', 'ekart'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className={labelClass}>Service type (air / surface, optional)
                <input className={`${fieldClass} mt-1`} value={form.shipping.ithinkServiceType || ''} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkServiceType: e.target.value } })} />
              </label>
              <label className={labelClass}>Pickup warehouse ID
                <input className={`${fieldClass} mt-1`} value={form.shipping.ithinkPickupAddressId || ''} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkPickupAddressId: e.target.value } })} />
              </label>
              <label className={labelClass}>Return warehouse ID
                <input className={`${fieldClass} mt-1`} value={form.shipping.ithinkReturnAddressId || ''} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkReturnAddressId: e.target.value } })} />
              </label>
              <label className={labelClass}>Webhook token
                <input className={`${fieldClass} mt-1`} type="password" value={form.shipping.ithinkWebhookSecret || ''} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, ithinkWebhookSecret: e.target.value } })} placeholder={form.shipping.ithinkWebhookSecretSet ? 'Saved — leave blank to keep' : 'Shared secret for iThink callbacks'} />
              </label>
              <p className="text-xs text-lilac">
                iThink webhook URL:
                <code className="mt-1 block break-all text-ivory/80">{hooks.ithink}</code>
                Add <code className="text-ivory/80">?token=YOUR_WEBHOOK_TOKEN</code> or send it as <code className="text-ivory/80">x-ithink-token</code>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>Length cm<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.defaultLengthCm || 10} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, defaultLengthCm: Number(e.target.value) } })} /></label>
                <label className={labelClass}>Width cm<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.defaultWidthCm || 10} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, defaultWidthCm: Number(e.target.value) } })} /></label>
                <label className={labelClass}>Height cm<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.defaultHeightCm || 5} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, defaultHeightCm: Number(e.target.value) } })} /></label>
                <label className={labelClass}>Weight grams<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.defaultWeightGrams || 400} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, defaultWeightGrams: Number(e.target.value) } })} /></label>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  setWarehouseNote('');
                  try {
                    const { data } = await api.get('/admin/ithink/warehouses');
                    setWarehouses(data.warehouses || []);
                    setWarehouseNote((data.warehouses || []).length ? `${data.warehouses.length} warehouses loaded.` : 'No warehouses returned.');
                  } catch (err) {
                    setWarehouseNote(err.message || 'Could not load warehouses.');
                  }
                }}
              >
                Load warehouses
              </Button>
              {warehouseNote && <p className="text-xs text-lilac">{warehouseNote}</p>}
              {warehouses.map((w) => (
                <button
                  key={w.id || w.warehouse_id}
                  type="button"
                  className="block w-full rounded-xl border border-gold/20 px-3 py-2 text-left text-xs text-lilac hover:border-gold"
                  onClick={() => setForm({
                    ...form,
                    shipping: {
                      ...form.shipping,
                      ithinkPickupAddressId: String(w.id || w.warehouse_id),
                      ithinkReturnAddressId: form.shipping.ithinkReturnAddressId || String(w.id || w.warehouse_id),
                    },
                  })}
                >
                  {w.id || w.warehouse_id} · {w.company_name || w.city_name} · {w.address1} {w.pincode}
                </button>
              ))}
            </div>
            <p className="text-xs text-lilac">Local pincode overrides still live under Shipping. iThink is used first when credentials are set.</p>
          </>
        )}
        {tab === 'tax' && (
          <label className={labelClass}>GST %<input type="number" className={`${fieldClass} mt-1`} value={form.tax.gstPercent} onChange={(e) => setForm({ ...form, tax: { gstPercent: Number(e.target.value) } })} /></label>
        )}
        {tab === 'notifications' && (
          <>
            <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.notifications.email} onChange={(e) => setForm({ ...form, notifications: { ...form.notifications, email: e.target.checked } })} /> Email</label>
            <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.notifications.sms} onChange={(e) => setForm({ ...form, notifications: { ...form.notifications, sms: e.target.checked } })} /> SMS</label>
            <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.notifications.whatsapp} onChange={(e) => setForm({ ...form, notifications: { ...form.notifications, whatsapp: e.target.checked } })} /> WhatsApp</label>
            <p className="text-xs text-lilac">Alerts are stored in the admin notification center. Channel flags mark how they should go out once a provider is connected.</p>
          </>
        )}
        {tab === 'seo' && (
          <>
            <label className={labelClass}>Default title<input className={`${fieldClass} mt-1`} value={form.seo.title} onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} /></label>
            <label className={labelClass}>Meta description<textarea className={`${fieldClass} mt-1`} value={form.seo.description} onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })} /></label>
            <label className={labelClass}>Keywords<input className={`${fieldClass} mt-1`} value={form.seo.keywords} onChange={(e) => setForm({ ...form, seo: { ...form.seo, keywords: e.target.value } })} /></label>
            <label className={labelClass}>OG image<input className={`${fieldClass} mt-1`} value={form.seo.ogImage} onChange={(e) => setForm({ ...form, seo: { ...form.seo, ogImage: e.target.value } })} /></label>
            <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.seo.noIndex} onChange={(e) => setForm({ ...form, seo: { ...form.seo, noIndex: e.target.checked } })} /> No-index the store</label>
          </>
        )}
        {tab === 'webhooks' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/20 p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gold">Cashfree payment</p>
              <code className="block break-all text-xs text-ivory/80">{hooks.cashfree}</code>
              <p className="text-xs text-lilac">Merchant Dashboard → Payment Gateway → Developers → Webhooks. Version 2025-01-01. Events: Success, Failed, User Dropped, Refund.</p>
            </div>
            <div className="rounded-2xl border border-gold/20 p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gold">iThink shipping</p>
              <code className="block break-all text-xs text-ivory/80">{hooks.ithink}</code>
              <p className="text-xs text-lilac">Paste this in the iThink panel webhook/callback setting. Sync fallback: <code className="break-all text-ivory/80">{hooks.ithinkSync}</code></p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                try {
                  await api.post('/admin/shipping/sync', { minutes: 25 });
                  toast('iThink sync ran.');
                  const { data } = await api.get('/admin/webhooks');
                  setHookEvents(data.events || []);
                } catch (err) {
                  toast(err.message || 'Sync failed.', 'error');
                }
              }}
            >
              Sync recent iThink scans
            </Button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gold">Recent webhook events</p>
              <ul className="mt-2 space-y-1 text-xs text-lilac">
                {hookEvents.slice(0, 20).map((ev) => (
                  <li key={ev._id}>{new Date(ev.createdAt).toLocaleString('en-IN')} · {ev.provider} · {ev.eventType || 'event'} · {ev.status} · {ev.ref}</li>
                ))}
                {!hookEvents.length && <li>No events received yet.</li>}
              </ul>
            </div>
          </div>
        )}
        <div className="pt-2"><Button type="submit">Save settings</Button></div>
      </form>
    </div>
  );
}
