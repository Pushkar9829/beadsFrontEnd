import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader, { RowActions } from '../../components/admin/AdminHeader';
import ConfirmDelete from '../../components/admin/ConfirmDelete';
import { toast } from '../../lib/adminToast';

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [remove, setRemove] = useState(null);
  const load = () => api.get('/admin/media').then(({ data }) => setMedia(data.media || []));
  useEffect(() => { load(); }, []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/admin/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('File uploaded.');
      e.target.value = '';
      load();
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Media" subtitle="Images and short videos for products, beads, and testimonials." />
      <div className="mb-4">
        <label className="inline-block">
          <span className="gold-btn inline-flex cursor-pointer rounded-full px-5 py-2.5 text-xs uppercase tracking-widest">
            <span className="gold-cloud">Upload file</span>
          </span>
          <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onFile} />
        </label>
      </div>
      <AdminTable
        rows={media}
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
          { key: 'url', label: 'URL', render: (m) => <span className="break-all text-lilac">{m.url}</span> },
          { key: 'size', label: 'Size', render: (m) => m.size ? `${Math.round(m.size / 1024)} kb` : '—' },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (m) => <RowActions onDelete={() => setRemove(m)} />,
          },
        ]}
      />
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
