import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, PackageCheck, RotateCcw, Truck, Undo2, XCircle } from 'lucide-react';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META, RETURN_STATUS_META, RETURN_TRANSITIONS } from '../lib/status';
import { date, dateTime, money, number, relative } from '../lib/format';
import {
  Badge,
  Button,
  DataTable,
  DescriptionList,
  Divider,
  Drawer,
  EmptyState,
  Field,
  FilterSelect,
  FormSection,
  MoneyInput,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  StatusBadge,
  Textarea,
  Timeline,
  Toolbar,
  useConfirm,
  useForm,
} from '../ui';
import { OrderLine } from './sales/components';
import { RETURN_INVALIDATE, RETURN_REASONS, roundMoney } from './sales/helpers';

const BASE = '/admin/returns';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Returns & exchanges' },
  { value: 'return', label: 'Returns' },
  { value: 'exchange', label: 'Exchanges' },
];

const ACTION = {
  approved: { label: 'Approve', icon: CheckCircle2, variant: 'primary' },
  rejected: { label: 'Reject', icon: XCircle, variant: 'danger' },
  refunded: { label: 'Mark refunded', icon: RotateCcw, variant: 'primary' },
  restocked: { label: 'Restock items', icon: PackageCheck, variant: 'secondary' },
};

function wasRefunded(r) {
  return Boolean(r?.refundId) || r?.status === 'refunded' || (r?.timeline || []).some((t) => t.status === 'refunded');
}

export default function Returns() {
  const [state, set] = useUrlState({ status: 'all', type: 'all', q: '', page: 1 });
  const [selected, setSelected] = useState(null);
  const list = useApiList(BASE, { status: state.status, type: state.type, q: state.q.trim(), page: state.page, limit: 25 }, { key: 'returns' });

  // Keep the drawer on the freshest copy after a write (falls back to the snapshot if it left this page/filter).
  const current = selected ? list.rows.find((r) => r._id === selected._id) || selected : null;

  const columns = [
    {
      key: 'order',
      header: 'Order',
      render: (r) => (
        <div>
          <p className="font-medium">{r.orderId?.orderNumber || '—'}</p>
          <p className="text-xs text-lilac" title={dateTime(r.createdAt)}>
            {relative(r.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div className="min-w-0 max-w-[13rem]">
          <p className="truncate">{r.userId?.name || r.orderId?.contactName || '—'}</p>
          <p className="truncate text-xs text-lilac">{r.userId?.email || r.orderId?.email || ''}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => (r.type === 'exchange' ? <Badge tone="accent">Exchange</Badge> : <Badge>Return</Badge>) },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      render: (r) => <span className="text-xs text-lilac">{RETURN_REASONS[r.reasonCode] || r.reasonCode || r.reason || '—'}</span>,
    },
    { key: 'items', header: 'Items', hideBelow: 'md', render: (r) => number((r.items || []).reduce((n, i) => n + (Number(i.quantity) || 1), 0)) },
    { key: 'refundAmount', header: 'Refund', align: 'right', render: (r) => <span className="tabular-nums">{money(r.refundAmount)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge meta={RETURN_STATUS_META} value={r.status} /> },
  ];

  const filtered = state.status !== 'all' || state.type !== 'all' || Boolean(state.q);

  return (
    <>
      <PageHeader title="Returns" description="Review return and exchange requests, refund customers and put items back in stock." />
      <Segmented
        className="mb-3"
        value={state.status}
        onChange={(status) => set({ status })}
        items={[{ value: 'all', label: 'All' }, ...Object.entries(RETURN_STATUS_META).map(([value, m]) => ({ value, label: m.label }))]}
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Order no., customer name or email…" />
        <FilterSelect label="Type" value={state.type} onChange={(type) => set({ type })} options={TYPE_OPTIONS} />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setSelected}
        empty={
          <EmptyState
            icon={Undo2}
            title={filtered ? 'No requests match these filters' : 'No return requests yet'}
            description={filtered ? undefined : 'Customers can request a return once an order is shipped or delivered.'}
            action={filtered && <Button size="sm" onClick={() => set({ status: 'all', type: 'all', q: '' })}>Clear filters</Button>}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <ReturnDrawer key={current?._id || 'none'} ret={current} onClose={() => setSelected(null)} onFailure={list.refetch} />
    </>
  );
}

function ReturnDrawer({ ret, onClose, onFailure }) {
  const confirm = useConfirm();
  const order = ret?.orderId && typeof ret.orderId === 'object' ? ret.orderId : null;
  const refunded = wasRefunded(ret);
  const orderRefunded = roundMoney(order?.payment?.refundedAmount);
  const cap = order ? Math.max(0, roundMoney((Number(order.total) || 0) - orderRefunded)) : null;
  const amountEditable = Boolean(ret) && !refunded && ret.status !== 'rejected';
  const isCashfree = order?.payment?.gateway === 'cashfree' || order?.payment?.method === 'gateway';

  const form = useForm({ refundAmount: ret?.refundAmount ?? 0, adminNote: ret?.adminNote || '' });

  const update = useApiMutation((body) => apiSend('put', `${BASE}/${ret._id}`, body), {
    invalidate: RETURN_INVALIDATE,
    success: (_d, body) => (body.status ? `Return ${RETURN_STATUS_META[body.status]?.label.toLowerCase() || 'updated'}.` : 'Return saved.'),
    onSuccess: (data) => {
      const r = data?.return || {};
      form.reset({ refundAmount: r.refundAmount ?? form.values.refundAmount, adminNote: r.adminNote ?? form.values.adminNote });
    },
    // 409 refreshes automatically; 502 (Cashfree failed, return rolled back to approved) and 400 need it too.
    onError: (info) => {
      form.setServerErrors(info.fields);
      onFailure?.();
    },
  });
  const pickup = useApiMutation((force) => apiSend('post', `${BASE}/${ret._id}/pickup`, force ? { force: true } : {}), {
    invalidate: RETURN_INVALIDATE,
    success: (d) => (d?.shipment?.waybill ? `Pickup booked · waybill ${d.shipment.waybill}.` : 'Pickup booked.'),
    onError: () => onFailure?.(),
  });
  const busy = update.isPending || pickup.isPending;

  if (!ret) return <Drawer open={false} />;

  const amount = Number(form.values.refundAmount);
  const amountError =
    !amountEditable || !form.dirty
      ? null
      : form.values.refundAmount === '' || !Number.isFinite(amount) || amount < 0
        ? 'Enter zero or more.'
        : cap != null && amount > cap
          ? `At most ${money(cap)} (order total minus refunds already issued).`
          : null;

  const changes = () => {
    const body = {};
    if (amountEditable && roundMoney(form.values.refundAmount) !== roundMoney(ret.refundAmount)) body.refundAmount = roundMoney(form.values.refundAmount);
    if ((form.values.adminNote || '') !== (ret.adminNote || '')) body.adminNote = form.values.adminNote;
    return body;
  };

  const save = () => {
    if (amountError) return form.setErrors({ refundAmount: amountError });
    update.mutate(changes());
  };

  const transition = async (next) => {
    if (amountError) return form.setErrors({ refundAmount: amountError });
    const value = amountEditable ? roundMoney(form.values.refundAmount) : roundMoney(ret.refundAmount);
    const opts = { confirmLabel: ACTION[next].label };
    if (next === 'approved') {
      opts.title = `Approve this ${ret.type === 'exchange' ? 'exchange' : 'return'}?`;
      opts.message = (
        <div className="space-y-2">
          {!ret.shipment?.waybill && <p>An iThink reverse pickup is booked automatically (a paid service).</p>}
          {ret.type !== 'exchange' && <p>The order moves to Returned.</p>}
          {ret.type === 'exchange' && <p>When the item is back, book the replacement from the order page.</p>}
        </div>
      );
    } else if (next === 'rejected') {
      opts.title = 'Reject this request?';
      opts.tone = 'danger';
      opts.message = 'The customer’s request is closed. Add a note explaining why before rejecting.';
    } else if (next === 'refunded') {
      opts.title = value > 0 ? `Refund ${money(value)}?` : 'Mark as refunded without money?';
      opts.tone = 'danger';
      opts.message =
        value <= 0 ? (
          'The refund amount is ₹0, so no money is sent. Set an amount first if the customer should get money back.'
        ) : isCashfree ? (
          <div className="space-y-2">
            <p>Cashfree sends {money(value)} to the customer’s original payment method. The order moves to Returned.</p>
            <p>If Cashfree refuses, nothing is recorded and the request stays Approved so you can retry.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              This was a {PAYMENT_METHOD_LABELS[order?.payment?.method] || 'manual'} order: {money(value)} is recorded as refunded on the order, but no money moves automatically.
              Transfer it to the customer yourself.
            </p>
            <p>The order moves to Returned.</p>
          </div>
        );
      opts.confirmLabel = value > 0 ? (isCashfree ? 'Refund via Cashfree' : 'Record refund') : 'Mark refunded';
    } else if (next === 'restocked') {
      opts.title = 'Put the returned items back in stock?';
      opts.message = 'Product stock goes up by the returned quantities (never more than ordered). Custom bracelets and loose beads are not restocked.';
    }
    if (await confirm(opts)) update.mutate({ ...changes(), status: next });
  };

  const bookPickup = async () => {
    const force = Boolean(ret.shipment?.waybill);
    const ok = await confirm(
      force
        ? {
            title: 'Book a new reverse pickup?',
            tone: 'danger',
            confirmLabel: 'Book again',
            message: `Waybill ${ret.shipment.waybill} already exists. Booking again creates a second iThink pickup — cancel the old one with iThink if it is still active.`,
          }
        : { title: 'Book reverse pickup?', confirmLabel: 'Book pickup', message: 'iThink collects the item from the customer (a paid service).' }
    );
    if (ok) pickup.mutate(force);
  };

  const next = RETURN_TRANSITIONS[ret.status] || [];
  const orderItems = order?.items || [];

  return (
    <Drawer
      open
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={`${ret.type === 'exchange' ? 'Exchange' : 'Return'} · ${order?.orderNumber || 'order'}`}
      description={`Requested ${dateTime(ret.createdAt)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {form.dirty && (
            <Button onClick={save} loading={update.isPending && !update.variables?.status} disabled={busy || Boolean(amountError)}>
              Save changes
            </Button>
          )}
          {next.map((s) => (
            <Button key={s} variant={ACTION[s]?.variant || 'secondary'} icon={ACTION[s]?.icon} loading={update.isPending && update.variables?.status === s} disabled={busy || Boolean(amountError)} onClick={() => transition(s)}>
              {ACTION[s]?.label || s}
            </Button>
          ))}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge meta={RETURN_STATUS_META} value={ret.status} />
          {ret.type === 'exchange' ? <Badge tone="accent">Exchange</Badge> : <Badge>Return</Badge>}
          {next.length === 0 && <span className="text-xs text-lilac">No further steps.</span>}
        </div>

        <FormSection title="Request">
          <DescriptionList
            items={[
              { label: 'Reason', value: RETURN_REASONS[ret.reasonCode] || ret.reasonCode || '—' },
              { label: 'Customer', value: ret.userId?.name || order?.contactName || '—' },
              ret.reason && { label: 'Customer’s note', value: <span className="whitespace-pre-wrap">{ret.reason}</span>, full: true },
              {
                label: 'Order',
                value: order?._id ? (
                  <Link to={`/admin/orders/${order._id}`} className="text-gold hover:underline">
                    {order.orderNumber}
                  </Link>
                ) : (
                  'Order deleted'
                ),
              },
              order && { label: 'Order total', value: money(order.total) },
              order && { label: 'Payment', value: `${PAYMENT_STATUS_META[order.payment?.status]?.label || '—'} · ${PAYMENT_METHOD_LABELS[order.payment?.method] || '—'}` },
              orderRefunded > 0 && { label: 'Refunded on order', value: money(orderRefunded) },
            ]}
          />
        </FormSection>

        <FormSection title="Items">
          {(ret.items || []).length === 0 ? (
            <p className="text-sm text-lilac">No items listed.</p>
          ) : (
            <ul className="space-y-3">
              {ret.items.map((i, idx) => {
                const line = orderItems[i.lineIndex] || {};
                return (
                  <li key={`${i.lineIndex}-${idx}`}>
                    <OrderLine compact item={{ ...line, snapshot: { ...(line.snapshot || {}), name: i.name || line.snapshot?.name }, quantity: i.quantity, unitPrice: line.unitPrice, lineTotal: i.amount ?? (Number(line.unitPrice) || 0) * (Number(i.quantity) || 1), productId: i.productId || line.productId }} />
                  </li>
                );
              })}
            </ul>
          )}
        </FormSection>

        {ret.type === 'exchange' && <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-lilac">Exchange: once the reverse pickup arrives, book the replacement from the order page.</p>}

        <FormSection title="Refund">
          {amountEditable ? (
            <Field
              label="Refund amount"
              error={form.errors.refundAmount || amountError}
              hint={cap != null ? `Up to ${money(cap)}. Requested amount: ${money(ret.refundAmount)}.` : undefined}
            >
              {({ id }) => <MoneyInput id={id} value={form.values.refundAmount} max={cap ?? undefined} onChange={(v) => form.set('refundAmount', v)} />}
            </Field>
          ) : (
            <DescriptionList
              items={[
                { label: 'Refund amount', value: money(ret.refundAmount) },
                ret.refundId && { label: 'Cashfree refund ID', value: <span className="font-mono text-xs">{ret.refundId}</span> },
              ]}
            />
          )}
          {amountEditable && <p className="text-xs text-lilac">{isCashfree ? 'Paid by Cashfree — refunding sends the money automatically.' : 'COD / UPI order — refunding only records it; you transfer the money.'}</p>}
        </FormSection>

        <FormSection title="Pickup">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {ret.shipment?.waybill ? (
                <>
                  <p className="text-ivory">
                    Waybill{' '}
                    {ret.shipment.trackingUrl ? (
                      <a href={ret.shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                        {ret.shipment.waybill} <ExternalLink size={12} />
                      </a>
                    ) : (
                      ret.shipment.waybill
                    )}
                  </p>
                  {ret.shipment.lastStatus && <p className="text-xs text-lilac">{ret.shipment.lastStatus}</p>}
                </>
              ) : (
                <p className="text-lilac">{ret.status === 'requested' ? 'Booked automatically on approval.' : 'No reverse pickup booked.'}</p>
              )}
            </div>
            {ret.status === 'approved' && (
              <Button size="sm" icon={Truck} loading={pickup.isPending} disabled={busy} onClick={bookPickup}>
                {ret.shipment?.waybill ? 'Book again' : 'Book reverse pickup'}
              </Button>
            )}
          </div>
        </FormSection>

        <FormSection title="Internal note" description="Saved with the next action and added to the timeline when the status changes.">
          <Textarea rows={3} maxLength={2000} aria-label="Internal note" {...form.bind('adminNote')} />
        </FormSection>

        <Divider />
        <FormSection title="Timeline">
          <Timeline
            items={[...(ret.timeline || [])].reverse()}
            render={(t) => (
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <StatusBadge meta={RETURN_STATUS_META} value={t.status} />
                  <span className="text-xs text-lilac">{dateTime(t.at)}</span>
                </p>
                {t.note && <p className="mt-1 whitespace-pre-wrap text-sm text-ivory">{t.note}</p>}
              </div>
            )}
          />
          {ret.restockedAt && <p className="text-xs text-lilac">Restocked {date(ret.restockedAt)}.</p>}
        </FormSection>
      </div>
    </Drawer>
  );
}
