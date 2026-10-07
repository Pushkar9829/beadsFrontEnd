import { Download, Mail, Trash2 } from 'lucide-react';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { date, dateTime, number } from '../lib/format';
import { Badge, Button, DataTable, EmptyState, IconButton, PageHeader, Pagination, SearchInput, Toolbar, useConfirm } from '../ui';
import { useCsvExport } from './people/shared';

const BASE = '/admin/newsletter';

export default function Newsletter() {
  const [state, set] = useUrlState({ q: '', page: 1 });
  const confirm = useConfirm();
  const list = useApiList(BASE, { q: state.q, page: state.page, limit: 25 }, { key: 'subscribers' });
  const exp = useCsvExport(`${BASE}/export`, 'newsletter');
  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: [BASE], success: 'Subscriber removed.' });

  const askDelete = async (s) => {
    if (
      await confirm({
        title: `Remove ${s.email}?`,
        message: 'They are deleted from the list and won’t be in future exports. They can subscribe again from the storefront.',
        confirmLabel: 'Remove',
        tone: 'danger',
      })
    )
      remove.mutate(s._id);
  };

  const columns = [
    { key: 'email', header: 'Email', render: (s) => <span className="font-medium">{s.email}</span> },
    { key: 'name', header: 'Name', hideBelow: 'sm', render: (s) => s.name || <span className="text-lilac/60">—</span> },
    { key: 'source', header: 'Source', hideBelow: 'md', render: (s) => (s.source ? <Badge>{s.source}</Badge> : '—') },
    { key: 'isActive', header: 'Status', render: (s) => (s.isActive === false ? <Badge tone="warning">Unsubscribed</Badge> : <Badge tone="success">Subscribed</Badge>) },
    { key: 'createdAt', header: 'Joined', hideBelow: 'sm', render: (s) => <span title={dateTime(s.createdAt)}>{date(s.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <IconButton
          icon={Trash2}
          size="sm"
          label={`Remove ${s.email}`}
          disabled={remove.isPending && remove.variables === s._id}
          onClick={(e) => {
            e.stopPropagation();
            askDelete(s);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Newsletter"
        description="People who subscribed on the storefront. Export the list to send campaigns from your email tool."
        meta={list.pagination.total ? <Badge tone="gold">{number(list.pagination.total)} {state.q ? 'found' : 'total'}</Badge> : null}
        actions={
          <Button icon={Download} loading={exp.isPending} onClick={() => exp.mutate({ q: state.q })}>
            Export CSV
          </Button>
        }
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search email or name…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        empty={
          <EmptyState
            icon={Mail}
            title={state.q ? 'No subscribers match your search' : 'No subscribers yet'}
            description={state.q ? undefined : 'Sign-ups from the storefront newsletter form appear here.'}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
    </>
  );
}
