import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Mail, Phone, ShoppingCart } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, money, number, plural, relative } from '../lib/format';
import { Badge, Button, DataTable, Drawer, EmptyState, PageHeader, Pagination, Thumb } from '../ui';

const BASE = '/admin/abandoned-carts';

// v2 returns `items` as an array of lines; older responses only gave a line count.
const lines = (c) => (Array.isArray(c.items) ? c.items : []);
const lineCount = (c) => (Array.isArray(c.items) ? c.items.reduce((n, i) => n + (Number(i.quantity) || 1), 0) : Number(c.items) || 0);

export default function AbandonedCarts() {
  const [state, set] = useUrlState({ page: 1 });
  const [openId, setOpenId] = useState(null);
  const list = useApiList(BASE, { page: state.page, limit: 25 }, { key: 'carts' });
  const remind = useApiMutation((id) => apiSend('post', `${BASE}/${id}/remind`), {
    invalidate: [BASE, '/admin/notifications'],
    success: 'Marked as reminded.',
  });
  const open = openId ? list.rows.find((c) => c._id === openId) : null;

  const remindButton = (c, size = 'sm') => (
    <Button
      size={size}
      icon={BellRing}
      variant={c.remindedAt ? 'ghost' : 'secondary'}
      loading={remind.isPending && remind.variables === c._id}
      disabled={remind.isPending}
      onClick={(e) => {
        e.stopPropagation();
        remind.mutate(c._id);
      }}
    >
      {c.remindedAt ? 'Mark again' : 'Mark as reminded'}
    </Button>
  );

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (c) =>
        c.user ? (
          <div className="min-w-0 max-w-[14rem]">
            <p className="truncate">{c.user.name || c.user.email}</p>
            <p className="truncate text-xs text-lilac">{c.user.email}</p>
          </div>
        ) : (
          <span className="text-lilac">Unknown customer</span>
        ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (c) => {
        const ls = lines(c);
        if (!ls.length) return plural(lineCount(c), 'line');
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {ls.slice(0, 3).map((i, idx) => (
                <Thumb key={idx} src={i.image ? mediaUrl(i.image) : ''} size={28} />
              ))}
            </div>
            <span className="min-w-0 max-w-[12rem] truncate text-xs text-lilac">
              {ls[0].name}
              {ls.length > 1 ? ` +${ls.length - 1} more` : ''}
            </span>
          </div>
        );
      },
    },
    { key: 'total', header: 'Value', align: 'right', render: (c) => <span className="tabular-nums">{money(c.total)}</span> },
    {
      key: 'updatedAt',
      header: 'Last activity',
      hideBelow: 'sm',
      render: (c) => (
        <span className="whitespace-nowrap text-xs text-lilac" title={dateTime(c.updatedAt)}>
          {relative(c.updatedAt)}
        </span>
      ),
    },
    {
      key: 'remindedAt',
      header: 'Followed up',
      hideBelow: 'md',
      render: (c) => (c.remindedAt ? <Badge tone="success">{relative(c.remindedAt)}</Badge> : <span className="text-xs text-lilac">Not yet</span>),
    },
    { key: 'actions', header: '', align: 'right', render: (c) => remindButton(c) },
  ];

  return (
    <>
      <PageHeader
        title="Abandoned carts"
        description="Signed-in shoppers who left items in their cart for over an hour. No email or message is sent from here — contact them yourself, then mark the cart as reminded so the team knows."
        meta={list.pagination.total > 0 && <Badge>{number(list.pagination.total)}</Badge>}
      />
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(c) => setOpenId(c._id)}
        empty={<EmptyState icon={ShoppingCart} title="No abandoned carts" description="Carts left untouched for over an hour show up here." />}
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.user?.name || open?.user?.email || 'Cart'}
        description={open ? `Last activity ${dateTime(open.updatedAt)}` : undefined}
        footer={open && remindButton(open, 'md')}
      >
        {open && (
          <div className="space-y-6">
            {open.user && (
              <div className="space-y-1.5 text-sm">
                {open.user.email && (
                  <a href={`mailto:${open.user.email}`} className="flex items-center gap-2 text-ivory hover:text-gold">
                    <Mail size={14} className="text-lilac" /> {open.user.email}
                  </a>
                )}
                {open.user.phone && (
                  <a href={`tel:${open.user.phone}`} className="flex items-center gap-2 text-ivory hover:text-gold">
                    <Phone size={14} className="text-lilac" /> {open.user.phone}
                  </a>
                )}
                {open.user._id && (
                  <Link to={`/admin/customers/${open.user._id}`} className="inline-block pt-1 text-xs text-gold hover:underline">
                    View customer profile
                  </Link>
                )}
              </div>
            )}
            {lines(open).length ? (
              <ul className="space-y-3">
                {lines(open).map((i, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Thumb src={i.image ? mediaUrl(i.image) : ''} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ivory">{i.name || 'Item'}</p>
                      <p className="text-xs text-lilac">
                        {number(i.quantity || 1)} × {money(i.unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-ivory">{money(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-lilac">{plural(lineCount(open), 'line')} in this cart.</p>
            )}
            <div className="flex justify-between border-t border-white/[0.08] pt-3 text-sm">
              <span className="text-lilac">Cart value</span>
              <span className="font-semibold tabular-nums text-ivory">{money(open.total)}</span>
            </div>
            <p className="text-xs text-lilac">
              {open.remindedAt ? `Marked as reminded ${dateTime(open.remindedAt)}.` : 'Not followed up yet.'} Marking only records the follow-up; nothing is sent to the customer.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
