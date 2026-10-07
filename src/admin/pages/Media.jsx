import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Film, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { toast } from '../../lib/adminToast';
import { number, plural, relative } from '../lib/format';
import { apiSend, errorInfo, useApiList, useApiMutation } from '../lib/query';
import { useUrlState } from '../lib/urlState';
import { Button, Card, EmptyState, ErrorState, FilterSelect, IconButton, PageHeader, Pagination, SearchInput, Select, Skeleton, Toolbar, cx } from '../ui';
import { MediaDetailDrawer } from './content/MediaDetailDrawer';
import { ACCEPT, FOLDERS, folderLabel, formatBytes, mediaKind, validateFile } from './content/mediaFiles';

const BASE = '/admin/media';
const LIMIT = 40;

export default function Media() {
  const [state, set] = useUrlState({ q: '', folder: 'all', page: 1 });
  const [selectedId, setSelectedId] = useState(null);
  const [uploadFolder, setUploadFolder] = useState(state.folder !== 'all' ? state.folder : 'other');
  const [queue, setQueue] = useState([]); // [{ id, name, size, status: queued|uploading|done|error, progress, error }]
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const seq = useRef(0);

  const list = useApiList(BASE, { q: state.q, folder: state.folder, page: state.page, limit: LIMIT }, { key: 'media' });
  const selected = selectedId ? list.rows.find((m) => m._id === selectedId) : null;

  // Folders seen in the data that are not in the standard list (custom folders set in the detail drawer).
  const folders = [...FOLDERS];
  for (const m of list.rows) if (m.folder && !folders.some((f) => f.value === m.folder)) folders.push({ value: m.folder, label: m.folder });
  if (state.folder !== 'all' && !folders.some((f) => f.value === state.folder)) folders.push({ value: state.folder, label: state.folder });

  const patch = (id, p) => setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...p } : it)));

  // Files go up one at a time so progress is meaningful and one failure does not stop the rest.
  const upload = useApiMutation(
    async ({ items, folder }) => {
      let ok = 0;
      let failed = 0;
      for (const it of items) {
        patch(it.id, { status: 'uploading', progress: 0 });
        try {
          const fd = new FormData();
          fd.append('file', it.file);
          fd.append('folder', folder);
          await apiSend('post', BASE, fd, {
            onUploadProgress: (e) => patch(it.id, { progress: e.total ? Math.round((e.loaded / e.total) * 100) : null }),
          });
          patch(it.id, { status: 'done', progress: 100 });
          ok += 1;
        } catch (err) {
          patch(it.id, { status: 'error', error: errorInfo(err).message });
          failed += 1;
        }
      }
      return { ok, failed };
    },
    {
      invalidate: [BASE],
      success: (r) => (r.ok ? `${plural(r.ok, 'file')} uploaded${r.failed ? `, ${r.failed} failed` : ''}.` : false),
      onSuccess: (r) => {
        if (!r.ok && r.failed) toast(`${plural(r.failed, 'file')} could not be uploaded.`, 'error');
      },
    }
  );

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (upload.isPending) return toast('Wait for the current upload to finish.', 'error');
    const items = files.map((file) => {
      const problem = validateFile(file);
      seq.current += 1;
      return { id: seq.current, file, name: file.name, size: file.size, status: problem ? 'error' : 'queued', error: problem, progress: 0 };
    });
    setQueue(items.map(({ file: _file, ...rest }) => rest));
    const valid = items.filter((i) => i.status === 'queued');
    if (valid.length) upload.mutate({ items: valid, folder: uploadFolder });
    else toast('None of the files can be uploaded.', 'error');
  }

  const filtered = state.q || state.folder !== 'all';

  return (
    <div
      className="relative"
      onDragEnter={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) setDragging(true);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <PageHeader
        title="Media"
        description="Every uploaded image and video. Images up to 15 MB (JPEG, PNG, WebP, GIF, AVIF), videos up to 40 MB (MP4, WebM, MOV)."
        actions={
          <>
            <Select aria-label="Upload to folder" className="w-auto" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} options={folders.map((f) => ({ value: f.value, label: `Upload to: ${f.label}` }))} />
            <Button variant="primary" icon={Upload} loading={upload.isPending} onClick={() => fileRef.current?.click()}>
              Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              hidden
              multiple
              accept={ACCEPT}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </>
        }
      />

      {queue.length > 0 && <UploadQueue queue={queue} busy={upload.isPending} onClear={() => setQueue([])} />}

      <Toolbar right={<span className="text-xs text-lilac">{list.isLoading ? '' : plural(list.pagination.total, 'file')}</span>}>
        <SearchInput value={state.q} onChange={(q) => set({ q })} placeholder="Search name or tag…" />
        <FilterSelect label="Folder" value={state.folder} onChange={(folder) => set({ folder })} options={[{ value: 'all', label: 'All folders' }, ...folders]} />
      </Toolbar>

      <Card padded={false} className={cx('overflow-hidden', list.isFetching && !list.isLoading && 'opacity-80')}>
        {list.isLoading ? (
          <Grid>
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </Grid>
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : list.rows.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={filtered ? 'No files match' : 'No media yet'}
            description={filtered ? 'Try another search or folder.' : 'Upload images and videos, or drop files anywhere on this page.'}
            action={!filtered && <Button icon={Upload} onClick={() => fileRef.current?.click()}>Upload files</Button>}
          />
        ) : (
          <Grid>
            {list.rows.map((m) => (
              <MediaTile key={m._id} item={m} onOpen={() => setSelectedId(m._id)} />
            ))}
          </Grid>
        )}
        <Pagination pagination={list.pagination} onPage={(page) => set({ page })} />
      </Card>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-gold/60 bg-surface px-10 py-8 text-center">
            <Upload className="mx-auto mb-2 text-gold" size={26} />
            <p className="text-sm text-ivory">Drop files to upload</p>
            <p className="mt-1 text-xs text-lilac">Into “{folderLabel(uploadFolder)}”</p>
          </div>
        </div>
      )}

      {selected && <MediaDetailDrawer key={selected._id} item={selected} folders={folders} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 xl:grid-cols-6">{children}</div>;
}

function MediaTile({ item, onOpen }) {
  const src = mediaUrl(item.url);
  const video = mediaKind(item) === 'video';
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group min-w-0 overflow-hidden rounded-xl border border-white/10 bg-raised text-left transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <div className="relative aspect-square bg-black/20">
        {video ? (
          <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img src={src} alt={item.originalName || ''} loading="lazy" className="h-full w-full object-cover" />
        )}
        {video && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-ivory">
            <Film size={11} /> Video
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="truncate text-xs text-ivory" title={item.originalName || item.filename}>
          {item.originalName || item.filename}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-lilac">
          {folderLabel(item.folder)} · {item.size ? formatBytes(item.size) : '—'} · {relative(item.createdAt)}
        </p>
      </div>
    </button>
  );
}

function UploadQueue({ queue, busy, onClear }) {
  const done = queue.filter((q) => q.status === 'done').length;
  const failed = queue.filter((q) => q.status === 'error').length;
  return (
    <Card className="mb-4" padded={false}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-2.5">
        <p className="text-sm text-ivory">
          {busy ? `Uploading ${number(done + failed + 1)} of ${number(queue.length)}…` : `${number(done)} uploaded${failed ? `, ${number(failed)} failed` : ''}`}
        </p>
        {!busy && <IconButton icon={X} size="sm" label="Dismiss upload list" onClick={onClear} />}
      </div>
      <ul className="max-h-56 divide-y divide-white/[0.05] overflow-y-auto">
        {queue.map((q) => (
          <li key={q.id} className="flex items-center gap-3 px-4 py-2 text-xs">
            {q.status === 'done' ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />
            ) : q.status === 'error' ? (
              <AlertCircle size={15} className="shrink-0 text-rose-300" />
            ) : (
              <Loader2 size={15} className={cx('shrink-0 text-gold', q.status === 'uploading' && 'animate-spin')} />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-ivory">
                {q.name} <span className="text-lilac">· {formatBytes(q.size)}</span>
              </p>
              {q.status === 'error' && <p className="text-rose-300">{q.error}</p>}
              {q.status === 'uploading' && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gold transition-[width]" style={{ width: `${q.progress ?? 5}%` }} />
                </div>
              )}
            </div>
            <span className="shrink-0 tabular-nums text-lilac">
              {q.status === 'uploading' ? (q.progress != null ? `${q.progress}%` : '…') : q.status === 'queued' ? 'Waiting' : q.status === 'done' ? 'Done' : 'Failed'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
