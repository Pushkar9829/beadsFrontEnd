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
  payment: { cod: false, upi: false, gateway: '' },
  shipping: { fee: 0, freeThreshold: 999 },
  tax: { gstPercent: 0 },
  notifications: { email: true, sms: false, whatsapp: false },
};

export default function AdminSettings() {
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState('general');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setForm({ ...empty, ...data.settings, payment: { ...empty.payment, ...data.settings?.payment }, shipping: { ...empty.shipping, ...data.settings?.shipping }, tax: { ...empty.tax, ...data.settings?.tax }, notifications: { ...empty.notifications, ...data.settings?.notifications } }));
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      await api.put('/admin/settings', form);
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
            <label className={labelClass}>Gateway name<input className={`${fieldClass} mt-1`} value={form.payment.gateway} onChange={(e) => setForm({ ...form, payment: { ...form.payment, gateway: e.target.value } })} placeholder="Razorpay, Stripe…" /></label>
          </>
        )}
        {tab === 'shipping' && (
          <>
            <label className={labelClass}>Shipping fee<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.fee} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, fee: Number(e.target.value) } })} /></label>
            <label className={labelClass}>Free shipping above<input type="number" className={`${fieldClass} mt-1`} value={form.shipping.freeThreshold} onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, freeThreshold: Number(e.target.value) } })} /></label>
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
            <p className="text-xs text-lilac">Flags only — sending providers are not wired yet.</p>
          </>
        )}
        <div className="pt-2"><Button type="submit">Save settings</Button></div>
      </form>
    </div>
  );
}
