// Mirrors backend/src/services/orderLifecycleService.js TRANSITIONS — keep in sync.
export const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

export const ORDER_TRANSITIONS = {
  pending_payment: ['paid', 'processing', 'packed', 'cancelled'],
  paid: ['processing', 'packed', 'shipped', 'cancelled'],
  processing: ['packed', 'shipped', 'cancelled'],
  packed: ['processing', 'shipped', 'cancelled'],
  shipped: ['delivered', 'returned', 'processing'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const ORDER_STATUS_META = {
  pending_payment: { label: 'Awaiting payment', tone: 'warning' },
  paid: { label: 'Paid', tone: 'info' },
  processing: { label: 'Processing', tone: 'info' },
  packed: { label: 'Packed', tone: 'accent' },
  shipped: { label: 'Shipped', tone: 'accent' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  returned: { label: 'Returned', tone: 'neutral' },
};

export const PAYMENT_STATUS_META = {
  pending: { label: 'Unpaid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

export const PAYMENT_METHOD_LABELS = { cod: 'Cash on delivery', upi: 'UPI', gateway: 'Cashfree' };

export function nextOrderStatuses(current) {
  return ORDER_TRANSITIONS[current] || [];
}

// Mirrors backend platformController.updateReturn transition map.
export const RETURN_TRANSITIONS = {
  requested: ['approved', 'rejected'],
  approved: ['refunded', 'restocked', 'rejected'],
  refunded: ['restocked'],
  restocked: ['refunded'],
  rejected: [],
};

export const RETURN_STATUS_META = {
  requested: { label: 'Requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'info' },
  refunded: { label: 'Refunded', tone: 'success' },
  restocked: { label: 'Restocked', tone: 'accent' },
  rejected: { label: 'Rejected', tone: 'danger' },
};
