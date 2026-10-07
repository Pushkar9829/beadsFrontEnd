import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, number, relative } from '../lib/format';
import { Badge, Button, DataTable, EmptyState, IconButton, PageHeader, Pagination, Segmented, Toolbar, cx } from '../ui';
import { NOTIFICATION_TYPES, notificationTarget } from './sales/helpers';

const BASE = '/admin/notifications';

export default function Notifications() {
  const navigate = useNavigate();
  const [state, set] = useUrlState({ filter: 'all', page: 1 });
  const list = useApiList(BASE, { unread: state.filter === 'unread' ? 'true' : undefined, page: state.page, limit: 25 }, { key: 'notifications' });
  const unread = Number(list.raw?.unread) || 0;

  const markOne = useApiMutation((id) => apiSend('post', `${BASE}/${id}/read`), { invalidate: [BASE], success: false });
  const markAll = useApiMutation(() => apiSend('post', `${BASE}/read-all`), { invalidate: [BASE], success: 'All notifications marked as read.' });

  const open = (n) => {
    if (!n.read) markOne.mutate(n._id);
    const to = notificationTarget(n);
    if (to) navigate(to);
  };

  const columns = [
    {
      key: 'title',
      header: 'Notification',
      render: (n) => (
        <div className="flex min-w-0 gap-3">
          <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-gold')} aria-hidden />
          {!n.read && <span className="sr-only">Unread:</span>}
          <div className="min-w-0">
            <p className={cx('text-sm', n.read ? 'text-lilac' : 'font-medium text-ivory')}>{n.title}</p>
            {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-lilac">{n.body}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      hideBelow: 'sm',
      render: (n) => {
        const meta = NOTIFICATION_TYPES[n.type] || { label: n.type || 'Other', tone: 'neutral' };
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'When',
      render: (n) => (
        <span className="whitespace-nowrap text-xs text-lilac" title={dateTime(n.createdAt)}>
          {relative(n.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (n) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {!n.read && <IconButton icon={Check} size="sm" label="Mark as read" disabled={markOne.isPending && markOne.variables === n._id} onClick={() => markOne.mutate(n._id)} />}
          {notificationTarget(n) && <IconButton icon={ExternalLink} size="sm" label="Open" onClick={() => open(n)} />}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Store alerts: new orders, payments, stock, returns and messages. Read state is shared by all staff."
        actions={
          <Button icon={CheckCheck} disabled={!unread} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        }
      />
      <Toolbar>
        <Segmented
          items={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread', count: unread },
          ]}
          value={state.filter}
          onChange={(filter) => set({ filter })}
        />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={open}
        empty={
          <EmptyState
            icon={Bell}
            title={state.filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            description={state.filter === 'unread' ? 'No unread notifications.' : 'New orders, stock alerts and messages will show up here.'}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      {unread > 0 && state.filter === 'all' && <p className="mt-2 text-xs text-lilac">{number(unread)} unread.</p>}
    </>
  );
}
