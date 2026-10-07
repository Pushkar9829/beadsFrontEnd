import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MapPin,
  PackageX,
  Pencil,
  Printer,
  RefreshCw,
  RotateCcw,
  SearchX,
  Send,
  Truck,
  Undo2,
} from 'lucide-react';
import { apiSend, useApiMutation, useApiQuery } from '../lib/query';
import { ORDER_STATUS_META, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META, RETURN_STATUS_META, nextOrderStatuses } from '../lib/status';
import { date, dateTime, money, number } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  Divider,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  Input,
  Menu,
  Modal,
  MoneyInput,
  PageHeader,
  Skeleton,
  StatusBadge,
  Textarea,
  Timeline,
  useConfirm,
  useForm,
} from '../ui';
import { OrderLine, SummaryRow } from './sales/components';
import { ORDER_INVALIDATE, customerName, lineName, roundMoney, text } from './sales/helpers';

const ADDRESS_EDITABLE = ['pending_payment', 'paid', 'processing', 'packed'];
const SHIPPABLE = ['paid', 'processing', 'packed'];

const STATUS_ACTION = {
  paid: { label: 'Set status to Paid', icon: CreditCard },
  processing: { label: 'Move to processing', icon: RefreshCw },
  packed: { label: 'Mark as packed', icon: CheckCircle2 },
  shipped: { label: 'Mark as shipped', icon: Truck },
  delivered: { label: 'Mark as delivered', icon: CheckCircle2 },
  returned: { label: 'Mark as returned', icon: Undo2 },
  cancelled: { label: 'Cancel order', icon: Ban },
};

export default function OrderDetail() {
  const { id } = useParams();
  const base = `/orders/admin/${id}`;
  const query = useApiQuery(base, undefined, { keepPrevious: false });
  const confirm = useConfirm();
  const [editAddress, setEditAddress] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [note, setNote] = useState('');

  // One mutation for every order action, so two money/stock actions can never overlap.
  const act = useApiMutation(({ method = 'post', path = '', body }) => apiSend(method, `${base}${path}`, body), {
    invalidate: ORDER_INVALIDATE,
    success: (data, vars) => (typeof vars.success === 'function' ? vars.success(data) : vars.success),
    onSuccess: (_data, vars) => vars.onDone?.(),
    // 409 refetches via invalidate; 400/502 (invalid transition, provider failure) also need the current state.
    onError: () => query.refetch(),
  });
  const busy = act.isPending ? act.variables?.key : null;

  if (query.isLoading) return <DetailSkeleton />;
  if (query.error || !query.data?.order) {
    const notFound = query.error?.status === 404 || (!query.error && !query.data?.order);
    return (
      <>
        <PageHeader title="Order" back={{ to: '/admin/orders', label: 'Orders' }} />
        <Card>
          {notFound ? (
            <EmptyState icon={SearchX} title="Order not found" description="It may have been deleted, or the link is wrong." action={<Link to="/admin/orders" className="text-sm text-gold hover:underline">Back to orders</Link>} />
          ) : (
            <ErrorState error={query.error} onRetry={query.refetch} />
          )}
        </Card>
      </>
    );
  }

  const { order, returns = [] } = query.data;
  const payment = order.payment || {};
  const shipment = order.shipment || {};
  const paid = payment.status === 'paid';
  const refunded = roundMoney(payment.refundedAmount);
  const refundable = Math.max(0, roundMoney((Number(order.total) || 0) - refunded));
  const isCashfree = payment.gateway === 'cashfree' || payment.method === 'gateway';
  const terminal = ['cancelled', 'returned'].includes(order.status);

  // "paid" as a bare status change is only offered when the payment really is paid; otherwise use "Record payment".
  const nextStatuses = nextOrderStatuses(order.status).filter((s) => s !== 'paid' || paid);

  const run = (key, vars) => act.mutate({ key, ...vars });

  const changeStatus = async (next) => {
    const label = ORDER_STATUS_META[next]?.label || next;
    let opts = { title: `Mark order as ${label.toLowerCase()}?`, confirmLabel: STATUS_ACTION[next]?.label || 'Confirm' };
    if (next === 'cancelled') {
      opts = {
        title: `Cancel order ${order.orderNumber}?`,
        tone: 'danger',
        confirmLabel: 'Cancel order',
        cancelLabel: 'Keep order',
        message: (
          <div className="space-y-2">
            <p>Stock for these items is put back and the coupon use is released.</p>
            {shipment.waybill && <p>The iThink shipment {shipment.waybill} will be cancelled too.</p>}
            {paid ? (
              <p className="text-amber-200">
                The customer paid {money(order.total)}. Cancelling does <strong>not</strong> refund them — issue a refund from this page afterwards.
              </p>
            ) : (
              <p>No payment was captured, so nothing needs refunding.</p>
            )}
          </div>
        ),
      };
    } else if (next === 'shipped' && !shipment.waybill) {
      opts.message = 'No courier is booked. The customer will not get tracking. To book iThink, use “Book shipment” instead.';
    } else if (next === 'processing' && order.status === 'shipped') {
      opts.message = shipment.waybill
        ? 'The order still has an active iThink waybill. Use “Cancel shipment” first so the courier booking is not left open.'
        : 'Use this when the courier booking was cancelled and the parcel is back in the workroom.';
    } else if (next === 'returned') {
      opts.message = 'This only changes the status. It does not refund the customer or restock items — handle that from the return request or with “Refund”.';
    } else if (next === 'delivered') {
      opts.message = 'Use this when the courier confirms delivery and tracking has not updated it yet.';
    }
    if (await confirm(opts)) run(`status:${next}`, { method: 'put', body: { status: next }, success: `Order marked as ${label.toLowerCase()}.` });
  };

  const markPaid = async () => {
    const ok = await confirm({
      title: `Record payment of ${money(order.total)}?`,
      confirmLabel: 'Mark payment received',
      message: (
        <div className="space-y-2">
          <p>Stock for this order is deducted now and any coupon use is recorded.</p>
          {order.status === 'pending_payment' && <p>The order moves to Paid.</p>}
          {isCashfree && <p className="text-amber-200">This is a Cashfree order — only do this after confirming the payment in your Cashfree dashboard.</p>}
        </div>
      ),
    });
    if (ok) run('paid', { method: 'put', body: { paymentStatus: 'paid' }, success: 'Payment recorded.' });
  };

  const ship = async (force = false) => {
    const ok = await confirm(
      force
        ? {
            title: 'Book a new iThink shipment?',
            tone: 'danger',
            confirmLabel: 'Book again',
            message: `Waybill ${shipment.waybill} already exists. Booking again creates a second courier booking — cancel the old one with iThink if it is still active.`,
          }
        : {
            title: 'Book iThink shipment?',
            confirmLabel: 'Book shipment',
            message: 'A courier pickup is booked with iThink (a paid service) and the order moves to Shipped.',
          }
    );
    if (ok)
      run('ship', {
        path: '/ship',
        body: force ? { force: true } : {},
        success: (d) => (d?.shipment?.waybill ? `Shipment booked · waybill ${d.shipment.waybill}.` : 'Shipment booked.'),
      });
  };

  const cancelShipment = async () => {
    const ok = await confirm({
      title: 'Cancel the iThink shipment?',
      tone: 'danger',
      confirmLabel: 'Cancel shipment',
      cancelLabel: 'Keep shipment',
      message: `Waybill ${shipment.waybill} is cancelled with iThink${order.status === 'shipped' ? ' and the order moves back to Processing' : ''}. The order itself is not cancelled.`,
    });
    if (ok) run('cancel-shipment', { path: '/cancel-shipment', success: 'Shipment cancelled.' });
  };

  const addNote = (e) => {
    e.preventDefault();
    const value = note.trim();
    if (!value) return;
    run('note', { path: '/notes', body: { note: value.slice(0, 1000) }, success: 'Note added.', onDone: () => setNote('') });
  };

  const customer = order.userId && typeof order.userId === 'object' ? order.userId : null;
  const addr = order.shippingAddress || {};

  const statusMenu = nextStatuses.map((s) => ({
    label: STATUS_ACTION[s]?.label || ORDER_STATUS_META[s]?.label || s,
    icon: STATUS_ACTION[s]?.icon,
    tone: s === 'cancelled' ? 'danger' : undefined,
    disabled: Boolean(busy),
    onClick: () => changeStatus(s),
  }));

  return (
    <div className="print:hidden">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        back={{ to: '/admin/orders', label: 'Orders' }}
        meta={
          <>
            <StatusBadge meta={ORDER_STATUS_META} value={order.status} />
            <StatusBadge meta={PAYMENT_STATUS_META} value={payment.status || 'pending'} />
            {order.inventory?.oversold && <Badge tone="danger">Oversold</Badge>}
          </>
        }
        description={`Placed ${dateTime(order.createdAt)} · ${PAYMENT_METHOD_LABELS[payment.method] || 'No payment method'}`}
        actions={
          <>
            <Button icon={Printer} onClick={() => window.print()}>
              Packing slip
            </Button>
            {statusMenu.length > 0 && <Menu label="Change status" items={statusMenu} />}
          </>
        }
      />

      {order.inventory?.oversold && (
        <div className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-100">
          This order was paid while some items were out of stock. Check inventory before packing.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Items" description={`${number((order.items || []).reduce((n, i) => n + (Number(i.quantity) || 1), 0))} pieces`} />
            <ul className="space-y-5">
              {(order.items || []).map((item, i) => (
                <li key={item._id || i}>
                  <OrderLine item={item} />
                </li>
              ))}
            </ul>
            <Divider className="my-4" />
            <div className="ml-auto max-w-sm">
              <SummaryRow label="Subtotal" value={money(order.subtotal)} />
              {Number(order.discount) > 0 && <SummaryRow label="Discount" value={`− ${money(order.discount)}`} />}
              {order.couponCode && <SummaryRow label="Coupon" value={<span className="font-mono text-xs">{order.couponCode}</span>} />}
              {order.offerName && <SummaryRow label="Offer" value={order.offerName} />}
              <SummaryRow label="Shipping" value={Number(order.shippingFee) > 0 ? money(order.shippingFee) : 'Free'} />
              {Number(order.tax) > 0 && <SummaryRow label="Tax (GST)" value={money(order.tax)} />}
              <Divider className="my-1.5" />
              <SummaryRow label="Total" value={money(order.total)} strong />
              {refunded > 0 && (
                <>
                  <SummaryRow label="Refunded" value={`− ${money(refunded)}`} />
                  <SummaryRow label="Net" value={money(refundable)} strong />
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Shipment"
              description={shipment.provider ? `Provider: ${shipment.provider}` : 'Not booked yet'}
              actions={
                shipment.waybill ? (
                  <>
                    <Button size="sm" icon={RefreshCw} loading={busy === 'track'} disabled={Boolean(busy)} onClick={() => run('track', { path: '/track', success: (d) => `Tracking: ${d?.tracking?.forward?.currentStatus || d?.order?.shipment?.lastStatus || 'updated'}.` })}>
                      Refresh tracking
                    </Button>
                    <Menu
                      label="Shipment actions"
                      items={[
                        { label: 'Cancel shipment', icon: PackageX, tone: 'danger', disabled: Boolean(busy), onClick: cancelShipment },
                        { label: 'Book again (new waybill)', icon: Truck, disabled: Boolean(busy) || terminal, onClick: () => ship(true) },
                      ]}
                    />
                  </>
                ) : (
                  SHIPPABLE.includes(order.status) && (
                    <Button size="sm" variant="primary" icon={Truck} loading={busy === 'ship'} disabled={Boolean(busy) || (isCashfree && !paid)} onClick={() => ship(false)}>
                      Book shipment
                    </Button>
                  )
                )
              }
            />
            {!shipment.waybill && !SHIPPABLE.includes(order.status) && !terminal && (
              <p className="mb-3 text-xs text-lilac">
                {order.status === 'pending_payment' ? 'A shipment can be booked once the order is paid.' : 'This order is past the shipping stage.'}
              </p>
            )}
            {!shipment.waybill && isCashfree && !paid && SHIPPABLE.includes(order.status) && <p className="mb-3 text-xs text-amber-200">Cashfree payment not captured yet — shipping is blocked until it is paid.</p>}
            <DescriptionList
              items={[
                { label: 'Courier', value: shipment.carrier || '—' },
                {
                  label: 'Waybill',
                  value: shipment.waybill ? (
                    shipment.trackingUrl ? (
                      <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                        {shipment.waybill} <ExternalLink size={12} />
                      </a>
                    ) : (
                      shipment.waybill
                    )
                  ) : (
                    '—'
                  ),
                },
                { label: 'Courier status', value: shipment.lastStatus || '—' },
                { label: 'Expected delivery', value: shipment.expectedDelivery || '—' },
                shipment.bookedAt && { label: 'Booked', value: dateTime(shipment.bookedAt) },
                shipment.lastTrackedAt && { label: 'Last tracked', value: dateTime(shipment.lastTrackedAt) },
                shipment.returnWaybill && {
                  label: 'Return waybill',
                  value: shipment.returnTrackingUrl ? (
                    <a href={shipment.returnTrackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                      {shipment.returnWaybill} <ExternalLink size={12} />
                    </a>
                  ) : (
                    shipment.returnWaybill
                  ),
                },
                shipment.returnStatus && { label: 'Return status', value: shipment.returnStatus },
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Timeline" description="Status changes, courier updates and internal notes. Customers do not see notes." />
            <form onSubmit={addNote} className="mb-5 space-y-2">
              <Textarea rows={2} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" aria-label="Internal note" />
              <div className="flex justify-end">
                <Button type="submit" size="sm" icon={Send} loading={busy === 'note'} disabled={!note.trim() || Boolean(busy)}>
                  Add note
                </Button>
              </div>
            </form>
            {order.notes && (
              <div className="mb-4 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-ivory">
                <p className="text-[11px] uppercase tracking-wider text-lilac">Order notes</p>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
            <Timeline
              items={[...(order.timeline || [])].reverse()}
              render={(t) => (
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <StatusBadge meta={ORDER_STATUS_META} value={t.status} />
                    <span className="text-xs text-lilac">
                      {dateTime(t.at)}
                      {t.by ? ` · ${text(t.by)}` : ''}
                    </span>
                  </p>
                  {t.note && <p className="mt-1 whitespace-pre-wrap text-sm text-ivory">{t.note}</p>}
                </div>
              )}
            />
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Payment" />
            <DescriptionList
              cols={1}
              items={[
                { label: 'Status', value: <StatusBadge meta={PAYMENT_STATUS_META} value={payment.status || 'pending'} /> },
                { label: 'Method', value: PAYMENT_METHOD_LABELS[payment.method] || '—' },
                payment.gatewayRef && { label: 'Gateway reference', value: <span className="font-mono text-xs">{payment.gatewayRef}</span> },
                payment.cfOrderId && { label: 'Cashfree order', value: <span className="font-mono text-xs">{payment.cfOrderId}</span> },
                payment.upiRef && { label: 'UPI reference', value: <span className="font-mono text-xs">{payment.upiRef}</span> },
                payment.capturedAt && { label: 'Received', value: dateTime(payment.capturedAt) },
                refunded > 0 && { label: 'Refunded', value: `${money(refunded)} of ${money(order.total)}` },
                payment.refundId && { label: 'Refund ID', value: <span className="font-mono text-xs">{payment.refundId}</span> },
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {['pending', 'failed'].includes(payment.status || 'pending') && !terminal && (
                <Button size="sm" variant="primary" icon={CreditCard} loading={busy === 'paid'} disabled={Boolean(busy)} onClick={markPaid}>
                  Mark payment received
                </Button>
              )}
              {paid && refundable > 0 && (
                <Button size="sm" icon={RotateCcw} disabled={Boolean(busy)} onClick={() => setRefundOpen(true)}>
                  Refund
                </Button>
              )}
            </div>
            {order.status === 'cancelled' && paid && refundable > 0 && <p className="mt-3 text-xs text-amber-200">This order was cancelled after payment. Issue a refund.</p>}
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <div className="space-y-1 text-sm">
              <p className="text-ivory">{customerName(order)}</p>
              {(order.email || customer?.email) && (
                <a href={`mailto:${order.email || customer.email}`} className="block break-all text-lilac hover:text-gold">
                  {order.email || customer.email}
                </a>
              )}
              {(order.phone || customer?.phone) && (
                <a href={`tel:${order.phone || customer.phone}`} className="block text-lilac hover:text-gold">
                  {order.phone || customer.phone}
                </a>
              )}
              {customer?._id ? (
                <Link to={`/admin/customers/${customer._id}`} className="inline-block pt-1 text-xs text-gold hover:underline">
                  View customer profile
                </Link>
              ) : (
                <p className="pt-1 text-xs text-lilac">Guest checkout</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Shipping address"
              actions={ADDRESS_EDITABLE.includes(order.status) && <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditAddress(true)}>Edit</Button>}
            />
            <address className="flex gap-2 text-sm not-italic text-ivory">
              <MapPin size={14} className="mt-0.5 shrink-0 text-lilac" />
              <span>
                {addr.name && <span className="block">{addr.name}</span>}
                {addr.line1 && <span className="block">{addr.line1}</span>}
                {addr.line2 && <span className="block">{addr.line2}</span>}
                {addr.landmark && <span className="block text-lilac">Near {addr.landmark}</span>}
                <span className="block">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</span>
                {addr.country && <span className="block">{addr.country}</span>}
                {addr.phone && <span className="block text-lilac">{addr.phone}</span>}
              </span>
            </address>
            {!ADDRESS_EDITABLE.includes(order.status) && <p className="mt-3 text-xs text-lilac">The address can no longer be changed at this stage.</p>}
          </Card>

          <Card>
            <CardHeader
              title="Returns"
              actions={returns.length > 0 && <Link to={`/admin/returns?q=${encodeURIComponent(order.orderNumber)}`} className="text-xs text-gold hover:underline">Open in returns</Link>}
            />
            {returns.length === 0 ? (
              <p className="text-sm text-lilac">No return or exchange requests.</p>
            ) : (
              <ul className="space-y-3">
                {returns.map((r) => (
                  <li key={r._id}>
                    <Link to={`/admin/returns?q=${encodeURIComponent(order.orderNumber)}`} className="block rounded-lg border border-white/[0.06] p-3 hover:border-gold/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-ivory">{r.type === 'exchange' ? 'Exchange' : 'Return'}</span>
                        <StatusBadge meta={RETURN_STATUS_META} value={r.status} />
                      </div>
                      <p className="mt-1 text-xs text-lilac">
                        {date(r.createdAt)} · {(r.items || []).map((i) => `${i.name} × ${i.quantity}`).join(', ') || 'Items not listed'}
                      </p>
                      {Number(r.refundAmount) > 0 && <p className="mt-1 text-xs text-lilac">Refund {money(r.refundAmount)}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <AddressDrawer key={editAddress ? `edit-${order.__v}` : 'address-closed'} open={editAddress} order={order} onClose={() => setEditAddress(false)} base={base} onConflict={query.refetch} />
      <RefundModal key={refundOpen ? 'refund-open' : 'refund-closed'} open={refundOpen} onClose={() => setRefundOpen(false)} order={order} refundable={refundable} isCashfree={isCashfree} base={base} onFailure={query.refetch} />
      <PackingSlip order={order} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </>
  );
}

const ADDRESS_FIELDS = ['name', 'phone', 'line1', 'line2', 'landmark', 'city', 'state', 'pincode', 'country'];

function AddressDrawer({ open, order, onClose, base, onConflict }) {
  const a = order.shippingAddress || {};
  const initial = {
    contactName: order.contactName || '',
    phone: order.phone || '',
    shippingAddress: Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, a[k] || (k === 'country' ? 'India' : '')])),
  };
  const form = useForm(initial);
  const save = useApiMutation((body) => apiSend('patch', `${base}/address`, body), {
    invalidate: ORDER_INVALIDATE,
    success: 'Address updated.',
    onSuccess: () => {
      form.reset();
      onClose();
    },
    onError: (info) => {
      form.setServerErrors(info.fields);
      if (info.status === 409 || info.status === 400) onConflict?.();
    },
  });
  const err = (k) => form.errors[`shippingAddress.${k}`] || form.errors[k];

  const submit = (e) => {
    e.preventDefault();
    const s = form.values.shippingAddress;
    const digits = (v) => String(v || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    const errors = {};
    if (!s.name.trim()) errors['shippingAddress.name'] = 'Name is required.';
    if (!/^\d{10}$/.test(digits(s.phone))) errors['shippingAddress.phone'] = 'Enter a 10-digit mobile number.';
    if (!s.line1.trim()) errors['shippingAddress.line1'] = 'Address line 1 is required.';
    if (!s.city.trim()) errors['shippingAddress.city'] = 'City is required.';
    if (!s.state.trim()) errors['shippingAddress.state'] = 'State is required.';
    if (!/^\d{6}$/.test(String(s.pincode).trim())) errors['shippingAddress.pincode'] = 'Enter a 6-digit pincode.';
    if (form.values.phone && !/^\d{10}$/.test(digits(form.values.phone))) errors.phone = 'Enter a 10-digit mobile number.';
    if (Object.keys(errors).length) return form.setErrors(errors);
    const body = {
      shippingAddress: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, k === 'phone' ? digits(v) : String(v).trim()])),
    };
    if (form.values.contactName.trim() !== (order.contactName || '')) body.contactName = form.values.contactName.trim();
    if (form.values.phone !== (order.phone || '')) body.phone = digits(form.values.phone);
    save.mutate(body);
  };

  const input = (k, label, props = {}) => (
    <Field label={label} required={['name', 'phone', 'line1', 'city', 'state', 'pincode'].includes(k)} error={err(k)}>
      {({ id }) => <Input id={id} {...form.bind(`shippingAddress.${k}`)} invalid={Boolean(err(k))} {...props} />}
    </Field>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      title="Edit shipping address"
      description="The change is noted on the order timeline."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="order-address-form" loading={save.isPending} disabled={!form.dirty}>
            Save address
          </Button>
        </>
      }
    >
      <form id="order-address-form" onSubmit={submit} className="space-y-5">
        <FormGrid>
          <Field label="Contact name" error={form.errors.contactName}>
            {({ id }) => <Input id={id} {...form.bind('contactName')} />}
          </Field>
          <Field label="Contact phone" error={form.errors.phone}>
            {({ id }) => <Input id={id} inputMode="tel" {...form.bind('phone')} />}
          </Field>
        </FormGrid>
        <Divider />
        <FormGrid>
          {input('name', 'Recipient name')}
          {input('phone', 'Recipient phone', { inputMode: 'tel' })}
        </FormGrid>
        {input('line1', 'Address line 1')}
        {input('line2', 'Address line 2')}
        {input('landmark', 'Landmark')}
        <FormGrid>
          {input('city', 'City')}
          {input('state', 'State')}
          {input('pincode', 'Pincode', { inputMode: 'numeric', maxLength: 6 })}
          {input('country', 'Country')}
        </FormGrid>
        {order.shipment?.waybill && <p className="text-xs text-amber-200">A courier is already booked. Update the address with iThink too, or cancel and rebook the shipment.</p>}
      </form>
    </Drawer>
  );
}

function RefundModal({ open, onClose, order, refundable, isCashfree, base, onFailure }) {
  const confirm = useConfirm();
  const form = useForm({ amount: refundable, note: '' });
  const amount = Number(form.values.amount);
  const invalid = !Number.isFinite(amount) || amount <= 0 ? 'Enter an amount above zero.' : amount > refundable ? `At most ${money(refundable)} can be refunded.` : null;

  const refund = useApiMutation((body) => apiSend('post', `${base}/refund`, body), {
    invalidate: ORDER_INVALIDATE,
    success: (d) => (d?.refund?.refund_id || d?.refund?.id ? `Refund issued · ${d.refund.refund_id || d.refund.id}.` : 'Refund recorded.'),
    onSuccess: () => {
      form.reset();
      onClose();
    },
    // 502 = Cashfree refused and nothing was recorded; show the current state.
    onError: () => onFailure?.(),
  });

  const submit = async (e) => {
    e.preventDefault();
    if (invalid) return form.setErrors({ amount: invalid });
    const value = roundMoney(amount);
    const ok = await confirm({
      title: `Refund ${money(value)}?`,
      tone: 'danger',
      confirmLabel: isCashfree ? 'Refund via Cashfree' : 'Record refund',
      message: isCashfree
        ? `Cashfree sends ${money(value)} back to the customer's original payment method. This cannot be undone.`
        : `This records a manual refund of ${money(value)} on the order. No money moves automatically — transfer it to the customer yourself (${PAYMENT_METHOD_LABELS[order.payment?.method] || 'manual'}).`,
    });
    if (ok) refund.mutate({ amount: value, ...(form.values.note.trim() ? { note: form.values.note.trim() } : {}) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      size="sm"
      title={`Refund order ${order.orderNumber}`}
      description={isCashfree ? 'Paid through Cashfree — the refund is sent automatically.' : 'Paid by COD or UPI — you send the money yourself.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" form="order-refund-form" loading={refund.isPending} disabled={Boolean(invalid)}>
            Refund
          </Button>
        </>
      }
    >
      <form id="order-refund-form" onSubmit={submit} className="space-y-4">
        <Field label="Amount" required error={form.errors.amount || (form.dirty ? invalid : null)} hint={`Up to ${money(refundable)} (order total minus earlier refunds).`}>
          {({ id }) => <MoneyInput id={id} value={form.values.amount} max={refundable} onChange={(v) => form.set('amount', v)} />}
        </Field>
        <Field label="Note" hint="Saved on the order timeline.">
          {({ id }) => <Textarea id={id} rows={2} maxLength={300} {...form.bind('note')} />}
        </Field>
        {amount < refundable && !invalid && <p className="text-xs text-lilac">Partial refund — the payment stays “Paid” until the full amount is refunded.</p>}
      </form>
    </Modal>
  );
}

/** Print-only packing slip. Rendered at <body> level; screen styles hide it, print hides everything else. */
function PackingSlip({ order }) {
  const a = order.shippingAddress || {};
  return createPortal(
    <div id="ks-packing-slip" className="hidden bg-white p-8 font-sans text-[12px] text-black print:block">
      <style>{`@media print { body > *:not(#ks-packing-slip) { display: none !important; } html, body { background: #fff !important; overflow: visible !important; height: auto !important; } @page { margin: 12mm; } }`}</style>
      <div className="flex items-start justify-between border-b border-black pb-3">
        <div>
          <p className="text-xl font-semibold tracking-wide">Kuberstones</p>
          <p>Packing slip</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold">{order.orderNumber}</p>
          <p>Placed {date(order.createdAt)}</p>
          <p>{PAYMENT_METHOD_LABELS[order.payment?.method] || ''}{order.payment?.method === 'cod' ? ` · Collect ${money(order.total)}` : ''}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-1 font-semibold uppercase">Ship to</p>
          <p>{a.name || order.contactName}</p>
          {a.line1 && <p>{a.line1}</p>}
          {a.line2 && <p>{a.line2}</p>}
          {a.landmark && <p>Near {a.landmark}</p>}
          <p>{[a.city, a.state, a.pincode].filter(Boolean).join(', ')}</p>
          {a.country && <p>{a.country}</p>}
          <p>Phone: {a.phone || order.phone || '—'}</p>
        </div>
        <div>
          {order.shipment?.waybill && (
            <>
              <p className="mb-1 font-semibold uppercase">Shipment</p>
              <p>{order.shipment.carrier || 'Courier'}</p>
              <p>Waybill {order.shipment.waybill}</p>
            </>
          )}
        </div>
      </div>
      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1.5 pr-2">Item</th>
            <th className="w-16 py-1.5 text-right">Qty</th>
            <th className="w-12 py-1.5 text-right">✓</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, i) => {
            const s = item.snapshot || {};
            const beads = item.kind === 'custom_bracelet' && Array.isArray(s.beads) ? s.beads : [];
            const extra = item.kind === 'custom_bracelet'
              ? [s.charm && `Charm: ${text(s.charm)}`, s.finish && `Finish: ${text(s.finish)}`, s.wristSize && `Wrist: ${text(s.wristSize)}`, s.beadSizeMm && `Bead ${s.beadSizeMm} mm`, s.threadType && `Thread: ${text(s.threadType)}`, s.engravingName && `Engrave: ${text(s.engravingName)}`].filter(Boolean)
              : [];
            return (
              <tr key={item._id || i} className="border-b border-gray-300 align-top">
                <td className="py-2 pr-2">
                  <p className="font-medium">{lineName(item)}</p>
                  {extra.length > 0 && <p>{extra.join(' · ')}</p>}
                  {beads.length > 0 && <p>Beads: {beads.map((b) => `${text(b.name) || 'Bead'} ×${b.quantity || 1}`).join(', ')}</p>}
                </td>
                <td className="py-2 text-right">{number(item.quantity || 1)}</td>
                <td className="py-2 text-right">☐</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-6">Thank you for shopping with Kuberstones.</p>
    </div>,
    document.body
  );
}
