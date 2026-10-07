import { useMemo, useState } from 'react';
import { ExternalLink, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { date, fromLocalInput, relative, toLocalInput } from '../lib/format';
import { apiSend, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FormSection,
  Input,
  MediaInput,
  Menu,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Switch,
  Textarea,
  Thumb,
  Toolbar,
  cx,
  useConfirm,
  useForm,
} from '../ui';

const BASE = '/admin/blog';
// The API has no search or status filter for posts, so a large page is loaded and filtered here.
const LIMIT = 100;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  image: '',
  author: 'Kuberstones',
  isPublished: false,
  publishedAt: '',
  seo: { title: '', description: '', keywords: '', ogImage: '', noIndex: false },
};

function slugify(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export default function Blog() {
  const [state, set] = useUrlState({ q: '', status: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | 'new' | post
  const confirm = useConfirm();
  const list = useApiList(BASE, { page: state.page, limit: LIMIT }, { key: 'posts' });

  const counts = useMemo(() => {
    const c = { all: list.rows.length, published: 0, draft: 0 };
    for (const p of list.rows) c[p.isPublished ? 'published' : 'draft'] += 1;
    return c;
  }, [list.rows]);

  const rows = useMemo(() => {
    const needle = state.q.trim().toLowerCase();
    return list.rows.filter((p) => {
      if (state.status === 'published' && !p.isPublished) return false;
      if (state.status === 'draft' && p.isPublished) return false;
      if (!needle) return true;
      return [p.title, p.slug, p.excerpt, p.author].some((v) => String(v || '').toLowerCase().includes(needle));
    });
  }, [list.rows, state.q, state.status]);

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: [BASE], success: 'Post deleted.' });
  const askDelete = async (p) => {
    const ok = await confirm({
      title: `Delete “${p.title}”?`,
      message: p.isPublished ? 'The post is removed from the journal and its link stops working. This cannot be undone.' : 'The draft is deleted. This cannot be undone.',
      confirmLabel: 'Delete post',
      tone: 'danger',
    });
    if (ok) remove.mutate(p._id);
    return ok;
  };

  const columns = [
    {
      key: 'title',
      header: 'Post',
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={p.image ? mediaUrl(p.image) : ''} size={44} />
          <div className="min-w-0">
            <p className="truncate font-medium">{p.title}</p>
            <p className="truncate text-xs text-lilac">/journal/{p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (p.isPublished ? <Badge tone="success" dot>Published</Badge> : <Badge dot>Draft</Badge>),
    },
    { key: 'publishedAt', header: 'Publish date', hideBelow: 'md', render: (p) => (p.publishedAt ? date(p.publishedAt) : '—') },
    { key: 'updatedAt', header: 'Updated', hideBelow: 'lg', render: (p) => <span className="text-lilac">{relative(p.updatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => setEditing(p) },
            { label: 'View on site', icon: ExternalLink, hidden: !p.isPublished, onClick: () => window.open(`/journal/${p.slug}`, '_blank', 'noopener') },
            { label: 'Delete', icon: Trash2, tone: 'danger', onClick: () => askDelete(p) },
          ]}
        />
      ),
    },
  ];

  const filtered = state.q || state.status !== 'all';
  return (
    <>
      <PageHeader
        title="Journal"
        description="Posts for the storefront journal (/journal)."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            Write post
          </Button>
        }
      />
      <Toolbar>
        <Segmented
          value={state.status}
          onChange={(status) => set({ status })}
          items={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'published', label: 'Published', count: counts.published },
            { value: 'draft', label: 'Drafts', count: counts.draft },
          ]}
        />
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search title or slug…" />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={list.isLoading}
        fetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={setEditing}
        empty={
          <EmptyState
            icon={Newspaper}
            title={filtered ? 'No posts match' : 'No posts yet'}
            description={filtered ? 'Try another search or status.' : 'Write a first note from the atelier.'}
            action={!filtered && <Button icon={Plus} onClick={() => setEditing('new')}>Write post</Button>}
          />
        }
        footer={list.pagination.pages > 1 && <Pagination pagination={list.pagination} onPage={(page) => set({ page })} />}
      />
      <PostDrawer key={editing?._id || editing || 'none'} post={editing} onClose={() => setEditing(null)} onDelete={askDelete} />
    </>
  );
}

function toForm(post) {
  if (!post || post === 'new') return EMPTY;
  return {
    ...EMPTY,
    ...post,
    excerpt: post.excerpt || '',
    body: post.body || '',
    image: post.image || '',
    author: post.author || '',
    publishedAt: toLocalInput(post.publishedAt),
    seo: { ...EMPTY.seo, ...(post.seo || {}) },
  };
}

function PostDrawer({ post, onClose, onDelete }) {
  const isNew = post === 'new';
  const form = useForm(toForm(post));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [tab, setTab] = useState('write');
  const v = form.values;

  const save = useApiMutation(
    (values) => {
      const body = {
        title: values.title.trim(),
        slug: (values.slug || '').trim(),
        excerpt: values.excerpt,
        body: values.body,
        image: values.image,
        author: (values.author || '').trim() || 'Kuberstones',
        isPublished: values.isPublished,
        // Always sent so the server never resets an existing publish date; empty + published = now.
        publishedAt: fromLocalInput(values.publishedAt),
        seo: values.seo,
      };
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${post._id}`, body);
    },
    {
      invalidate: [BASE],
      success: (_d, values) => (values.isPublished ? (isNew ? 'Post published.' : 'Post saved.') : 'Draft saved.'),
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => {
        if (info.fields) form.setServerErrors(info.fields);
        else if (info.status === 409 || /slug|duplicate/i.test(info.message)) form.setErrors({ slug: 'Another post already uses this slug.' });
      },
    }
  );

  const submit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!v.title.trim()) errors.title = 'Title is required.';
    if ((v.slug || '').trim() && !SLUG_RE.test(v.slug.trim())) errors.slug = 'Use lowercase letters, numbers and dashes only.';
    if (Object.keys(errors).length) return form.setErrors(errors);
    save.mutate(v);
  };

  const onTitle = (e) => {
    const title = e.target.value;
    form.set(slugTouched ? { title } : { title, slug: slugify(title) });
  };

  return (
    <Drawer
      open={Boolean(post)}
      onClose={onClose}
      dirty={form.dirty}
      width="xl"
      title={isNew ? 'Write post' : 'Edit post'}
      description={!isNew && post?.isPublished ? `Live at /journal/${post.slug}` : undefined}
      footer={
        <>
          {!isNew && (
            <Button variant="danger" icon={Trash2} className="mr-auto" onClick={async () => (await onDelete(post)) && onClose()}>
              Delete
            </Button>
          )}
          {!isNew && post?.isPublished && (
            <a href={`/journal/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-lilac hover:text-gold">
              <ExternalLink size={14} /> View
            </a>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="post-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {v.isPublished ? (isNew ? 'Publish' : 'Save') : 'Save draft'}
          </Button>
        </>
      }
    >
      <form id="post-form" onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-5">
          <Field label="Title" required error={form.errors.title}>
            {({ id }) => <Input id={id} value={v.title} onChange={onTitle} invalid={Boolean(form.errors.title)} autoFocus={isNew} />}
          </Field>
          <Field label="Slug" error={form.errors.slug} hint={isNew && !slugTouched ? 'Filled in from the title.' : 'Changing the slug breaks links to the old address.'}>
            {({ id }) => (
              <Input
                id={id}
                prefix="/journal/"
                value={v.slug}
                invalid={Boolean(form.errors.slug)}
                onChange={(e) => {
                  setSlugTouched(true);
                  form.set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
              />
            )}
          </Field>
          <Field label="Excerpt" hint="Shown on the journal list and as the search description when no SEO description is set.">
            {({ id }) => <Textarea id={id} rows={2} {...form.bind('excerpt')} />}
          </Field>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-lilac">Body</span>
              <Segmented
                value={tab}
                onChange={setTab}
                items={[
                  { value: 'write', label: 'Write' },
                  { value: 'preview', label: 'Preview' },
                ]}
              />
            </div>
            {tab === 'write' ? (
              <>
                <Textarea aria-label="Body" rows={18} className="font-mono text-[13px]" {...form.bind('body')} />
                <p className="text-xs text-lilac/70">
                  Plain text. Line breaks and blank lines are kept exactly as typed; formatting symbols such as ** or # are shown as written (the journal does not render Markdown).
                  <span className="ml-1 tabular-nums">{wordCount(v.body)} words.</span>
                </p>
              </>
            ) : (
              <PostPreview values={v} />
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <FormSection title="Publishing">
            <Switch
              label="Published"
              description={v.isPublished ? 'Visible on the journal.' : 'Only staff can see drafts.'}
              checked={v.isPublished}
              onChange={(isPublished) => form.set('isPublished', isPublished)}
            />
            <Field label="Publish date" hint={v.isPublished && !v.publishedAt ? 'Leave empty to use the moment you save.' : 'Shown on the post and used for ordering. Your local time.'}>
              {({ id }) => <Input id={id} type="datetime-local" {...form.bind('publishedAt')} />}
            </Field>
            <Field label="Author">{({ id }) => <Input id={id} {...form.bind('author')} placeholder="Kuberstones" />}</Field>
          </FormSection>
          <FormSection title="Cover image">
            <MediaInput value={v.image} onChange={(image) => form.set('image', image)} folder="blog" aspect="aspect-video" />
          </FormSection>
          <FormSection title="Search & sharing">
            <Field label="SEO title" hint={`${(v.seo.title || '').length}/60 · defaults to the post title`}>
              {({ id }) => <Input id={id} {...form.bind('seo.title')} />}
            </Field>
            <Field label="Meta description" hint={`${(v.seo.description || '').length}/160 · defaults to the excerpt`}>
              {({ id }) => <Textarea id={id} rows={3} {...form.bind('seo.description')} />}
            </Field>
            <Field label="Keywords" hint="Comma separated.">
              {({ id }) => <Input id={id} {...form.bind('seo.keywords')} />}
            </Field>
            <Field label="Share image" hint="Defaults to the cover image.">
              <MediaInput value={v.seo.ogImage || ''} onChange={(ogImage) => form.set('seo.ogImage', ogImage)} folder="blog" aspect="aspect-video" />
            </Field>
            <Checkbox label="Hide from search engines" checked={Boolean(v.seo.noIndex)} onChange={(noIndex) => form.set('seo.noIndex', noIndex)} />
          </FormSection>
        </aside>
      </form>
    </Drawer>
  );
}

function wordCount(s = '') {
  const t = String(s).trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Mirrors the storefront post page (pages/BlogPostPage.jsx): cover, author, title, plain-text body. */
function PostPreview({ values }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink/60 p-5 sm:p-8">
      <article className="mx-auto max-w-2xl">
        {values.image && <img src={mediaUrl(values.image)} alt="" className="mb-6 w-full rounded-2xl object-cover" />}
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{values.author || 'Kuberstones'}</p>
        <h1 className={cx('mt-2 font-serif text-3xl text-ivory', !values.title && 'text-lilac/50')}>{values.title || 'Untitled post'}</h1>
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-ivory/80">{values.body || <span className="text-lilac/60">Nothing written yet.</span>}</div>
      </article>
    </div>
  );
}
