// Banners: scheduled marketing images for home, shop, category and collection pages (generic CRUD: items/item).
import { useMemo, useState } from 'react';
import { Copy, ExternalLink, Eye, EyeOff, Image as ImageIcon, Megaphone, Monitor, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { apiSend, toPayload, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { dateTime, fromLocalInput, number, toLocalInput } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FilterSelect,
  FormGrid,
  FormSection,
  Input,
  MediaInput,
  Menu,
  NumberInput,
  PageHeader,
  Pagination,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
  Switch,
  Toolbar,
  cx,
  useConfirm,
  useForm,
} from '../ui';
import { ScheduleBadge, ScheduleFields } from './marketing/components';
import { scheduleErrors } from './marketing/schedule';

const BASE = '/admin/banners';
const INVALIDATE = [BASE];
const LIMIT = 100; // server cap; placement is filtered client-side (the API has no placement filter)

const PLACEMENTS = [
  { value: 'home', label: 'Home' },
  { value: 'shop', label: 'Shop' },
  { value: 'category', label: 'Category pages' },
  { value: 'collection', label: 'Collection pages' },
];
const PLACEMENT_LABEL = Object.fromEntries(PLACEMENTS.map((p) => [p.value, p.label]));

const BANNER_META = {
  active: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired: { label: 'Expired', tone: 'neutral' },
  inactive: { label: 'Hidden', tone: 'warning' },
};

const EMPTY = { title: '', image: '', mobileImage: '', link: '', placement: 'home', sortOrder: 0, startsAt: '', endsAt: '', isActive: true };

function toForm(b) {
  if (!b) return EMPTY;
  return {
    title: b.title || '',
    image: b.image || '',
    mobileImage: b.mobileImage || '',
    link: b.link || '',
    placement: b.placement || 'home',
    sortOrder: b.sortOrder ?? 0,
    startsAt: toLocalInput(b.startsAt),
    endsAt: toLocalInput(b.endsAt),
    isActive: b.isActive !== false,
  };
}

export default function Banners() {
  const [state, set] = useUrlState({ q: '', placement: 'all', active: 'all', page: 1 });
  const [editing, setEditing] = useState(null); // null | { banner?, initial? }
  const confirm = useConfirm();

  const list = useApiList(BASE, { q: state.q, isActive: state.active === 'all' ? undefined : state.active, page: state.page, limit: LIMIT, sort: 'sortOrder' }, { key: 'items' });

  const counts = useMemo(() => {
    const out = { all: list.rows.length };
    for (const b of list.rows) out[b.placement || 'home'] = (out[b.placement || 'home'] || 0) + 1;
    return out;
  }, [list.rows]);
  const rows = state.placement === 'all' ? list.rows : list.rows.filter((b) => (b.placement || 'home') === state.placement);

  const remove = useApiMutation((id) => apiSend('delete', `${BASE}/${id}`), { invalidate: INVALIDATE, success: 'Banner deleted.' });
  const toggle = useApiMutation((b) => apiSend('put', `${BASE}/${b._id}`, { isActive: b.isActive === false }), {
    invalidate: INVALIDATE,
    success: (_d, b) => (b.isActive === false ? 'Banner shown.' : 'Banner hidden.'),
  });

  const menu = (b) => [
    { label: 'Edit', icon: Pencil, onClick: () => setEditing({ banner: b }) },
    { label: b.isActive === false ? 'Show' : 'Hide', icon: b.isActive === false ? Eye : EyeOff, onClick: () => toggle.mutate(b), disabled: toggle.isPending },
    { label: 'Duplicate', icon: Copy, onClick: () => setEditing({ initial: { ...toForm(b), title: `${b.title} (copy)`, isActive: false } }) },
    b.link && { label: 'Open link', icon: ExternalLink, onClick: () => window.open(b.link, '_blank', 'noopener') },
    'divider',
    {
      label: 'Delete',
      icon: Trash2,
      tone: 'danger',
      onClick: async () => {
        if (await confirm({ title: `Delete “${b.title}”?`, message: 'It disappears from the storefront right away. The image stays in the media library.', confirmLabel: 'Delete banner', tone: 'danger' }))
          remove.mutate(b._id);
      },
    },
  ];

  const filtering = state.q || state.active !== 'all' || state.placement !== 'all';

  return (
    <>
      <PageHeader
        title="Banners"
        description="Promotional images for the home, shop, category and collection pages. Lower sort order shows first."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ initial: { ...EMPTY, placement: state.placement === 'all' ? 'home' : state.placement } })}>
            New banner
          </Button>
        }
      />
      <Segmented
        className="mb-3"
        value={state.placement}
        onChange={(placement) => set({ placement, page: state.page })}
        items={[{ value: 'all', label: 'All', count: counts.all }, ...PLACEMENTS.map((p) => ({ value: p.value, label: p.label, count: counts[p.value] || 0 }))]}
      />
      <Toolbar>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search titles…" />
        <FilterSelect
          label="Visibility"
          value={state.active}
          onChange={(active) => set({ active })}
          options={[
            { value: 'all', label: 'Shown & hidden' },
            { value: 'true', label: 'Shown' },
            { value: 'false', label: 'Hidden' },
          ]}
        />
      </Toolbar>

      {list.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-2xl" />
          ))}
        </div>
      ) : list.error ? (
        <Card>
          <ErrorState error={list.error} onRetry={list.refetch} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title={filtering ? 'No banners match these filters' : 'No banners yet'}
            description={filtering ? undefined : 'Add a banner to promote a collection, sale or new arrival.'}
            action={
              filtering ? (
                <Button onClick={() => set({ q: '', active: 'all', placement: 'all' })}>Clear filters</Button>
              ) : (
                <Button icon={Plus} onClick={() => setEditing({})}>
                  New banner
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className={cx('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', list.isFetching && 'opacity-70 transition-opacity')}>
          {rows.map((b) => (
            <BannerCard key={b._id} banner={b} onOpen={() => setEditing({ banner: b })} menu={menu(b)} />
          ))}
        </div>
      )}
      {list.pagination.pages > 1 && (
        <Card padded={false} className="mt-4">
          <Pagination pagination={list.pagination} onPage={(page) => set({ page })} />
        </Card>
      )}

      <BannerDrawer
        key={editing ? editing.banner?._id || `new-${editing.initial?.title || ''}-${editing.initial?.placement || ''}` : 'none'}
        open={Boolean(editing)}
        banner={editing?.banner}
        initial={editing?.initial}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function BannerCard({ banner: b, onOpen, menu }) {
  return (
    <Card padded={false} className="group overflow-hidden">
      <button type="button" onClick={onOpen} className="relative block aspect-[16/7] w-full overflow-hidden bg-raised text-left" aria-label={`Edit ${b.title}`}>
        {b.image ? (
          <img src={mediaUrl(b.image)} alt="" loading="lazy" className={cx('h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]', b.isActive === false && 'opacity-50 grayscale')} />
        ) : (
          <span className="grid h-full w-full place-items-center text-lilac">
            <ImageIcon size={22} />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <span className="absolute inset-x-3 bottom-2.5 line-clamp-2 font-serif text-base text-ivory drop-shadow">{b.title}</span>
        <span className="absolute left-3 top-2.5">
          <ScheduleBadge row={b} meta={BANNER_META} />
        </span>
        {b.mobileImage && (
          <span className="absolute right-3 top-2.5 rounded-full bg-black/60 p-1 text-ivory" title="Has a mobile image">
            <Smartphone size={12} />
          </span>
        )}
      </button>
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="min-w-0 space-y-1 text-xs text-lilac">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{PLACEMENT_LABEL[b.placement] || b.placement || 'Home'}</Badge>
            <span>Order {number(b.sortOrder ?? 0)}</span>
          </div>
          <p className="truncate">{b.link ? b.link : 'No link'}</p>
          {(b.startsAt || b.endsAt) && (
            <p className="truncate">
              {b.startsAt ? dateTime(b.startsAt) : 'Now'} → {b.endsAt ? dateTime(b.endsAt) : 'no end'}
            </p>
          )}
        </div>
        <Menu items={menu.filter(Boolean)} />
      </div>
    </Card>
  );
}

function linkError(link) {
  const l = link.trim();
  if (!l) return null;
  if (l.startsWith('/') || /^https?:\/\/\S+$/i.test(l)) return null;
  return 'Use a site path like /shop or a full https:// address.';
}

function BannerDrawer({ open, banner, initial, onClose }) {
  const isNew = !banner;
  const form = useForm(initial || toForm(banner));
  const v = form.values;
  const [device, setDevice] = useState('desktop');

  const save = useApiMutation(
    (values) => {
      const body = toPayload(
        {
          ...values,
          title: values.title.trim(),
          link: values.link.trim(),
          sortOrder: values.sortOrder === '' ? 0 : values.sortOrder,
          startsAt: fromLocalInput(values.startsAt),
          endsAt: fromLocalInput(values.endsAt),
        },
        { nullable: ['mobileImage', 'link', 'startsAt', 'endsAt'], numbers: ['sortOrder'] }
      );
      return isNew ? apiSend('post', BASE, body) : apiSend('put', `${BASE}/${banner._id}`, body);
    },
    {
      invalidate: INVALIDATE,
      success: isNew ? 'Banner created.' : 'Banner saved.',
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (info) => form.setServerErrors(info.fields),
    }
  );

  const submit = (ev) => {
    ev.preventDefault();
    const e = { ...scheduleErrors(v) };
    if (!v.title.trim()) e.title = 'Title is required.';
    if (!v.image) e.image = 'Add an image.';
    const le = linkError(v.link);
    if (le) e.link = le;
    if (Object.keys(e).length) return form.setErrors(e);
    save.mutate(v);
  };

  const previewSrc = device === 'mobile' ? v.mobileImage || v.image : v.image;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={isNew ? 'New banner' : `Edit ${banner.title}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="banner-form" loading={save.isPending} disabled={!form.dirty && !isNew}>
            {isNew ? 'Create banner' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={submit} className="space-y-7" noValidate>
        <FormSection title="Preview">
          <Segmented
            className="w-fit"
            value={device}
            onChange={setDevice}
            items={[
              { value: 'desktop', label: 'Desktop' },
              { value: 'mobile', label: 'Mobile' },
            ]}
          />
          <div className={cx('relative overflow-hidden rounded-2xl border border-white/10 bg-raised', device === 'mobile' ? 'mx-auto aspect-[4/5] w-full max-w-[16rem]' : 'aspect-[16/7] w-full')}>
            {previewSrc ? (
              <img src={mediaUrl(previewSrc)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-xs text-lilac">
                <span className="flex flex-col items-center gap-1">
                  {device === 'mobile' ? <Smartphone size={18} /> : <Monitor size={18} />}
                  No image yet
                </span>
              </span>
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute inset-x-4 bottom-3 font-serif text-lg text-ivory drop-shadow">{v.title || 'Banner title'}</span>
          </div>
          {device === 'mobile' && !v.mobileImage && v.image && <p className="text-xs text-lilac">No mobile image — phones show the desktop image, cropped.</p>}
        </FormSection>

        <FormSection title="Content">
          <Field label="Title" required error={form.errors.title}>
            {({ id, invalid }) => <Input id={id} invalid={invalid} {...form.bind('title')} placeholder="e.g. New moon collection" autoFocus={isNew} />}
          </Field>
          <FormGrid>
            <Field label="Image" required error={form.errors.image} hint="Wide image, about 16:7.">
              <MediaInput value={v.image} onChange={(url) => form.set('image', url)} folder="banner" aspect="aspect-[16/7]" />
            </Field>
            <Field label="Mobile image" hint="Optional portrait version, about 4:5.">
              <MediaInput value={v.mobileImage} onChange={(url) => form.set('mobileImage', url)} folder="banner" aspect="aspect-[4/5]" />
            </Field>
          </FormGrid>
          <Field label="Link" error={form.errors.link} hint="Where the banner goes when tapped. Empty = not clickable.">
            {({ id, invalid }) => <Input id={id} invalid={invalid} {...form.bind('link')} placeholder="/collections/new-moon" />}
          </Field>
        </FormSection>

        <FormSection title="Placement">
          <FormGrid>
            <Field label="Page">{({ id }) => <Select id={id} options={PLACEMENTS} {...form.bind('placement')} />}</Field>
            <Field label="Sort order" hint="Lower numbers show first.">
              {({ id }) => <NumberInput id={id} value={v.sortOrder} onChange={(x) => form.set('sortOrder', x)} />}
            </Field>
          </FormGrid>
        </FormSection>

        <FormSection title="Schedule">
          <ScheduleFields form={form} />
          <Switch label="Shown" description="Hidden banners never appear, even inside the schedule." checked={v.isActive} onChange={(x) => form.set('isActive', x)} />
        </FormSection>
      </form>
    </Drawer>
  );
}
