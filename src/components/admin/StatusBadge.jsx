const ORDER = {
  pending_payment: { label: 'Pending payment', className: 'bg-amber-900/50 text-amber-200 border-amber-500/30' },
  paid: { label: 'Paid', className: 'bg-emerald-900/50 text-emerald-200 border-emerald-500/30' },
  processing: { label: 'Processing', className: 'bg-sky-900/50 text-sky-200 border-sky-500/30' },
  packed: { label: 'Packed', className: 'bg-indigo-900/50 text-indigo-200 border-indigo-500/30' },
  shipped: { label: 'Shipped', className: 'bg-violet-900/50 text-violet-200 border-violet-500/30' },
  delivered: { label: 'Delivered', className: 'bg-emerald-900/60 text-emerald-100 border-emerald-400/40' },
  cancelled: { label: 'Cancelled', className: 'bg-red-900/50 text-red-200 border-red-500/30' },
  returned: { label: 'Returned', className: 'bg-rose-900/50 text-rose-200 border-rose-500/30' },
};

const STOCK = {
  ok: { label: 'In stock', className: 'bg-emerald-900/40 text-emerald-200 border-emerald-500/30' },
  low: { label: 'Low stock', className: 'bg-amber-900/50 text-amber-200 border-amber-500/30' },
  out: { label: 'Out of stock', className: 'bg-red-900/50 text-red-200 border-red-500/30' },
};

const COUPON = {
  active: { label: 'Active', className: 'bg-emerald-900/40 text-emerald-200 border-emerald-500/30' },
  scheduled: { label: 'Scheduled', className: 'bg-sky-900/40 text-sky-200 border-sky-500/30' },
  expired: { label: 'Expired', className: 'bg-raised text-lilac border-gold/20' },
  inactive: { label: 'Inactive', className: 'bg-raised text-lilac border-gold/20' },
};

const MAPS = { order: ORDER, stock: STOCK, coupon: COUPON };

export default function StatusBadge({ kind = 'order', value }) {
  const map = MAPS[kind] || ORDER;
  const meta = map[value] || { label: String(value || '—').replace(/_/g, ' '), className: 'bg-raised text-lilac border-gold/20' };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${meta.className}`}>
      {meta.label}
    </span>
  );
}
