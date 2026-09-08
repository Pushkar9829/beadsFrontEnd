import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../api/client';
import AdminTable from '../../components/admin/AdminTable';
import AdminHeader from '../../components/admin/AdminHeader';

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const load = () => api.get('/admin/media').then(({ data }) => setMedia(data.media || []));
  useEffect(() => { load(); }, []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/admin/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    e.target.value = '';
    load();
  }

  return (
    <div>
      <AdminHeader title="Media" subtitle="Local uploads for product and bead imagery." />
      <div className="mb-4">
        <label className="inline-block">
          <span className="gold-btn inline-flex cursor-pointer rounded-full px-5 py-2.5 text-xs uppercase tracking-widest">
            <span className="gold-cloud">Upload image</span>
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      </div>
      <AdminTable
        rows={media}
        empty="No files uploaded yet."
        columns={[
          {
            key: 'preview',
            label: 'Preview',
            render: (m) => <img src={mediaUrl(m.url)} alt="" className="h-12 w-12 rounded-lg object-cover" />,
          },
          { key: 'originalName', label: 'File' },
          { key: 'url', label: 'URL', render: (m) => <span className="break-all text-lilac">{m.url}</span> },
          { key: 'size', label: 'Size', render: (m) => m.size ? `${Math.round(m.size / 1024)} kb` : '—' },
        ]}
      />
    </div>
  );
}
