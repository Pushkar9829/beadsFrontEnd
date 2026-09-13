import AdminCrud, { fieldClass, labelClass } from './AdminCrud';

const empty = { name: '', slug: '', description: '', color: '#C6A75E', isActive: true };

export default function AdminGroups() {
  return (
    <AdminCrud
      title="Customer groups"
      subtitle="Manual groups you can assign on a customer profile. Computed segments still appear on the customers list."
      endpoint="/admin/groups"
      createLabel="Create group"
      emptyForm={empty}
      columns={[
        { key: 'name', label: 'Group', render: (r) => <span className="font-medium" style={{ color: r.color }}>{r.name}</span> },
        { key: 'slug', label: 'Slug' },
        { key: 'isActive', label: 'Status', render: (r) => (r.isActive ? 'Active' : 'Hidden') },
      ]}
      fields={({ form, setForm }) => (
        <>
          <label className={labelClass}>Name<input required className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={labelClass}>Slug<input className={`${fieldClass} mt-1`} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label className={labelClass}>Description<textarea className={`${fieldClass} mt-1`} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className={labelClass}>Color<input className={`${fieldClass} mt-1`} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </>
      )}
    />
  );
}
