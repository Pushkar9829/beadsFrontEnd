import { Star } from 'lucide-react';
import { mediaUrl } from '../../api/client';
import InViewGroup from '../ui/InViewGroup';
import crystals from '../../assets/home/house-crystals.jpg';
import gemstones from '../../assets/home/house-gemstones.jpg';
import rudraksha from '../../assets/home/house-rudraksha.jpg';

export const DEFAULT_TESTIMONIALS = [
  {
    quote:
      'The Mulank calibration felt considered. I wear it every day and it still feels made for me — not picked from a tray.',
    name: 'Ananya M.',
    place: 'Mumbai',
    piece: 'Customization · Love',
    media: crystals,
  },
  {
    quote:
      'I asked for abundance and they did not oversell it. Citrine and pyrite sit quietly on the wrist. That is what I wanted.',
    name: 'Rohan S.',
    place: 'Bengaluru',
    piece: 'Customization · Money',
    media: gemstones,
  },
  {
    quote:
      'The atelier tone is rare. Packaging, engraving, the note — all of it felt like a house, not a catalogue.',
    name: 'Meera K.',
    place: 'Delhi',
    piece: 'Rudraksha house',
    media: rudraksha,
  },
];

const FALLBACK_MEDIA = [crystals, gemstones, rudraksha];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'KS';
}

function resolveMedia(src) {
  if (!src) return '';
  if (/^(\/assets\/|\/src\/|data:|blob:)/.test(src)) return src;
  return mediaUrl(src);
}

function youtubeId(url = '') {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?v=))([\w-]{11})/);
  return m?.[1] || '';
}

function vimeoId(url = '') {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] || '';
}

function isVideoFile(url = '') {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function VoiceMedia({ src, name }) {
  const url = resolveMedia(src);
  if (!url) return null;

  const yt = youtubeId(url);
  if (yt) {
    return (
      <div className="voice-media">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`}
          title={`${name} testimonial`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const vimeo = vimeoId(url);
  if (vimeo) {
    return (
      <div className="voice-media">
        <iframe
          src={`https://player.vimeo.com/video/${vimeo}`}
          title={`${name} testimonial`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVideoFile(url)) {
    return (
      <div className="voice-media">
        <video src={url} muted loop playsInline autoPlay controls preload="metadata" />
      </div>
    );
  }

  return (
    <div className="voice-media">
      <img src={url} alt="" />
    </div>
  );
}

export default function Testimonials({ items }) {
  const voices = (items || []).filter((v) => v.quote && v.name);
  const notes = voices.length ? voices : DEFAULT_TESTIMONIALS;

  return (
    <InViewGroup className="voice-grid mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {notes.map((v, i) => (
        <article key={`${v.name}-${i}`} className="voice-card" style={{ '--i': i }}>
          <VoiceMedia src={v.media || FALLBACK_MEDIA[i % FALLBACK_MEDIA.length]} name={v.name} />
          <div className="voice-body">
            <div className="voice-stars" aria-label="5 out of 5">
              {Array.from({ length: 5 }, (_, s) => (
                <Star key={s} size={11} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="voice-quote">{v.quote}</blockquote>
            <footer className="voice-who">
              <span className="voice-avatar">{initials(v.name)}</span>
              <span>
                <cite className="voice-name">{v.name}</cite>
                <span className="voice-meta">
                  {v.place}
                  {v.piece ? ` · ${v.piece}` : ''}
                </span>
              </span>
            </footer>
          </div>
        </article>
      ))}
    </InViewGroup>
  );
}
