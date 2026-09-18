import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import { uploadAdminMedia } from '../../api/uploadMedia';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader, { RowActions, fieldClass } from '../../components/admin/AdminHeader';
import AdminToolbar, { FilterSelect, paginate, Pagination } from '../../components/admin/AdminToolbar';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import { toast } from '../../lib/adminToast';

const FOLDERS = [
  { value: 'all', label: 'All media' },
  { value: 'product', label: 'Product images' },
  { value: 'bead', label: 'Bead images' },
  { value: 'category', label: 'Category images' },
  { value: 'banner', label: 'Banners' },
  { value: 'blog', label: 'Blog images' },
  { value: 'studio', label: 'Studio' },
  { value: 'purpose', label: 'Purpose' },
  { value: 'logo', label: 'Logos' },
  { value: 'other', label: 'Other' },
];

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [remove, setRemove] = useState(null);
  const [folder, setFolder] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [uploadFolder, setUploadFolder] = useState('other');
  const load = () => {
    const qs = new URLSearchParams();
    if (folder !== 'all') qs.set('folder', folder);
    if (q) qs.set('q', q);
    api.get(`/admin/media?${qs}`).then(({ data }) => setMedia(data.media || []));
  };
  useEffect(() => { load(); }, [folder, q]);
  const { slice, total, pages, page: p } = paginate(media, page);

  async function onFile(e, targetId) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', uploadFolder);
      if (targetId) await api.post(`/admin/media/${targetId}/replace`, fd);
      else await uploadAdminMedia(file, uploadFolder);
      toast(targetId ? 'File replaced.' : 'File uploaded.');
      e.target.value = '';
      load();
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Media" subtitle="Images and short videos for products, beads, and testimonials." />
      <AdminToolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search file or tag"
        filters={<FilterSelect value={folder} onChange={setFolder} options={FOLDERS} />}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={`${fieldClass} w-auto`} value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)}>
          {FOLDERS.filter((f) => f.value !== 'all').map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <label className="inline-block">
          <span className="gold-btn inline-flex cursor-pointer rounded-full px-5 py-2.5 text-xs uppercase tracking-widest">
            <span className="gold-cloud">Upload file</span>
          </span>
          <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onFile(e)} />
        </label>
      </div>
      <AdminTable
        rows={slice}
        empty="No files uploaded yet."
        columns={[
          {
            key: 'preview',
            label: 'Preview',
            render: (m) =>
              m.mimeType?.startsWith('video/') ? (
                <video src={mediaUrl(m.url)} className="h-12 w-12 rounded-lg object-cover" muted />
              ) : (
                <img src={mediaUrl(m.url)} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ),
          },
          { key: 'originalName', label: 'File' },
          { key: 'folder', label: 'Folder', render: (m) => m.folder || 'other' },
          { key: 'url', label: 'URL', render: (m) => <span className="break-all text-lilac">{m.url}</span> },
          { key: 'size', label: 'Size', render: (m) => m.size ? `${Math.round(m.size / 1024)} kb` : '—' },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (m) => (
              <div className="flex justify-end gap-2">
                <label className="cursor-pointer rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10">
                  Replace
                  <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => onFile(e, m._id)} />
                </label>
                <RowActions onDelete={() => setRemove(m)} />
              </div>
            ),
          },
        ]}
      />
      <Pagination page={p} pages={pages} onPage={setPage} total={total} pageSize={20} />
      <ConfirmDelete
        open={!!remove}
        title="Delete file"
        body={remove ? `Remove “${remove.originalName}”? Linked products keep the old URL until you replace it.` : ''}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          await api.delete(`/admin/media/${remove._id}`);
          setRemove(null);
          toast('File deleted.');
          load();
        }}
      />
    </div>
  );
}
