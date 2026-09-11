import api, { mediaUrl } from '../../api/client';
import { fieldClass, labelClass } from './AdminHeader';

function isVideo(url = '') {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /youtube|youtu\.be|vimeo/.test(url);
}

export default function MediaField({ label = 'Image', value = '', onChange, accept = 'image/*' }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <input
        className={`${fieldClass} mt-1`}
        placeholder="URL or /uploads/…"
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
        <label className="cursor-pointer text-[10px] uppercase tracking-widest text-gold">
          Upload file
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const fd = new FormData();
              fd.append('file', file);
              const { data } = await api.post('/admin/media', fd);
              onChange(data.media.url);
            }}
          />
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
