import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Pencil, ShieldCheck, UserPlus, Users as UsersIcon } from 'lucide-react';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { date, dateTime, relative } from '../lib/format';
import { ROLE_LABELS, STAFF_ROLES, usePermissions } from '../lib/permissions';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FormGrid,
  FormSection,
  Input,
  Menu,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  Switch,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';

const BASE = '/admin/users';
const INVALIDATE = [BASE, '/admin/customers'];

const FILTERS = [
  { value: 'staff', label: 'Team' },
  { value: 'admin', label: 'Admins' },
  { value: 'manager', label: 'Managers' },
  { value: 'customer', label: 'Customers' },
];

const ROLE_TONE = { admin: 'gold', manager: 'accent', staff: 'info', customer: 'neutral' };
const ROLE_HELP = {
  admin: 'Full access, including store settings, payment keys and team access.',
  manager: 'Runs the store day to day. Cannot change settings or team access.',
  staff: 'Runs the store day to day. Cannot change settings or team access.',
  customer: 'Storefront only. No admin access.',
};

const selfId = (user) => String(user?._id || user?.id || '');

export default function Users() {
  const navigate = useNavigate();
  const { isAdmin, user } = usePermissions();
  const [state, set] = useUrlState({ role: 'staff', q: '', page: 1 });
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const list = useApiList(BASE, { role: state.role, q: state.q, page: state.page, limit: 25 }, { key: 'users' });
  const me = selfId(user);

  const columns = [
    {
      key: 'name',
      header: 'Person',
      render: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={u.name || u.phone} size={30} />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {u.name || 'Unnamed'}
              {String(u._id) === me && <span className="ml-1.5 text-xs font-normal text-lilac">(you)</span>}
            </p>
            <p className="truncate text-xs text-lilac">{u.phone || u.email || 'No number'}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role] || u.role}</Badge> },
    { key: 'isActive', header: 'Status', render: (u) => (u.isActive === false ? <Badge tone="danger" dot>Disabled</Badge> : <Badge tone="success" dot>Active</Badge>) },
    {
      key: 'lastLoginAt',
      header: 'Last sign-in',
      hideBelow: 'sm',
      render: (u) => (u.lastLoginAt ? <span title={dateTime(u.lastLoginAt)}>{relative(u.lastLoginAt)}</span> : <span className="text-lilac/60">Never</span>),
    },
    { key: 'createdAt', header: 'Joined', hideBelow: 'md', render: (u) => date(u.createdAt) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(u) },
            { label: 'Customer profile', icon: ExternalLink, hidden: u.role !== 'customer', onClick: () => navigate(`/admin/customers/${u._id}`) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Team & users"
        description="Who can sign in to the admin, and what they can do. Storefront and admin share the same accounts."
        actions={
          isAdmin && (
            <Button variant="primary" icon={UserPlus} onClick={() => setCreating(true)}>
              Add team member
            </Button>
          )
        }
      />
      {!isAdmin && (
        <Card className="mb-4 flex items-start gap-3 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm text-lilac">You can update names. Only admins can add people, change sign-in numbers or roles, and disable accounts.</p>
        </Card>
      )}
      <Segmented className="mb-3 w-fit" items={FILTERS} value={state.role} onChange={(role) => set({ role })} />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Name or number…" />
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
            icon={UsersIcon}
            title={state.q ? 'Nobody matches your search' : 'Nobody here yet'}
            action={
              isAdmin &&
              !state.q &&
              state.role !== 'customer' && (
                <Button icon={UserPlus} onClick={() => setCreating(true)}>
                  Add team member
                </Button>
              )
            }
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      {isAdmin && <CreateDrawer key={creating ? 'open' : 'closed'} open={creating} onClose={() => setCreating(false)} />}
      <EditDrawer key={editing?._id || 'none'} target={editing} me={me} isAdmin={isAdmin} onClose={() => setEditing(null)} />
    </>
  );
}

function CreateDrawer({ open, onClose }) {
  const form = useForm({ name: '', phone: '', role: 'staff' });
  const create = useApiMutation((body) => apiSend('post', BASE, body), {
    invalidate: [BASE],
    success: 'Team member added. They sign in with a WhatsApp code sent to this number.',
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => {
      if (info.status === 409 || info.status === 400) form.setErrors({ phone: info.message });
      else form.setServerErrors(info.fields);
    },
  });
  const submit = (e) => {
    e.preventDefault();
    const v = form.values;
    const errors = {};
    if (!v.name.trim()) errors.name = 'Name is required.';
    if (v.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter their WhatsApp number, e.g. +91 98xxxxxxxx.';
    if (Object.keys(errors).length) return form.setErrors(errors);
    create.mutate({ name: v.name.trim(), phone: v.phone.trim(), role: v.role });
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      width="sm"
      title="Add team member"
      description="They sign in on the normal Sign in page with a WhatsApp code sent to this number. No password."
      footer={
        <>
          <Button variant="ghost" data-dismiss onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-user-form" loading={create.isPending}>
            Add team member
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={submit} className="space-y-5" autoComplete="off" noValidate>
        <Field label="Name" required error={form.errors.name}>
          {({ id }) => <Input id={id} {...form.bind('name')} autoFocus />}
        </Field>
        <Field label="WhatsApp number" required error={form.errors.phone} hint="Country code first for numbers outside India.">
          {({ id }) => <Input id={id} type="tel" inputMode="tel" placeholder="+91 98xxxxxxxx" autoComplete="off" {...form.bind('phone')} />}
        </Field>
        <Field label="Role" hint={ROLE_HELP[form.values.role]}>
          {({ id }) => <Select id={id} options={STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} {...form.bind('role')} />}
        </Field>
      </form>
    </Drawer>
  );
}

function EditDrawer({ target, me, isAdmin, onClose }) {
  const confirm = useConfirm();
  const isSelf = target && String(target._id) === me;
  const initial = target ? { name: target.name || '', phone: target.phone || '', role: target.role, isActive: target.isActive !== false } : { name: '', phone: '', role: 'customer', isActive: true };
  const form = useForm(initial);
  const canEditBasics = isAdmin || target?.role !== 'admin';

  const save = useApiMutation((body) => apiSend('put', `${BASE}/${target._id}`, body), {
    invalidate: INVALIDATE,
    success: 'User saved.',
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => (info.message && /number/i.test(info.message) ? form.setErrors({ phone: info.message }) : form.setServerErrors(info.fields)),
  });

  const submit = async (e) => {
    e.preventDefault();
    const v = form.values;
    const name = v.name.trim();
    if (!name) return form.setErrors({ name: 'Name is required.' });
    // Send only what changed, so non-admins never send role/status fields the API would refuse.
    const body = {};
    if (name !== initial.name) body.name = name;
    if (v.phone.trim() !== initial.phone) body.phone = v.phone.trim();
    if (isAdmin && !isSelf) {
      if (v.role !== initial.role) body.role = v.role;
      if (v.isActive !== initial.isActive) body.isActive = v.isActive;
    }
    if (!Object.keys(body).length) return onClose();
    if (body.role || body.isActive !== undefined) {
      const lines = [];
      if (body.role) lines.push(`Role changes from ${ROLE_LABELS[initial.role]} to ${ROLE_LABELS[body.role]}.`);
      if (body.isActive === false) lines.push('They will not be able to sign in until re-enabled.');
      if (body.isActive === true) lines.push('They will be able to sign in again.');
      lines.push('They are signed out everywhere and must sign in again.');
      const ok = await confirm({
        title: `Change access for ${target.name || target.phone}?`,
        message: lines.join(' '),
        confirmLabel: 'Change access',
        tone: body.isActive === false || (body.role && STAFF_ROLES.includes(initial.role) && body.role === 'customer') ? 'danger' : undefined,
      });
      if (!ok) return;
    }
    save.mutate(body);
  };

  return (
    <Drawer
      open={Boolean(target)}
      onClose={onClose}
      dirty={form.dirty}
      title={target ? target.name || target.phone : 'User'}
      description={target?.phone ? `Signs in with WhatsApp ${target.phone}` : 'No WhatsApp number yet: cannot sign in'}
      footer={
        <>
          <Button variant="ghost" data-dismiss onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="edit-user-form" loading={save.isPending} disabled={!form.dirty || !canEditBasics}>
            Save changes
          </Button>
        </>
      }
    >
      {target && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 text-xs text-lilac">
            <Badge tone={ROLE_TONE[target.role]}>{ROLE_LABELS[target.role] || target.role}</Badge>
            {target.isActive === false ? <Badge tone="danger">Disabled</Badge> : <Badge tone="success">Active</Badge>}
            <span>Last sign-in: {target.lastLoginAt ? dateTime(target.lastLoginAt) : 'never'}</span>
            <span>· Joined {date(target.createdAt)}</span>
          </div>

          <form id="edit-user-form" onSubmit={submit} className="space-y-6">
            <FormSection title="Profile">
              {!canEditBasics && <p className="text-xs text-amber-200">Only admins can edit admin accounts.</p>}
              <FormGrid>
                <Field label="Name" required error={form.errors.name}>
                  {({ id }) => <Input id={id} {...form.bind('name')} disabled={!canEditBasics} />}
                </Field>
                <Field label="WhatsApp number (sign-in)" error={form.errors.phone} hint={isAdmin ? 'Changing it moves who can sign in to this account.' : 'Only admins can change it.'}>
                  {({ id }) => <Input id={id} type="tel" {...form.bind('phone')} disabled={!isAdmin} />}
                </Field>
              </FormGrid>
            </FormSection>

            {isAdmin && (
              <FormSection title="Access" description={isSelf ? 'You can’t change your own role or disable your own account. Ask another admin.' : 'Changing role or status signs this person out everywhere.'}>
                <Field label="Role" hint={ROLE_HELP[form.values.role]}>
                  {({ id }) => (
                    <Select id={id} options={['admin', 'manager', 'staff', 'customer'].map((r) => ({ value: r, label: ROLE_LABELS[r] }))} {...form.bind('role')} disabled={isSelf} />
                  )}
                </Field>
                <Switch
                  label="Account active"
                  description={isSelf ? 'This is your account.' : 'Disabled accounts cannot sign in to the store or the admin.'}
                  checked={form.values.isActive}
                  disabled={isSelf}
                  onChange={(v) => form.set('isActive', v)}
                />
              </FormSection>
            )}
          </form>

          {!isAdmin && <p className="text-xs text-lilac">Only admins can change sign-in numbers, roles or account status.</p>}
        </div>
      )}
    </Drawer>
  );
}
