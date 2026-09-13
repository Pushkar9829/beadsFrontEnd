import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminHeader, { fieldClass, labelClass } from '../../components/admin/AdminHeader';
import { toast } from '../../lib/adminToast';
import { useContentStore } from '../../store/contentStore';
import { mergeHomeLayout } from '../../lib/homeContent';

export default function AdminHomeLayout() {
  const loadContent = useContentStore((s) => s.load);
  const [content, setContent] = useState(null);
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    api.get('/admin/content').then(({ data }) => {
      setContent(data.content);
      setLayout(mergeHomeLayout(data.content?.homeLayout));
    });
  }, []);

  function move(i, dir) {
    const next = [...layout];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next.map((s, idx) => ({ ...s, sortOrder: idx })));
  }

  async function save() {
    try {
      await api.put('/admin/content', { ...content, homeLayout: layout });
      toast('Homepage layout saved.');
      loadContent();
    } catch (err) {
      toast(err.message || 'Could not save.', 'error');
    }
  }

  return (
    <div>
      <AdminHeader title="Homepage builder" subtitle="Reorder, hide, and schedule home sections. Copy for each block still lives in Site CMS." />
      <div className="space-y-2">
        {layout.map((section, i) => (
          <div key={section.key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/20 bg-surface px-4 py-3">
            <div className="flex gap-1">
              <button type="button" className="text-gold disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="text-gold disabled:opacity-30" disabled={i === layout.length - 1} onClick={() => move(i, 1)}>↓</button>
            </div>
            <div className="min-w-[10rem] font-medium">{section.label || section.key}</div>
            <label className="flex items-center gap-2 text-xs text-lilac">
              <input type="checkbox" checked={section.enabled !== false} onChange={(e) => {
                const next = [...layout];
                next[i] = { ...section, enabled: e.target.checked };
                setLayout(next);
              }} />
              Visible
            </label>
            <label className={labelClass}>
              From
              <input type="datetime-local" className={`${fieldClass} mt-1 w-auto`} value={(section.startsAt || '').toString().slice(0, 16)} onChange={(e) => {
                const next = [...layout];
                next[i] = { ...section, startsAt: e.target.value };
                setLayout(next);
              }} />
            </label>
            <label className={labelClass}>
              Until
              <input type="datetime-local" className={`${fieldClass} mt-1 w-auto`} value={(section.endsAt || '').toString().slice(0, 16)} onChange={(e) => {
                const next = [...layout];
                next[i] = { ...section, endsAt: e.target.value };
                setLayout(next);
              }} />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-6"><Button onClick={save}>Save layout</Button></div>
    </div>
  );
}
