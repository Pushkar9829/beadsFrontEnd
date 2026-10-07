import { useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import {
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  FormGrid,
  IconButton,
  Input,
  Menu,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Switch,
  Textarea,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';

const BASE = '/admin/faqs';
const LIMIT = 100;
const EMPTY = { question: '', answer: '', sortOrder: 0, isActive: true };

export default function Faqs() {
  const [state, set] = useUrlState({ q: '', active: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | 'new' | faq
  const confirm = useConfirm();

  const list = useApiList(
    BASE,
    { q: state.q, isActive: state.active === 'all' ? undefined : state.active, page: state.page, limit: LIMIT, sort: 'sortOrder' },
    { key: 'items' }
  );
  const rows = list.rows;
  // Reordering renumbers the whole list, so it is only offered when the full list is on screen.
  const canReorder = !state.q && state.active === 'all' && list.pagination.pages <= 1 && rows.length > 1;

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: [BASE], success: 'Question deleted.' });
  const toggle = useApiMutation(({ id, isActive }) => apiSend('put', `${BASE}/${id}`, { isActive }), {
    invalidate: [BASE],
    success: (_d, v) => (v.isActive ? 'Question shown on the storefront.' : 'Question hidden.'),
  });
  const reorder = useApiMutation(
    async (ordered) => {
      const changes = ordered.map((f, i) => ({ id: f._id, sortOrder: (i + 1) * 10, old: f.sortOrder })).filter((c) => c.sortOrder !== c.old);
      for (const c of changes) await apiSend('put', `${BASE}/${c.id}`, { sortOrder: c.sortOrder });
    },
    { invalidate: [BASE], success: 'Order saved.' }
  );
  const move = (from, to) => {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    reorder.mutate(next);
  };

  const askDelete = async (f) => {
    const ok = await confirm({ title: 'Delete this question?', message: `“${f.question}” is removed from the storefront FAQ. This cannot be undone.`, confirmLabel: 'Delete', tone: 'danger' });
    if (ok) remove.mutate(f._id);
    return ok;
  };

  const columns = [
    ...(canReorder
      ? [
          {
            key: 'order',
            header: 'Order',
            width: 88,
            render: (f) => {
              const i = rows.indexOf(f);
              return (
                <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <IconButton icon={ArrowUp} size="sm" label="Move up" disabled={i === 0 || reorder.isPending} onClick={() => move(i, i - 1)} />
                  <IconButton icon={ArrowDown} size="sm" label="Move down" disabled={i === rows.length - 1 || reorder.isPending} onClick={() => move(i, i + 1)} />
                </div>
              );
            },
          },
        ]
      : []),
    {
      key: 'question',
      header: 'Question',
      render: (f) => (
        <div className="min-w-0 max-w-xl">
          <p className="font-medium">{f.question}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-lilac">{f.answer}</p>
        </div>
      ),
    },
    { key: 'sortOrder', header: 'Sort', hideBelow: 'md', render: (f) => <span className="tabular-nums text-lilac">{f.sortOrder ?? 0}</span> },
    {
      key: 'isActive',
      header: 'Shown',
      render: (f) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={f.isActive !== false} disabled={toggle.isPending} onChange={(isActive) => toggle.mutate({ id: f._id, isActive })} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (f) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(f) },
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(f) },
          ]}
        />
      ),
    },
  ];

  const nextSort = rows.reduce((m, f) => Math.max(m, Number(f.sortOrder) || 0), 0) + 10;

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions shown on the home page and the FAQ page, in this order."
        actions={
          <>
            <a href="/faq" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-lilac hover:text-gold">
              <ExternalLink size={14} /> View FAQ page
            </a>
            <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
              New question
            </Button>
          </>
        }
      />
      <Toolbar right={!canReorder && rows.length > 1 && <span className="text-xs text-lilac">Clear search and filters to reorder.</span>}>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search questions…" />
        <FilterSelect
          label="Status"
          value={state.active}
          onChange={(active) => set({ active })}
          options={[
            { value: 'all', label: 'All questions' },
            { value: 'true', label: 'Shown' },
            { value: 'false', label: 'Hidden' },
          ]}
        />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={list.isLoading}
        fetching={list.isFetching || reorder.isPending}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={HelpCircle}
            title={state.q || state.active !== 'all' ? 'No questions match' : 'No questions yet'}
            description={state.q || state.active !== 'all' ? 'Try another search or filter.' : 'Answer the questions customers ask most often.'}
            action={!state.q && state.active === 'all' && <Button icon={Plus} onClick={() => setEditing('new')}>New question</Button>}
          />
        }
        footer={list.pagination.pages > 1 && <Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <FaqDrawer key={editing?._id || editing || 'none'} faq={editing} nextSort={nextSort} onClose={() => setEditing(null)} onDelete={askDelete} />
    </>
  );
}

function FaqDrawer({ faq, nextSort, onClose, onDelete }) {
  const isNew = faq === 'new';
  const form = useForm(isNew || !faq ? { ...EMPTY, sortOrder: nextSort } : { ...EMPTY, ...faq });
  const save = useApiMutation(
    (values) => {
      const body = toPayload(values, { numbers: ['sortOrder'] });
      if (body.sortOrder === '') body.sortOrder = 0;
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${faq._id}`, body);
    },
    {
      invalidate: [BASE],
      success: isNew ? 'Question added.' : 'Question saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );
  const submit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.values.question.trim()) errors.question = 'Question is required.';
    if (!String(form.values.answer || '').trim()) errors.answer = 'Answer is required.';
    if (Object.keys(errors).length) return form.setErrors(errors);
    save.mutate({ ...form.values, question: form.values.question.trim() });
  };

  return (
    <Drawer
      open={Boolean(faq)}
      onClose={onClose}
      dirty={form.dirty}
      title={isNew ? 'New question' : 'Edit question'}
      footer={
        <>
          {!isNew && (
            <Button variant="danger" icon={Trash2} className="mr-auto" onClick={async () => (await onDelete(faq)) && onClose()}>
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="faq-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Add question' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="faq-form" onSubmit={submit} className="space-y-5">
        <Field label="Question" required error={form.errors.question}>
          {({ id }) => <Input id={id} {...form.bind('question')} autoFocus placeholder="e.g. How long does delivery take?" />}
        </Field>
        <Field label="Answer" required error={form.errors.answer} hint="Plain text, shown as one paragraph.">
          {({ id }) => <Textarea id={id} rows={7} {...form.bind('answer')} />}
        </Field>
        <FormGrid>
          <Field label="Sort order" hint="Lower numbers show first.">
            {({ id }) => <NumberInput id={id} value={form.values.sortOrder} onChange={(v) => form.set('sortOrder', v)} />}
          </Field>
        </FormGrid>
        <Switch label="Shown on the storefront" description="Hidden questions stay here but are not published." checked={form.values.isActive !== false} onChange={(v) => form.set('isActive', v)} />
      </form>
    </Drawer>
  );
}
