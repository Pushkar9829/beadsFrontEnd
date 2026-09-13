import AdminCrud, { fieldClass, labelClass } from './AdminCrud';

const empty = { question: '', answer: '', sortOrder: 0, isActive: true };

export default function AdminFaqs() {
  return (
    <AdminCrud
      title="FAQs"
      subtitle="Shown on the homepage and /faq."
      endpoint="/admin/faqs"
      createLabel="Add FAQ"
      searchKey="question"
      emptyForm={empty}
      columns={[
        { key: 'question', label: 'Question', render: (r) => <span className="font-medium">{r.question}</span> },
        { key: 'isActive', label: 'Status', render: (r) => (r.isActive ? 'Active' : 'Hidden') },
      ]}
      fields={({ form, setForm }) => (
        <>
          <label className={labelClass}>Question<input required className={`${fieldClass} mt-1`} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
          <label className={labelClass}>Answer<textarea required className={`${fieldClass} mt-1`} rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></label>
          <label className={labelClass}>Sort<input type="number" className={`${fieldClass} mt-1`} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
          <label className="flex items-center gap-2 text-sm text-lilac"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </>
      )}
    />
  );
}
