import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Mail, MapPin, Package, Pencil, Phone, ShoppingBag, Tag, UserX, Wallet } from 'lucide-react';
import { apiSend, errorInfo, toPayload, useApiList, useApiMutation, useApiQuery } from '../lib/query';
import { date, dateTime, money, number, plural, relative } from '../lib/format';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../lib/status';
import { ROLE_LABELS, usePermissions } from '../lib/permissions';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  Input,
  PageHeader,
  Pagination,
  Skeleton,
  Stat,
  StatusBadge,
  useForm,
} from '../ui';
import { GroupChip } from './people/shared';

const ORDERS_PER_PAGE = 10;

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [orderPage, setOrderPage] = useState(1);

  const profile = useApiQuery(`/admin/customers/${id}`, undefined, { keepPrevious: false });
  const data = profile.data;
  const customer = data?.customer;
  const orders = useMemo(() => data?.orders || [], [data]);

  if (profile.isLoading) return <DetailSkeleton />;
  if (profile.error) {
    const notFound = errorInfo(profile.error).status === 404;
    return (
      <>
        <PageHeader title={notFound ? 'Customer not found' : 'Customer'} back={{ to: '/admin/customers', label: 'Customers' }} />
        <Card padded={false}>
          {notFound ? (
            <EmptyState
              icon={UserX}
              title="This customer does not exist"
              description="The account may have been removed, or the link is wrong."
              action={
                <Button size="sm" onClick={() => navigate('/admin/customers')}>
                  Back to customers
                </Button>
              }
            />
          ) : (
            <ErrorState error={profile.error} onRetry={profile.refetch} />
          )}
        </Card>
      </>
    );
  }
  if (!customer) return null;

  const canEdit = isAdmin || customer.role !== 'admin';
  const pagedOrders = orders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);
  const addresses = customer.addresses || [];
  const cartItems = data.cart?.items || [];
  const wishlist = data.wishlist?.items || data.wishlist || customer.wishlist || [];

  const orderColumns = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (o) => (
        <Link to={`/admin/orders/${o._id}`} className="font-medium text-gold hover:text-gold-light" onClick={(e) => e.stopPropagation()}>
          #{o.orderNumber || String(o._id).slice(-6)}
        </Link>
      ),
    },
    { key: 'createdAt', header: 'Placed', render: (o) => <span title={dateTime(o.createdAt)}>{date(o.createdAt)}</span> },
    { key: 'items', header: 'Items', hideBelow: 'md', align: 'right', render: (o) => number((o.items || []).reduce((s, i) => s + (i.quantity || 1), 0)) },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge meta={ORDER_STATUS_META} value={o.status} /> },
    { key: 'payment', header: 'Payment', hideBelow: 'sm', render: (o) => <StatusBadge meta={PAYMENT_STATUS_META} value={o.payment?.status} /> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="tabular-nums">{money(o.total)}</span> },
  ];

  return (
    <>
      <PageHeader
        back={{ to: '/admin/customers', label: 'Customers' }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={customer.name || customer.email} size={36} />
            {customer.name || 'Unnamed customer'}
          </span>
        }
        meta={
          <>
            {customer.role && customer.role !== 'customer' && <Badge tone="accent">{ROLE_LABELS[customer.role] || customer.role}</Badge>}
            {customer.isActive === false && <Badge tone="danger">Disabled</Badge>}
          </>
        }
        description={`Customer since ${date(customer.createdAt)}`}
        actions={
          <>
            {customer.email && (
              <Button icon={Mail} onClick={() => (window.location.href = `mailto:${customer.email}`)}>
                Email
              </Button>
            )}
            <Button icon={Pencil} disabled={!canEdit} title={canEdit ? undefined : 'Only admins can edit admin accounts.'} onClick={() => setEditing(true)}>
              Edit details
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders" value={number(customer.orders)} icon={ShoppingBag} />
        <Stat label="Total spent" value={money(customer.spent)} icon={Wallet} tone="green" />
        <Stat label="Average order" value={customer.orders ? money(customer.aov) : '—'} icon={Package} tone="violet" />
        <Stat label="Last order" value={customer.lastOrder ? relative(customer.lastOrder) : 'Never'} hint={customer.lastOrder ? date(customer.lastOrder) : undefined} tone="sky" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ivory">Orders</h3>
            <DataTable
              columns={orderColumns}
              rows={pagedOrders}
              onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
              empty={<EmptyState icon={ShoppingBag} title="No orders yet" description="Orders placed with this account will show here." />}
              footer={
                orders.length > ORDERS_PER_PAGE && (
                  <Pagination
                    pagination={{ page: orderPage, limit: ORDERS_PER_PAGE, total: orders.length, pages: Math.ceil(orders.length / ORDERS_PER_PAGE) }}
                    onPage={setOrderPage}
                  />
                )
              }
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader title="Most purchased" />
              {data.topProducts?.length ? (
                <ul className="space-y-2">
                  {data.topProducts.map((p) => (
                    <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-ivory">{p.name}</span>
                      <span className="shrink-0 tabular-nums text-lilac">× {number(p.qty)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-lilac">Nothing purchased yet.</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Coupons used" />
              {data.couponsUsed?.length ? (
                <ul className="space-y-2">
                  {data.couponsUsed.slice(0, 12).map((c) => (
                    <li key={c._id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-mono text-ivory">
                        <Tag size={12} className="text-gold" />
                        {c.code}
                      </span>
                      <span className="shrink-0 text-xs text-lilac">
                        −{money(c.discount)} · {date(c.createdAt)}
                      </span>
                    </li>
                  ))}
                  {data.couponsUsed.length > 12 && <li className="text-xs text-lilac">and {plural(data.couponsUsed.length - 12, 'more use')}</li>}
                </ul>
              ) : (
                <p className="text-sm text-lilac">No coupons used.</p>
              )}
            </Card>
          </div>

          {(cartItems.length > 0 || wishlist.length > 0) && (
            <div className="grid gap-5 md:grid-cols-2">
              {cartItems.length > 0 && (
                <Card>
                  <CardHeader title="In cart now" />
                  <ul className="space-y-2 text-sm">
                    {cartItems.map((i, idx) => (
                      <li key={i._id || idx} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">{i.snapshot?.name || i.name || 'Item'}</span>
                        <span className="shrink-0 text-lilac">× {i.quantity || 1}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {wishlist.length > 0 && (
                <Card>
                  <CardHeader title="Wishlist" />
                  <ul className="space-y-2 text-sm">
                    {wishlist.map((w, idx) => (
                      <li key={w._id || idx} className="truncate">
                        {w.name || w.productId?.name || w.snapshot?.name || 'Item'}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Contact" />
            <DescriptionList
              cols={1}
              items={[
                { label: 'Email', value: customer.email ? <a className="text-gold hover:text-gold-light" href={`mailto:${customer.email}`}>{customer.email}</a> : '—' },
                {
                  label: 'Phone',
                  value: customer.phone ? (
                    <a className="inline-flex items-center gap-1 text-gold hover:text-gold-light" href={`tel:${customer.phone}`}>
                      <Phone size={12} /> {customer.phone}
                    </a>
                  ) : (
                    '—'
                  ),
                },
                { label: 'Joined', value: dateTime(customer.createdAt) },
                customer.lastLoginAt !== undefined && { label: 'Last sign-in', value: customer.lastLoginAt ? relative(customer.lastLoginAt) : 'Never' },
              ]}
            />
          </Card>

          <GroupsCard customer={customer} />

          <Card>
            <CardHeader title="Addresses" description={addresses.length ? plural(addresses.length, 'saved address', 'saved addresses') : undefined} />
            {addresses.length ? (
              <ul className="space-y-3">
                {addresses.map((a, i) => (
                  <li key={a._id || i} className="flex gap-2 text-sm">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-gold" />
                    <div className="min-w-0">
                      <p className="text-ivory">
                        {a.label || 'Address'} {a.isDefault && <Badge tone="gold">Default</Badge>}
                      </p>
                      <p className="text-xs leading-relaxed text-lilac">
                        {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ') || a.display || '—'}
                        {a.phone && <> · {a.phone}</>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-lilac">No saved addresses.</p>
            )}
          </Card>
        </div>
      </div>

      <EditCustomerDrawer key={editing ? 'open' : 'closed'} open={editing} customer={customer} onClose={() => setEditing(false)} />
    </>
  );
}

function GroupsCard({ customer }) {
  const groups = useApiList('/admin/groups', { limit: 100, sort: 'name' }, { key: 'items' });
  const current = useMemo(() => (customer.groupIds || []).map((g) => String(g?._id || g)), [customer.groupIds]);
  const form = useForm({ groupIds: current });
  const selected = form.values.groupIds;
  const save = useApiMutation((groupIds) => apiSend('put', `/admin/customers/${customer._id}/groups`, { groupIds }), {
    invalidate: ['/admin/customers', '/admin/groups'],
    success: 'Groups updated.',
    onSuccess: (_d, groupIds) => form.reset({ groupIds }),
  });
  const toggle = (gid) => form.set('groupIds', selected.includes(gid) ? selected.filter((x) => x !== gid) : [...selected, gid]);
  const known = new Set(groups.rows.map((g) => String(g._id)));
  // Groups that were deleted but are still referenced on the profile.
  const orphans = (customer.groupIds || []).filter((g) => !known.has(String(g?._id || g)) && g?.name);

  return (
    <Card>
      <CardHeader
        title="Customer groups"
        description="Internal tags for segmenting. They do not change prices."
        actions={
          form.dirty && (
            <>
              <Button size="sm" variant="ghost" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" loading={save.isPending} onClick={() => save.mutate(selected)}>
                Save
              </Button>
            </>
          )
        }
      />
      {groups.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      ) : groups.error ? (
        <ErrorState error={groups.error} onRetry={groups.refetch} className="py-4" />
      ) : groups.rows.length === 0 ? (
        <p className="text-sm text-lilac">
          No groups yet.{' '}
          <Link to="/admin/groups" className="text-gold hover:text-gold-light">
            Create one
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {groups.rows.map((g) => {
            const gid = String(g._id);
            return (
              <label key={gid} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-white/[0.03]">
                <Checkbox checked={selected.includes(gid)} onChange={() => toggle(gid)} />
                <GroupChip group={g} />
                {g.isActive === false && <span className="text-[11px] text-lilac">hidden</span>}
              </label>
            );
          })}
          {orphans.map((g) => (
            <p key={g._id} className="text-xs text-lilac">
              Also tagged “{g.name}” (group no longer listed).
            </p>
          ))}
          {groups.pagination.total > groups.rows.length && (
            <p className="text-xs text-lilac">Showing the first {groups.rows.length} groups.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function EditCustomerDrawer({ open, customer, onClose }) {
  const form = useForm({ name: customer.name || '', phone: customer.phone || '' });
  const save = useApiMutation((values) => apiSend('put', `/admin/users/${customer._id}`, toPayload(values)), {
    invalidate: ['/admin/users', '/admin/customers'],
    success: 'Customer saved.',
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => form.setServerErrors(info.fields),
  });
  const submit = (e) => {
    e.preventDefault();
    const name = form.values.name.trim();
    const phone = form.values.phone.trim();
    if (!name) return form.setErrors({ name: 'Name is required.' });
    if (phone && !/^[+\d][\d\s-]{6,19}$/.test(phone)) return form.setErrors({ phone: 'Enter a valid phone number.' });
    save.mutate({ name, phone });
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      width="sm"
      title="Edit customer"
      description={customer.email}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="customer-form" loading={save.isPending} disabled={!form.dirty}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={submit} className="space-y-5">
        <FormGrid cols={1}>
          <Field label="Name" required error={form.errors.name}>
            {({ id }) => <Input id={id} {...form.bind('name')} autoFocus />}
          </Field>
          <Field label="Phone" error={form.errors.phone} hint="Used for delivery updates.">
            {({ id }) => <Input id={id} type="tel" inputMode="tel" {...form.bind('phone')} placeholder="10-digit mobile" />}
          </Field>
        </FormGrid>
        <p className="text-xs text-lilac">Email can’t be changed here. Roles and account access are managed under Team &amp; users.</p>
      </form>
    </Drawer>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </>
  );
}
