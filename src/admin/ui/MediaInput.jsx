import { useRef, useState } from 'react';
import { Image as ImageIcon, Library, Trash2, Upload } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import { uploadAdminMedia } from '../../api/uploadMedia';
import { toast } from '../../lib/adminToast';
import { errorInfo, useApiList, useQueryClient } from '../lib/query';
import { Button, EmptyState, IconButton, Skeleton, cx } from './primitives';
import { Input } from './form';
import { Modal } from './overlay';
import { SearchInput } from './table';

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
const VIDEO_TYPES = 'video/mp4,video/webm,video/quicktime';

export function isVideoUrl(url = '') {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

/**
 * Single image/video picker: upload, choose from the media library, paste a URL, or clear.
 * value: url string. Uses the server's type whitelist (no SVG).
 */
export function MediaInput({ value = '', onChange, folder = 'other', allowVideo = false, aspect = 'aspect-square', className }) {
  const [busy, setBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const media = await uploadAdminMedia(file, folder);
      onChange(media.url);
      qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('/admin/media') });
      toast('Uploaded.');
    } catch (err) {
      toast(errorInfo(err).message || 'Upload failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const src = value ? mediaUrl(value) : '';
  return (
    <div className={cx('space-y-2', className)}>
      <div className={cx('relative w-full max-w-[14rem] overflow-hidden rounded-xl border border-dashed border-white/15 bg-raised', aspect)}>
        {busy ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : src ? (
          isVideoUrl(src) ? (
            <video src={src} className="h-full w-full object-cover" muted playsInline controls />
          ) : (
            <img src={src} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className="grid h-full w-full place-items-center text-lilac hover:text-gold">
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImageIcon size={20} />
              Upload
            </span>
          </button>
        )}
        {src && !busy && (
          <IconButton icon={Trash2} label="Remove" size="sm" variant="secondary" className="absolute right-2 top-2 bg-black/60" onClick={() => onChange('')} />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={Upload} loading={busy} onClick={() => fileRef.current?.click()}>
          {src ? 'Replace' : 'Upload'}
        </Button>
        <Button size="sm" variant="ghost" icon={Library} onClick={() => setLibraryOpen(true)}>
          Library
        </Button>
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="…or paste an image URL" className="h-8 text-xs" />
      <input ref={fileRef} type="file" hidden accept={allowVideo ? `${IMAGE_TYPES},${VIDEO_TYPES}` : IMAGE_TYPES} onChange={onPick} />
      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}

/** Ordered gallery of images (e.g. product images). value: string[] */
export function GalleryInput({ value = [], onChange, folder = 'products', max = 12 }) {
  const [adding, setAdding] = useState(false);
  const move = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-raised">
            <img src={mediaUrl(url)} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-gold px-1.5 text-[10px] font-medium text-ink">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" className="px-1.5 text-xs text-ivory disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move left">
                ←
              </button>
              <button type="button" className="px-1.5 text-xs text-rose-300" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove image">
                Remove
              </button>
              <button type="button" className="px-1.5 text-xs text-ivory disabled:opacity-30" disabled={i === value.length - 1} onClick={() => move(i, i + 1)} aria-label="Move right">
                →
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/15 text-xs text-lilac hover:border-gold/40 hover:text-gold"
          >
            + Add image
          </button>
        )}
      </div>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add image" size="sm">
        <MediaInput
          folder={folder}
          value=""
          onChange={(url) => {
            if (url) onChange([...value, url]);
            setAdding(false);
          }}
        />
      </Modal>
    </div>
  );
}

export function MediaLibraryModal({ open, onClose, onSelect }) {
  const [q, setQ] = useState('');
  const { rows, isLoading } = useApiList('/admin/media', { q, limit: 60 }, { enabled: open, key: 'media' });
  return (
    <Modal open={open} onClose={onClose} title="Media library" size="lg">
      <SearchInput value={q} onChange={setQ} placeholder="Search media…" className="mb-4 sm:w-full" />
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No media found" description="Upload files from any image field or the Media page." />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {rows.map((m) => (
            <button
              key={m._id}
              type="button"
              onClick={() => onSelect(m.url)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-raised hover:border-gold/60"
              title={m.originalName || m.filename}
            >
              {isVideoUrl(m.url) ? (
                <video src={mediaUrl(m.url)} className="h-full w-full object-cover" muted />
              ) : (
                <img src={mediaUrl(m.url)} alt={m.alt || ''} loading="lazy" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
