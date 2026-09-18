import { useState } from 'react';
import { mediaUrl } from '../../api/client';
import { uploadAdminMedia } from '../../api/uploadMedia';
import { fieldClass, labelClass } from './AdminHeader';
import { toast } from '../../lib/adminToast';

function isVideo(url = '') {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /youtube|youtu\.be|vimeo/.test(url);
}

export default function MediaField({
  label = 'Image',
  value = '',
  onChange,
  accept = 'image/*',
  folder = 'other',
}) {
  const [busy, setBusy] = useState(false);

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const media = await uploadAdminMedia(file, folder);
      onChange(media.url);
      toast('Uploaded to S3.');
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <input
        className={`${fieldClass} mt-1`}
        placeholder="CloudFront URL or upload below"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        isVideo(value) ? (
          <p className="mt-1 text-xs text-lilac">Video attached.</p>
        ) : (
          <img src={mediaUrl(value)} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
        )
      ) : null}
      <div className="mt-2 flex gap-3">
        <label className={`cursor-pointer text-[10px] uppercase tracking-widest ${busy ? 'text-lilac' : 'text-gold'}`}>
          {busy ? 'Uploading…' : 'Upload file'}
          <input type="file" accept={accept} className="hidden" disabled={busy} onChange={onPick} />
        </label>
        {value ? (
          <button
            type="button"
            className="text-[10px] uppercase tracking-widest text-red-300"
            onClick={() => onChange('')}
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function MediaListField({
  label = 'Images',
  value = [],
  onChange,
  accept = 'image/*',
  folder = 'product',
}) {
  const urls = Array.isArray(value) ? value.filter(Boolean) : [];
  const [busy, setBusy] = useState(false);

  async function onPick(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const media = await uploadAdminMedia(file, folder);
        uploaded.push(media.url);
      }
      onChange([...urls, ...uploaded]);
      toast(uploaded.length > 1 ? `${uploaded.length} files uploaded.` : 'Uploaded to S3.');
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function removeAt(index) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div key={`${url}-${i}`} className="relative">
            {isVideo(url) ? (
              <p className="flex h-20 items-center justify-center rounded-lg bg-raised text-[10px] text-lilac">Video</p>
            ) : (
              <img src={mediaUrl(url)} alt="" className="h-20 w-full rounded-lg object-cover" />
            )}
            <button
              type="button"
              className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-[10px] text-red-200"
              onClick={() => removeAt(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <label className={`mt-2 inline-block cursor-pointer text-[10px] uppercase tracking-widest ${busy ? 'text-lilac' : 'text-gold'}`}>
        {busy ? 'Uploading…' : 'Upload images'}
        <input type="file" accept={accept} multiple className="hidden" disabled={busy} onChange={onPick} />
      </label>
    </div>
  );
}
