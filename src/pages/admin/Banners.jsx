import AdminCrud, { fieldClass, labelClass } from './AdminCrud';
import { mediaUrl } from '../../api/client';
import MediaField from '../../components/admin/MediaField';

const empty = { title: '', image: '', mobileImage: '', link: '', placement: 'home', sortOrder: 0, isActive: true, startsAt: '', endsAt: '' };

export default function AdminBanners() {
  return (
    <AdminCrud
      title="Banners"
      subtitle="Scheduled marketing banners for home, shop, and collection pages."
      endpoint="/admin/banners"
      createLabel="Create banner"
      emptyForm={empty}
      columns={[
        {
          key: 'title',
          label: 'Banner',
          render: (r) => (
            <div className="flex items-center gap-3">
              {r.image ? <img src={mediaUrl(r.image)} alt="" className="h-11 w-16 rounded-lg object-cover" /> : <span className="h-11 w-16 rounded-lg bg-raised" />}
              <span className="font-medium">{r.title}</span>
            </div>
          ),
        },
        { key: 'placement', label: 'Placement' },
        { key: 'isActive', label: 'Status', render: (r) => (r.isActive ? 'Active' : 'Hidden') },
      ]}
      fields={({ form, setForm }) => (
        <>
          <label className={labelClass}>Title<input required className={`${fieldClass} mt-1`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <MediaField label="Image" folder="banner" value={form.image} onChange={(image) => setForm({ ...form, image })} />
          <MediaField label="Mobile image" folder="banner" value={form.mobileImage || ''} onChange={(mobileImage) => setForm({ ...form, mobileImage })} />
          <label className={labelClass}>Link<input className={`${fieldClass} mt-1`} value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} /></label>
          <label className={labelClass}>Placement
            <select className={`${fieldClass} mt-1`} value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
              <option value="home">Home</option>
              <option value="shop">Shop</option>
              <option value="category">Category</option>
              <option value="collection">Collection</option>
            </select>
          </label>
          <label className={labelClass}>Starts<input type="datetime-local" className={`${fieldClass} mt-1`} value={(form.startsAt || '').slice(0, 16)} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label className={labelClass}>Ends<input type="datetime-local" className={`${fieldClass} mt-1`} value={(form.endsAt || '').slice(0, 16)} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </>
      )}
    />
  );
}
