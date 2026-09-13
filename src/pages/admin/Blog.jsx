import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { paginate, Pagination } from '../../components/admin/AdminToolbar';
import { toast } from '../../lib/adminToast';

const empty = {
  title: '', slug: '', excerpt: '', body: '', image: '', author: 'Kuberstones', isPublished: false,
  seo: { title: '', description: '', keywords: '', ogImage: '', noIndex: false },
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.get('/admin/blog').then(({ data }) => setPosts(data.posts || []));
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => posts.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())), [posts, q]);
  const { slice, total, pages, page: p } = paginate(filtered, page);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/blog/${editing}`, form);
      else await api.post('/admin/blog', form);
      toast(editing ? 'Post saved.' : 'Post created.');
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message || 'Could not save.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Journal" subtitle="Blog posts for the storefront /journal." onCreate={() => { setEditing(null); setForm(empty); setOpen(true); }} createLabel="Write post" />
      <AdminToolbar search={q} onSearch={setQ} searchPlaceholder="Search posts" />
      <AdminTable
        rows={slice}
        empty="No posts yet."
        columns={[
          { key: 'title', label: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
          { key: 'isPublished', label: 'Status', render: (r) => (r.isPublished ? 'Published' : 'Draft') },
          { key: 'publishedAt', label: 'Published', render: (r) => r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('en-IN') : '—' },
          { key: 'actions', label: 'Actions', align: 'right', render: (r) => (
            <RowActions onEdit={() => { setEditing(r._id); setForm({ ...empty, ...r, seo: { ...empty.seo, ...r.seo } }); setOpen(true); }} onDelete={() => setRemove(r)} />
          ) },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <AdminDrawer open={open} title={editing ? 'Edit post' : 'Write post'} onClose={() => setOpen(false)} wide>
        <form onSubmit={save} className="space-y-3">
          <label className={labelClass}>Title<input required className={`${fieldClass} mt-1`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className={labelClass}>Slug<input className={`${fieldClass} mt-1`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label className={labelClass}>Image URL<input className={`${fieldClass} mt-1`} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></label>
          <label className={labelClass}>Excerpt<textarea className={`${fieldClass} mt-1`} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></label>
          <label className={labelClass}>Body<textarea rows={8} className={`${fieldClass} mt-1`} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <label className={labelClass}>SEO title<input className={`${fieldClass} mt-1`} value={form.seo.title} onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })} /></label>
          <label className={labelClass}>Meta description<textarea className={`${fieldClass} mt-1`} value={form.seo.description} onChange={(e) => setForm({ ...form, seo: { ...form.seo, description: e.target.value } })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
          <div className="flex gap-2 pt-2"><Button type="submit">{editing ? 'Save' : 'Create'}</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
        </form>
      </AdminDrawer>
      <ConfirmDelete open={!!remove} title="Delete post" body={remove ? `Remove “${remove.title}”?` : ''} onClose={() => setRemove(null)} onConfirm={async () => { await api.delete(`/admin/blog/${remove._id}`); setRemove(null); toast('Deleted.'); load(); }} />
    </div>
  );
}
