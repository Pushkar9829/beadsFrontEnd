import { useEffect, useState } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import AdminTable from '../../components/admin/AdminTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import AdminHeader, { RowActions, fieldClass, labelClass } from '../../components/admin/AdminHeader';

export default function AdminContent() {
  const [content, setContent] = useState(null);
  const [section, setSection] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    api.get('/admin/content').then(({ data }) => setContent(data.content || { hero: {}, about: {}, trustClaims: [] }));
  }, []);

  if (!content) return null;

  const rows = [
    { key: 'hero', label: 'Hero', preview: content.hero?.title || '—' },
    { key: 'about', label: 'About', preview: content.about?.headline || '—' },
    { key: 'trust', label: 'Trust claims', preview: `${(content.trustClaims || []).length} claims` },
  ];

  function open(key) {
    setSection(key);
    if (key === 'hero') setDraft({ ...content.hero });
    if (key === 'about') setDraft({ ...content.about });
    if (key === 'trust') setDraft([...(content.trustClaims || [])]);
  }

  async function save(e) {
    e.preventDefault();
    const next = { ...content };
    if (section === 'hero') next.hero = draft;
    if (section === 'about') next.about = draft;
    if (section === 'trust') next.trustClaims = draft;
    const { data } = await api.put('/admin/content', next);
    setContent(data.content);
    setSection(null);
  }

  return (
    <div>
      <AdminHeader title="Site content" subtitle="Only publish claims the business can substantiate." />
      <AdminTable
        rows={rows}
        rowKey={(r) => r.key}
        columns={[
          { key: 'label', label: 'Section' },
          { key: 'preview', label: 'Preview' },
          { key: 'actions', label: 'Actions', align: 'right', render: (r) => <RowActions onEdit={() => open(r.key)} /> },
        ]}
      />
      <AdminDrawer
        open={!!section}
        title={section === 'hero' ? 'Edit hero' : section === 'about' ? 'Edit about' : 'Edit trust claims'}
        onClose={() => setSection(null)}
      >
        <form onSubmit={save} className="space-y-3">
          {section === 'hero' && draft && ['eyebrow', 'title', 'subtitle'].map((k) => (
            <label key={k} className={labelClass}>{k}
              <input className={`${fieldClass} mt-1`} value={draft[k] || ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
            </label>
          ))}
          {section === 'about' && draft && (
            <>
              <label className={labelClass}>Headline<input className={`${fieldClass} mt-1`} value={draft.headline || ''} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} /></label>
              <label className={labelClass}>Tagline<input className={`${fieldClass} mt-1`} value={draft.tagline || ''} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} /></label>
              <label className={labelClass}>Body<textarea rows={8} className={`${fieldClass} mt-1`} value={draft.body || ''} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
            </>
          )}
          {section === 'trust' && Array.isArray(draft) && (
            <>
              {draft.map((c, i) => (
                <div key={i} className="space-y-2 rounded-xl p-3 gold-border">
                  <input className={fieldClass} value={c.title} onChange={(e) => {
                    const next = [...draft];
                    next[i] = { ...c, title: e.target.value };
                    setDraft(next);
                  }} />
                  <textarea className={fieldClass} value={c.body} onChange={(e) => {
                    const next = [...draft];
                    next[i] = { ...c, body: e.target.value };
                    setDraft(next);
                  }} />
                  <button type="button" className="text-xs text-red-300" onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}>Remove</button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setDraft([...draft, { title: '', body: '' }])}>Add claim</Button>
            </>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save</Button>
            <Button variant="ghost" onClick={() => setSection(null)}>Cancel</Button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  );
}
