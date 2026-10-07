// Reference implementation for a simple CRUD screen: URL-synced list + drawer form.
import { useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { apiSend, toPayload, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
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
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Switch,
  TagInput,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';

const BASE = '/admin/attributes';
const EMPTY = { name: '', type: 'text', options: [], appliesTo: 'product', sortOrder: 0, isActive: true };
const TYPES = [
  { value: 'text', label: 'Free text' },
  { value: 'select', label: 'Choice list' },
];
const APPLIES = [
  { value: 'product', label: 'Products' },
  { value: 'bead', label: 'Beads' },
  { value: 'both', label: 'Products & beads' },
];

export default function Attributes() {
  const [state, set] = useUrlState({ q: '', active: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | 'new' | attribute
  const confirm = useConfirm();

  const list = useApiList(BASE, { q: state.q, isActive: state.active === 'all' ? undefined : state.active, page: state.page, limit: 25, sort: 'sortOrder' }, { key: 'items' });

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: [BASE], success: 'Attribute deleted.' });

  const columns = [
    { key: 'name', header: 'Name', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'type', header: 'Type', render: (a) => (a.type === 'select' ? `Choice (${a.options?.length || 0})` : 'Free text') },
    { key: 'appliesTo', header: 'Applies to', hideBelow: 'md', render: (a) => APPLIES.find((x) => x.value === a.appliesTo)?.label || a.appliesTo },
    { key: 'isActive', header: 'Status', render: (a) => (a.isActive === false ? <Badge>Hidden</Badge> : <Badge tone="success">Active</Badge>) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(a) },
            {
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              onClick: async () => {
                if (await confirm({ title: `Delete “${a.name}”?`, message: 'Products keep any values already saved for this attribute.', confirmLabel: 'Delete', tone: 'danger' })) remove.mutate(a._id);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Attributes"
        description="Extra product and bead properties shown on the storefront, like origin or chakra."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            New attribute
          </Button>
        }
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search attributes…" />
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
            icon={Tags}
            title={state.q ? 'No attributes match your search' : 'No attributes yet'}
            action={!state.q && <Button icon={Plus} onClick={() => setEditing('new')}>New attribute</Button>}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <AttributeDrawer key={editing?._id || editing || 'none'} attribute={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function AttributeDrawer({ attribute, onClose }) {
  const isNew = attribute === 'new';
  const form = useForm(isNew || !attribute ? EMPTY : { ...EMPTY, ...attribute });
  const save = useApiMutation(
    (values) => {
      const body = toPayload(values, { numbers: ['sortOrder'] });
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${attribute._id}`, body);
    },
    {
      invalidate: [BASE],
      success: isNew ? 'Attribute created.' : 'Attribute saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );
  const submit = (e) => {
    e.preventDefault();
    if (!form.values.name.trim()) return form.setErrors({ name: 'Name is required.' });
    save.mutate(form.values);
  };

  return (
    <Drawer
      open={Boolean(attribute)}
      onClose={onClose}
      dirty={form.dirty}
      title={isNew ? 'New attribute' : `Edit ${attribute?.name || 'attribute'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="attribute-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create attribute' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="attribute-form" onSubmit={submit} className="space-y-5">
        <Field label="Name" required error={form.errors.name}>
          {({ id }) => <Input id={id} {...form.bind('name')} placeholder="e.g. Origin" autoFocus />}
        </Field>
        <FormGrid>
          <Field label="Type">{({ id }) => <Select id={id} options={TYPES} {...form.bind('type')} />}</Field>
          <Field label="Applies to">{({ id }) => <Select id={id} options={APPLIES} {...form.bind('appliesTo')} />}</Field>
        </FormGrid>
        {form.values.type === 'select' && (
          <Field label="Choices" hint="Press Enter after each choice.">
            <TagInput value={form.values.options || []} onChange={(v) => form.set('options', v)} />
          </Field>
        )}
        <FormGrid>
          <Field label="Sort order" hint="Lower numbers show first.">
            {({ id }) => <NumberInput id={id} value={form.values.sortOrder} onChange={(v) => form.set('sortOrder', v)} />}
          </Field>
        </FormGrid>
        <Switch label="Active" description="Hidden attributes are not shown on the storefront." checked={form.values.isActive !== false} onChange={(v) => form.set('isActive', v)} />
      </form>
    </Drawer>
  );
}
