import { useRef, useState } from 'react';
import { Copy, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { mediaUrl } from '../../../api/client';
import { toast } from '../../../lib/adminToast';
import { dateTime } from '../../lib/format';
import { apiSend, useApiMutation } from '../../lib/query';
import { Button, DescriptionList, Drawer, Field, FormGrid, Input, TagInput, useConfirm, useForm } from '../../ui';
import { ACCEPT, FOLDERS, folderLabel, formatBytes, mediaKind, normalizeFolder, validateFile } from './mediaFiles';

const BASE = '/admin/media';

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('Copied to clipboard.');
}

/** Detail / edit drawer for one media item: preview, URL, metadata, folder + tags, replace, delete. */
export function MediaDetailDrawer({ item, onClose, folders = FOLDERS }) {
  const confirm = useConfirm();
  const fileRef = useRef(null);
  const [dims, setDims] = useState(null);
  const [progress, setProgress] = useState(null);
  const form = useForm({ folder: item?.folder || 'other', tags: item?.tags || [] });

  const save = useApiMutation(
    // Tags are always sent: the API overwrites them on every update.
    (values) => apiSend('put', `${BASE}/${item._id}`, { folder: normalizeFolder(values.folder), tags: values.tags || [] }),
    { invalidate: [BASE], success: 'Details saved.', onSuccess: (data) => form.reset({ folder: data?.media?.folder || 'other', tags: data?.media?.tags || [] }) }
  );
  const replace = useApiMutation(
    (file) => {
      const fd = new FormData();
      fd.append('file', file);
      // Keep the item in its own folder (the old page moved it to the toolbar's folder).
      fd.append('folder', item.folder || 'other');
      return apiSend('post', `${BASE}/${item._id}/replace`, fd, {
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : null),
      });
    },
    {
      invalidate: [BASE],
      success: 'File replaced. Copy the new URL into any page that used the old one.',
      onSuccess: () => {
        setDims(null);
        setProgress(null);
      },
      onError: () => setProgress(null),
    }
  );
  const remove = useApiMutation(() => apiSend('delete', `${BASE}/${item._id}`), {
    invalidate: [BASE],
    success: 'File deleted.',
    onSuccess: onClose,
  });

  if (!item) return null;
  const src = mediaUrl(item.url);
  const kind = mediaKind(item);
  const busy = save.isPending || replace.isPending || remove.isPending;

  async function onReplacePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateFile(file);
    if (problem) return toast(`${file.name}: ${problem}`, 'error');
    const ok = await confirm({
      title: 'Replace this file?',
      message: (
        <>
          <p>
            “{file.name}” ({formatBytes(file.size)}) replaces “{item.originalName || item.filename}”, and the old file is deleted.
          </p>
          <p className="mt-2 text-amber-200">The file gets a new URL. Products, pages and banners that use the old URL will show a broken image until you update them.</p>
        </>
      ),
      confirmLabel: 'Replace file',
      tone: 'danger',
    });
    if (ok) replace.mutate(file);
  }

  async function onDelete() {
    const ok = await confirm({
      title: 'Delete this file permanently?',
      message: 'The file is removed from storage. Any product, page or banner still using it will show a broken image. This cannot be undone.',
      confirmLabel: 'Delete file',
      tone: 'danger',
    });
    if (ok) remove.mutate();
  }

  const folderOptions = [...new Set([...folders.map((f) => f.value), item.folder].filter(Boolean))];

  return (
    <Drawer
      open
      onClose={onClose}
      dirty={form.dirty}
      width="lg"
      title={item.originalName || item.filename || 'Media file'}
      footer={
        <>
          <Button variant="danger" icon={Trash2} className="mr-auto" onClick={onDelete} disabled={busy} loading={remove.isPending}>
            Delete
          </Button>
          <Button icon={RefreshCw} onClick={() => fileRef.current?.click()} disabled={busy} loading={replace.isPending}>
            {replace.isPending && progress != null ? `Uploading ${progress}%` : 'Replace file'}
          </Button>
          <Button variant="primary" type="submit" form="media-form" disabled={!form.dirty || busy} loading={save.isPending}>
            Save details
          </Button>
        </>
      }
    >
      <input ref={fileRef} type="file" hidden accept={ACCEPT} onChange={onReplacePick} />
      <div className="space-y-6">
        <div className="grid place-items-center overflow-hidden rounded-xl border border-white/10 bg-[repeating-conic-gradient(rgba(255,255,255,0.04)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]">
          {kind === 'video' ? (
            <video
              key={src}
              src={src}
              controls
              playsInline
              className="max-h-[50vh] w-full"
              onLoadedMetadata={(e) => setDims({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight, d: e.currentTarget.duration })}
            />
          ) : (
            <img
              key={src}
              src={src}
              alt={item.originalName || ''}
              className="max-h-[50vh] w-auto max-w-full object-contain"
              onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            />
          )}
        </div>

        <Field label="File URL" hint="Paste this into any image field. It changes if the file is replaced.">
          {({ id }) => (
            <div className="flex gap-2">
              <Input id={id} readOnly value={item.url} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
              <Button icon={Copy} onClick={() => copyText(item.url)}>
                Copy
              </Button>
              <a href={src} target="_blank" rel="noreferrer" aria-label="Open file in a new tab" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lilac hover:bg-white/[0.06] hover:text-ivory">
                <ExternalLink size={15} />
              </a>
            </div>
          )}
        </Field>

        <DescriptionList
          items={[
            { label: 'Type', value: item.mimeType || kind },
            { label: 'Size', value: item.size ? formatBytes(item.size) : '—' },
            { label: 'Dimensions', value: dims?.w ? `${dims.w} × ${dims.h} px${dims.d ? ` · ${Math.round(dims.d)} s` : ''}` : '—' },
            { label: 'Folder', value: folderLabel(item.folder) },
            { label: 'Uploaded', value: dateTime(item.createdAt) },
            { label: 'Last changed', value: dateTime(item.updatedAt) },
            { label: 'Storage', value: item.storage === 's3' ? 'Cloud (S3)' : item.storage === 'remote' ? 'External link' : 'Server' },
            { label: 'Stored name', value: <span className="break-all font-mono text-xs">{item.filename || '—'}</span> },
          ]}
        />

        <form
          id="media-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.dirty) save.mutate(form.values);
          }}
          className="space-y-4"
        >
          <FormGrid>
            <Field label="Folder" hint="Lowercase letters, numbers, - and _.">
              {({ id }) => (
                <>
                  <Input id={id} list="media-folders" value={form.values.folder} onChange={(e) => form.set('folder', e.target.value.toLowerCase())} />
                  <datalist id="media-folders">
                    {folderOptions.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
          </FormGrid>
          <Field label="Tags" hint="Used by search. Press Enter after each tag.">
            <TagInput value={form.values.tags || []} onChange={(tags) => form.set('tags', tags)} />
          </Field>
        </form>
      </div>
    </Drawer>
  );
}
