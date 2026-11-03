import { apiSend, useApiMutation, useApiQuery } from '../lib/query';
import { dateTime, number, relative } from '../lib/format';
import { Badge, Card, CardHeader, DataTable, Skeleton, Switch } from '../ui';

const STATUS_TONE = { sent: 'info', delivered: 'success', read: 'success', failed: 'danger', send_failed: 'danger' };
const STATUS_LABEL = { sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Not delivered', send_failed: 'Meta refused' };

/** Settings -> WhatsApp login: on/off, setup checks, last 7 days and the latest code requests (masked numbers). */
export default function WhatsAppLoginTab() {
  const q = useApiQuery('/admin/whatsapp');
  const d = q.data;
  const toggle = useApiMutation((enabled) => apiSend('put', '/admin/whatsapp/settings', { enabled }), {
    invalidate: ['/admin/whatsapp'],
    success: (_r, enabled) => (enabled ? 'WhatsApp sign-in switched on.' : 'WhatsApp sign-in switched off.'),
  });
  if (q.isLoading || !d) return <Skeleton className="h-40" />;
  const s = d.last7Days || {};
  const checks = [
    ['Token + phone number ID (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID)', d.configured],
    ['Webhook verify token (WHATSAPP_WEBHOOK_VERIFY_TOKEN)', d.webhook?.verifyTokenSet],
    ['App secret for webhook signatures (WHATSAPP_APP_SECRET)', d.webhook?.appSecretSet],
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="WhatsApp sign-in"
          description={`Customers get a 6-digit code on WhatsApp (template "${d.template}", valid ${d.ttlMinutes} min) to sign in or create an account. Email + password always keeps working.`}
          actions={d.mock ? <Badge tone="warning">Test mode</Badge> : d.configured ? <Badge tone="success">Connected</Badge> : <Badge tone="danger">Not configured</Badge>}
        />
        <Switch
          checked={d.enabled}
          disabled={toggle.isPending}
          onChange={(v) => toggle.mutate(v)}
          label="Show “Continue with WhatsApp” on Sign in and Create account"
          description={d.configured ? 'Switch off to hide it immediately (no deploy needed).' : 'Stays hidden until the server has the WhatsApp token and phone number ID.'}
        />
        <ul className="mt-4 space-y-1 text-xs">
          {checks.map(([label, ok]) => (
            <li key={label} className={ok ? 'text-emerald-300' : 'text-amber-200'}>
              {ok ? '✓' : '•'} {label}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-lilac">Webhook URL for Meta (WhatsApp → Configuration): https://api.kuberstones.com/api/whatsapp/webhook, field “messages”.</p>
      </Card>

      <Card>
        <CardHeader title="Last 7 days" description={`${number(d.linkedUsers)} customer account(s) have a verified WhatsApp number.`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Codes requested', s.requested],
            ['Delivered / read', (s.delivered || 0) + (s.read || 0)],
            ['Not delivered', (s.failed || 0) + (s.send_failed || 0)],
            ['Signed in', s.verified],
            ['Awaiting receipt', s.sent],
          ].map(([label, v]) => (
            <div key={label} className="rounded-xl border border-white/[0.08] bg-raised/50 p-3">
              <p className="text-xs text-lilac">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-ivory">{number(v || 0)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="Latest code requests" description="Numbers are masked. “Awaiting receipt” stays until Meta sends a delivery update to the webhook." />
        </div>
        <DataTable
          columns={[
            { key: 'createdAt', header: 'When', render: (r) => <span title={dateTime(r.createdAt)}>{relative(r.createdAt)}</span> },
            { key: 'phone', header: 'Number', render: (r) => <span className="font-mono text-xs">{r.phone}</span> },
            { key: 'status', header: 'Delivery', render: (r) => <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{STATUS_LABEL[r.status] || r.status}</Badge> },
            { key: 'verified', header: 'Signed in', render: (r) => (r.verified ? 'Yes' : r.attempts ? `${r.attempts} wrong` : '—') },
            { key: 'error', header: 'Note', hideBelow: 'md', render: (r) => <span className="line-clamp-2 max-w-xs text-xs text-lilac">{r.error || '—'}</span> },
          ]}
          rows={d.recent || []}
          empty={<p className="p-6 text-sm text-lilac">No codes requested yet.</p>}
        />
      </Card>
    </div>
  );
}
