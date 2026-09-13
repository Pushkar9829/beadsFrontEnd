import AdminCrud, { fieldClass, labelClass } from './AdminCrud';

const empty = { name: '', slug: '', type: 'text', options: '', appliesTo: 'product', sortOrder: 0, isActive: true };

export default function AdminAttributes() {
  return (
    <AdminCrud
      title="Attributes"
      subtitle="Reusable product and bead fields — color, size, origin, and anything you define."
      endpoint="/admin/attributes"
      createLabel="Create attribute"
      emptyForm={empty}
      columns={[
        { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'type', label: 'Type' },
        { key: 'appliesTo', label: 'Applies to' },
        { key: 'isActive', label: 'Status', render: (r) => (r.isActive ? 'Active' : 'Hidden') },
      ]}
      fields={({ form, setForm }) => (
        <>
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Slug<input className={`${fieldClass} mt-1`} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label className={labelClass}>Type
            <select className={`${fieldClass} mt-1`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="text">Text</option>
              <option value="select">Select</option>
            </select>
          </label>
          <label className={labelClass}>Options (comma-separated)<input className={`${fieldClass} mt-1`} value={Array.isArray(form.options) ? form.options.join(', ') : form.options || ''} onChange={(e) => setForm({ ...form, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></label>
          <label className={labelClass}>Applies to
            <select className={`${fieldClass} mt-1`} value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}>
              <option value="product">Product</option>
              <option value="bead">Bead</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </>
      )}
    />
  );
}
