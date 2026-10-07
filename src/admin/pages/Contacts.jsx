import { useEffect, useRef, useState } from 'react';
import { Mail, MailOpen, MessageSquare, Phone, Reply, Trash2 } from 'lucide-react';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, relative } from '../lib/format';
import { Badge, Button, DataTable, DescriptionList, Drawer, EmptyState, IconButton, Menu, PageHeader, Pagination, SearchInput, Segmented, Toolbar, cx, useConfirm } from '../ui';

const BASE = '/admin/contacts';
const INVALIDATE = [BASE, '/admin/notifications'];

function mailto(m) {
  const subject = encodeURIComponent('Re: your message to Kuberstones');
  const quoted = String(m.message || '')
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');
  const body = encodeURIComponent(`Hi ${m.name || ''},\n\n\n\nOn ${dateTime(m.createdAt)} you wrote:\n${quoted}`);
  return `mailto:${m.email}?subject=${subject}&body=${body}`;
}

export default function Contacts() {
  const [state, set] = useUrlState({ q: '', read: 'all', page: 1 });
  // Snapshot of the open message, so it stays open when a filter (e.g. Unread) drops it from the list.
  const [opened, setOpened] = useState(null);
  const openId = opened?._id || null;
  const confirm = useConfirm();

  const list = useApiList(BASE, { q: state.q, read: state.read, page: state.page, limit: 25 }, { key: 'contacts' });
  const unread = Number.isFinite(Number(list.raw?.unread)) ? Number(list.raw.unread) : null;
  const open = (openId && list.rows.find((m) => m._id === openId)) || opened;

  const markRead = useApiMutation(({ id, read }) => apiSend('put', `${BASE}/${id}`, { read }), {
    invalidate: INVALIDATE,
    success: (_d, v) => (v.silent ? false : v.read ? 'Marked as read.' : 'Marked as unread.'),
    onSuccess: (_d, v) => setOpened((m) => (m && m._id === v.id ? { ...m, read: v.read } : m)),
  });
  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), {
    invalidate: INVALIDATE,
    success: 'Message deleted.',
    onSuccess: (_d, id) => {
      setOpened((m) => (m && m._id === id ? null : m));
    },
  });

  const askDelete = async (m) => {
    if (await confirm({ title: 'Delete this message?', message: `The message from ${m.name || m.email} is removed permanently.`, confirmLabel: 'Delete', tone: 'danger' })) remove.mutate(m._id);
  };

  const columns = [
    {
      key: 'from',
      header: 'From',
      render: (m) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cx('h-2 w-2 shrink-0 rounded-full', m.read ? 'bg-transparent' : 'bg-gold')} aria-label={m.read ? undefined : 'Unread'} />
          <div className="min-w-0">
            <p className={cx('truncate', !m.read && 'font-semibold')}>{m.name || 'Anonymous'}</p>
            <p className="truncate text-xs text-lilac">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (m) => <p className={cx('line-clamp-2 max-w-md text-sm', m.read ? 'text-lilac' : 'text-ivory')}>{m.message}</p>,
    },
    { key: 'phone', header: 'Phone', hideBelow: 'lg', render: (m) => m.phone || <span className="text-lilac/60">—</span> },
    { key: 'createdAt', header: 'Received', hideBelow: 'sm', render: (m) => <span title={dateTime(m.createdAt)} className="whitespace-nowrap">{relative(m.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <Menu
          items={[
            m.read
              ? { label: 'Mark as unread', icon: Mail, onClick: () => markRead.mutate({ id: m._id, read: false }) }
              : { label: 'Mark as read', icon: MailOpen, onClick: () => markRead.mutate({ id: m._id, read: true }) },
            { label: 'Reply by email', icon: Reply, hidden: !m.email, onClick: () => (window.location.href = mailto(m)) },
            'divider',
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(m) },
          ]}
        />
      ),
    },
  ];

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'false', label: 'Unread', count: unread },
    { value: 'true', label: 'Read' },
  ];

  return (
    <>
      <PageHeader
        title="Contact inbox"
        description="Messages sent from the storefront contact form."
        meta={unread ? <Badge tone="gold">{unread} unread</Badge> : null}
      />
      <Toolbar>
        <Segmented items={filters} value={state.read} onChange={(read) => set({ read })} />
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Name, email or message…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setOpened}
        empty={
          <EmptyState
            icon={MessageSquare}
            title={state.q ? 'No messages match your search' : state.read === 'false' ? 'All caught up' : 'No messages yet'}
            description={state.read === 'false' && !state.q ? 'There are no unread messages.' : undefined}
          />
        }
        footer={<Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <MessageDrawer
        message={open}
        onClose={() => setOpened(null)}
        onMarkRead={(read, silent) => markRead.mutate({ id: open._id, read, silent })}
        marking={markRead.isPending}
        onDelete={() => askDelete(open)}
        deleting={remove.isPending}
      />
    </>
  );
}

function MessageDrawer({ message, onClose, onMarkRead, marking, onDelete, deleting }) {
  // Opening an unread message marks it read once (quietly).
  const marked = useRef(null);
  useEffect(() => {
    if (message && !message.read && marked.current !== message._id) {
      marked.current = message._id;
      onMarkRead(true, true);
    }
  }, [message, onMarkRead]);

  return (
    <Drawer
      open={Boolean(message)}
      onClose={onClose}
      title={message?.name || 'Message'}
      description={message ? `Received ${dateTime(message.createdAt)}` : undefined}
      footer={
        message && (
          <>
            <Button variant="danger" icon={Trash2} loading={deleting} onClick={onDelete} className="mr-auto">
              Delete
            </Button>
            <Button icon={Mail} loading={marking} onClick={() => onMarkRead(false)} disabled={!message.read}>
              Mark unread
            </Button>
            {message.email && (
              <Button variant="primary" icon={Reply} onClick={() => (window.location.href = mailto(message))}>
                Reply
              </Button>
            )}
          </>
        )
      }
    >
      {message && (
        <div className="space-y-5">
          <DescriptionList
            items={[
              {
                label: 'Email',
                value: message.email ? (
                  <a className="text-gold hover:text-gold-light" href={`mailto:${message.email}`}>
                    {message.email}
                  </a>
                ) : (
                  '—'
                ),
              },
              {
                label: 'Phone',
                value: message.phone ? (
                  <span className="inline-flex items-center gap-2">
                    <a className="text-gold hover:text-gold-light" href={`tel:${message.phone}`}>
                      {message.phone}
                    </a>
                    <IconButton icon={Phone} size="sm" label="Call" onClick={() => (window.location.href = `tel:${message.phone}`)} />
                  </span>
                ) : (
                  '—'
                ),
              },
            ]}
          />
          <div className="whitespace-pre-wrap break-words rounded-xl border border-white/[0.08] bg-raised/50 p-4 text-sm leading-relaxed text-ivory">{message.message}</div>
          <p className="text-xs text-lilac">Replies open in your email app. They are not tracked here.</p>
        </div>
      )}
    </Drawer>
  );
}
