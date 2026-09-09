import { useCustomizerStore } from '../../store/customizerStore';

const LOOKS = [
  { match: /love|relation/i, emoji: '🩷' },
  { match: /money|abund/i, emoji: '💎' },
  { match: /career|success/i, emoji: '👑' },
  { match: /confidence|power/i, emoji: '🔥' },
  { match: /protect|ground/i, emoji: '🛡️' },
  { match: /focus|clarit/i, emoji: '🔮' },
  { match: /calm|emotion/i, emoji: '🪷' },
  { match: /sleep|relax/i, emoji: '🌙' },
  { match: /energy|vital/i, emoji: '☀️' },
  { match: /spirit/i, emoji: '✨' },
  { match: /begin/i, emoji: '🌱' },
  { match: /communicat|express/i, emoji: '💬' },
  { match: /balance/i, emoji: '⚖️' },
];

function emojiFor(purpose) {
  const hay = `${purpose.slug || ''} ${purpose.name || ''}`;
  return purpose.icon || LOOKS.find((item) => item.match.test(hay))?.emoji || '✨';
}

export default function PurposeGrid() {
  const purposes = useCustomizerStore((s) => s.purposes);
  const selected = useCustomizerStore((s) => s.purpose);
  const selectPurpose = useCustomizerStore((s) => s.selectPurpose);

  return (
    <div className="purpose-pick">
      {purposes.map((p) => {
        const on = selected?._id === p._id;
        return (
          <button
            key={p._id}
            type="button"
            onClick={() => selectPurpose(p)}
            className={`purpose-pick-card ${on ? 'is-on' : ''}`}
          >
            <span className="purpose-pick-emoji" aria-hidden>
              {emojiFor(p)}
            </span>
            <span className="purpose-pick-copy">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
            </span>
          </button>
        );
      })}
    </div>
  );
}
