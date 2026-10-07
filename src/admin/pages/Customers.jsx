import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Users as UsersIcon } from 'lucide-react';
import { useApiList } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { money, number, relative } from '../lib/format';
import { Avatar, Badge, Button, DataTable, EmptyState, PageHeader, Pagination, SearchInput, Segmented, Toolbar } from '../ui';
import { GroupChips, SEGMENT_META, resolveGroups, useCsvExport } from './people/shared';

const SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'vip', label: 'VIP' },
  { value: 'inactive', label: 'Inactive' },
];

const SEGMENT_HINT = {
  all: 'Everyone with a customer account.',
  new: 'Signed up in the last 30 days.',
  repeat: 'More than one order.',
  vip: '₹5,000 or more spent.',
  inactive: 'No order in 90 days, or never ordered and joined over 30 days ago.',
};

export default function Customers() {
  const navigate = useNavigate();
  // `group` (segment) keeps the old ?group= links working.
  const [state, set] = useUrlState({ q: '', group: 'all', page: 1 });

  const list = useApiList('/admin/customers', { q: state.q, group: state.group, page: state.page, limit: 25 }, { key: 'customers' });
  const groups = useApiList('/admin/groups', { limit: 100, sort: 'name' }, { key: 'items' });
  const byId = useMemo(() => new Map(groups.rows.map((g) => [String(g._id), g])), [groups.rows]);
  const exp = useCsvExport('/admin/customers/export', 'customers');

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name || c.email} size={30} />
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name || 'Unnamed'}</p>
            <p className="truncate text-xs text-lilac">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'orders', header: 'Orders', align: 'right', render: (c) => <span className="tabular-nums">{number(c.orders)}</span> },
    { key: 'spent', header: 'Spent', align: 'right', render: (c) => <span className="tabular-nums">{money(c.spent)}</span> },
    { key: 'aov', header: 'AOV', align: 'right', hideBelow: 'md', render: (c) => <span className="tabular-nums">{c.orders ? money(c.aov) : '—'}</span> },
    { key: 'lastOrder', header: 'Last order', hideBelow: 'md', render: (c) => (c.lastOrder ? relative(c.lastOrder) : <span className="text-lilac/60">Never</span>) },
    {
      key: 'segment',
      header: 'Segment',
      hideBelow: 'sm',
      render: (c) => {
        const m = SEGMENT_META[c.segment];
        return m ? <Badge tone={m.tone}>{m.label}</Badge> : '—';
      },
    },
    { key: 'groups', header: 'Groups', hideBelow: 'lg', render: (c) => <GroupChips groups={resolveGroups(c.groupIds, byId)} max={2} /> },
  ];

  const filtered = Boolean(state.q) || state.group !== 'all';

  return (
    <>
      <PageHeader
        title="Customers"
        description="Spend and order counts include paid and fulfilled orders only."
        actions={
          <Button icon={Download} loading={exp.isPending} onClick={() => exp.mutate({ q: state.q, group: state.group })}>
            Export CSV
          </Button>
        }
      />
      <Segmented className="mb-3 w-fit" items={SEGMENTS} value={state.group} onChange={(group) => set({ group })} />
      <Toolbar right={<span className="text-xs text-lilac">{SEGMENT_HINT[state.group]}</span>}>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Name, email or phone…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(c) => navigate(`/admin/customers/${c._id}`)}
        empty={
          <EmptyState
            icon={UsersIcon}
            title={filtered ? 'No customers match these filters' : 'No customers yet'}
            description={filtered ? 'Try another search or segment.' : 'Customers appear here when they create an account or check out.'}
            action={
              filtered && (
                <Button size="sm" onClick={() => set({ q: '', group: 'all' })}>
                  Clear filters
                </Button>
              )
            }
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
    </>
  );
}
