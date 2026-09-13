import AdminCrud, { fieldClass, labelClass } from './AdminCrud';

const empty = { pincode: '', city: '', state: '', serviceable: true, extraFee: 0, estimatedDays: 5 };

export default function AdminShipping() {
  return (
    <AdminCrud
      title="Shipping / pincodes"
      subtitle="Local overrides for fees and blocked pincodes. Live serviceability uses iThink Logistics when credentials are set in Settings."
      endpoint="/admin/pincodes"
      createLabel="Add pincode"
      searchKey="pincode"
      emptyForm={empty}
      columns={[
        { key: 'pincode', label: 'Pincode', render: (r) => <span className="font-medium">{r.pincode}</span> },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'serviceable', label: 'Serviceable', render: (r) => (r.serviceable ? 'Yes' : 'No') },
        { key: 'extraFee', label: 'Extra fee' },
        { key: 'estimatedDays', label: 'Days' },
      ]}
      fields={({ form, setForm }) => (
        <>
          <label className={labelClass}>Pincode<input required className={`${fieldClass} mt-1`} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></label>
          <label className={labelClass}>City<input className={`${fieldClass} mt-1`} value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label className={labelClass}>State<input className={`${fieldClass} mt-1`} value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} /></label>
          <label className={labelClass}>Extra fee<input type="number" className={`${fieldClass} mt-1`} value={form.extraFee} onChange={(e) => setForm({ ...form, extraFee: Number(e.target.value) })} /></label>
          <label className={labelClass}>Estimated days<input type="number" className={`${fieldClass} mt-1`} value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: Number(e.target.value) })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.serviceable} onChange={(e) => setForm({ ...form, serviceable: e.target.checked })} /> Serviceable</label>
        </>
      )}
    />
  );
}
