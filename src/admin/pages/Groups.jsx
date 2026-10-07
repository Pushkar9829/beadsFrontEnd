import { useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { date } from '../lib/format';
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  FormGrid,
  Input,
  Menu,
  PageHeader,
  Pagination,
  SearchInput,
  Switch,
  Textarea,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { GroupChip } from './people/shared';

const BASE = '/admin/groups';
const INVALIDATE = [BASE, '/admin/customers'];
const EMPTY = { name: '', slug: '', description: '', color: '#C6A75E', isActive: true };
const SWATCHES = ['#C6A75E', '#9B7EDE', '#5FB3A1', '#E07A5F', '#6FA8DC', '#D4A5A5', '#8E9AAF', '#F2CC8F'];

export default function Groups() {
  const [state, set] = useUrlState({ q: '', active: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | 'new' | group
  const confirm = useConfirm();

  const list = useApiList(BASE, { q: state.q, isActive: state.active === 'all' ? undefined : state.active, page: state.page, limit: 25, sort: 'name' }, { key: 'items' });
  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: INVALIDATE, success: 'Group deleted.' });

  const askDelete = async (g) => {
    if (
      await confirm({
        title: `Delete “${g.name}”?`,
        message: 'The group disappears from lists and pickers. Customers already tagged keep the tag on their record until you change their groups.',
        confirmLabel: 'Delete',
        tone: 'danger',
      })
    )
      remove.mutate(g._id);
  };

  const columns = [
    { key: 'name', header: 'Group', render: (g) => <GroupChip group={g} /> },
    { key: 'slug', header: 'Slug', hideBelow: 'sm', render: (g) => <span className="font-mono text-xs text-lilac">{g.slug || '—'}</span> },
    { key: 'description', header: 'Description', hideBelow: 'md', render: (g) => <span className="line-clamp-1 max-w-xs text-lilac">{g.description || '—'}</span> },
    { key: 'isActive', header: 'Status', render: (g) => (g.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    { key: 'createdAt', header: 'Created', hideBelow: 'lg', render: (g) => date(g.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (g) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(g) },
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(g) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Customer groups"
        description="Internal tags you assign on a customer’s profile. They don’t change storefront prices or coupons."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            New group
          </Button>
        }
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search groups…" />
        <FilterSelect
          label="Status"
          value={state.active}
          onChange={(active) => set({ active })}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Hidden' },
          ]}
        />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={UsersRound}
            title={state.q || state.active !== 'all' ? 'No groups match these filters' : 'No customer groups yet'}
            description={state.q || state.active !== 'all' ? undefined : 'Create groups like “Wholesale” or “Influencers”, then tag customers from their profile.'}
            action={
              !state.q && (
                <Button icon={Plus} onClick={() => setEditing('new')}>
                  New group
                </Button>
              )
            }
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <GroupDrawer key={editing?._id || editing || 'none'} group={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function GroupDrawer({ group, onClose }) {
  const isNew = group === 'new';
  const form = useForm(isNew || !group ? EMPTY : { ...EMPTY, ...group });
  const save = useApiMutation(
    (values) => {
      const body = toPayload(values, { nullable: ['description'], omit: ['slug'] });
      // Empty slug → server derives it from the name.
      const slug = values.slug.trim();
      if (slug) body.slug = slug;
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${group._id}`, body);
    },
    {
      invalidate: INVALIDATE,
      success: isNew ? 'Group created.' : 'Group saved.',
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
    if (!form.values.name.trim()) errors.name = 'Name is required.';
    if (form.values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.values.slug.trim())) errors.slug = 'Use lowercase letters, numbers and dashes.';
    if (form.values.color && !/^#[0-9a-f]{6}$/i.test(form.values.color)) errors.color = 'Use a hex colour like #C6A75E.';
    if (Object.keys(errors).length) return form.setErrors(errors);
    save.mutate({ ...form.values, name: form.values.name.trim() });
  };

  return (
    <Drawer
      open={Boolean(group)}
      onClose={onClose}
      dirty={form.dirty}
      width="sm"
      title={isNew ? 'New customer group' : `Edit ${group?.name || 'group'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="group-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create group' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="group-form" onSubmit={submit} className="space-y-5">
        <Field label="Name" required error={form.errors.name}>
          {({ id }) => <Input id={id} {...form.bind('name')} placeholder="e.g. Wholesale" autoFocus />}
        </Field>
        <Field label="Slug" error={form.errors.slug} hint={isNew ? 'Leave blank to create it from the name.' : 'Used in exports and integrations.'}>
          {({ id }) => <Input id={id} {...form.bind('slug')} placeholder="wholesale" className="font-mono" />}
        </Field>
        <Field label="Description">{({ id }) => <Textarea id={id} rows={3} {...form.bind('description')} placeholder="Who belongs here and why" />}</Field>
        <Field label="Colour" error={form.errors.color}>
          {({ id }) => (
            <div className="space-y-2">
              <FormGrid>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick colour"
                    value={/^#[0-9a-f]{6}$/i.test(form.values.color) ? form.values.color : '#C6A75E'}
                    onChange={(e) => form.set('color', e.target.value.toUpperCase())}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-raised p-1"
                  />
                  <Input id={id} {...form.bind('color')} className="font-mono" />
                </div>
              </FormGrid>
              <div className="flex flex-wrap gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use ${c}`}
                    onClick={() => form.set('color', c)}
                    className="h-6 w-6 rounded-full ring-1 ring-white/15 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="pt-1">
                <GroupChip group={{ name: form.values.name || 'Preview', color: form.values.color }} />
              </div>
            </div>
          )}
        </Field>
        <Switch label="Active" description="Hidden groups stay on customer records but are marked as hidden." checked={form.values.isActive !== false} onChange={(v) => form.set('isActive', v)} />
      </form>
    </Drawer>
  );
}
