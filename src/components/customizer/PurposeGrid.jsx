import { useCustomizerStore } from '../../store/customizerStore';
import loveIcon from '../../assets/purposes/love-3d.png';
import moneyIcon from '../../assets/purposes/purpose-money.png';
import careerIcon from '../../assets/purposes/purpose-career.png';
import confidenceIcon from '../../assets/purposes/purpose-confidence.png';
import protectionIcon from '../../assets/purposes/purpose-protection.png';
import focusIcon from '../../assets/purposes/purpose-focus.png';
import calmIcon from '../../assets/purposes/purpose-calm.png';
import sleepIcon from '../../assets/purposes/purpose-sleep.png';
import energyIcon from '../../assets/purposes/purpose-energy.png';
import spiritIcon from '../../assets/purposes/purpose-spirit.png';
import beginningsIcon from '../../assets/purposes/purpose-beginnings.png';
import communicationIcon from '../../assets/purposes/purpose-communication.png';
import balanceIcon from '../../assets/purposes/purpose-balance.png';

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

const IMAGES = [
  { match: /love|relation/i, src: loveIcon },
  { match: /money|abund/i, src: moneyIcon },
  { match: /career|success/i, src: careerIcon },
  { match: /confidence|power/i, src: confidenceIcon },
  { match: /protect|ground/i, src: protectionIcon },
  { match: /focus|clarit/i, src: focusIcon },
  { match: /calm|emotion/i, src: calmIcon },
  { match: /sleep|relax/i, src: sleepIcon },
  { match: /energy|vital/i, src: energyIcon },
  { match: /spirit/i, src: spiritIcon },
  { match: /begin/i, src: beginningsIcon },
  { match: /communicat|express/i, src: communicationIcon },
  { match: /balance/i, src: balanceIcon },
];

const TONES = [
  { match: /love|relation|heart|romance|tender|partner|self-love|self worth/i, vars: {
    '--purpose-bg': '#3a1424',
    '--purpose-wash': 'rgba(232, 120, 160, 0.42)',
    '--purpose-border': 'rgba(232, 160, 191, 0.55)',
    '--purpose-glow': 'rgba(196, 70, 120, 0.3)',
    '--purpose-well': 'rgba(232, 160, 191, 0.24)',
  } },
  { match: /money|abund|wealth|income|prosper|invest|debt|saving|financial/i, vars: {
    '--purpose-bg': '#102a1c',
    '--purpose-wash': 'rgba(80, 190, 120, 0.38)',
    '--purpose-border': 'rgba(198, 167, 94, 0.5)',
    '--purpose-glow': 'rgba(46, 140, 88, 0.28)',
    '--purpose-well': 'rgba(80, 190, 120, 0.2)',
  } },
  { match: /career|success|ambition|recognition|business|advancement/i, vars: {
    '--purpose-bg': '#121a32',
    '--purpose-wash': 'rgba(198, 167, 94, 0.32)',
    '--purpose-border': 'rgba(198, 167, 94, 0.55)',
    '--purpose-glow': 'rgba(70, 90, 170, 0.28)',
    '--purpose-well': 'rgba(198, 167, 94, 0.18)',
  } },
  { match: /confidence|power|will|presence|voice/i, vars: {
    '--purpose-bg': '#3a1c0e',
    '--purpose-wash': 'rgba(232, 140, 70, 0.4)',
    '--purpose-border': 'rgba(232, 160, 90, 0.55)',
    '--purpose-glow': 'rgba(200, 90, 40, 0.28)',
    '--purpose-well': 'rgba(232, 140, 70, 0.22)',
  } },
  { match: /protect|ground|held|rooted|bound|shield/i, vars: {
    '--purpose-bg': '#102418',
    '--purpose-wash': 'rgba(90, 170, 110, 0.36)',
    '--purpose-border': 'rgba(120, 180, 130, 0.5)',
    '--purpose-glow': 'rgba(40, 110, 70, 0.28)',
    '--purpose-well': 'rgba(90, 170, 110, 0.2)',
  } },
  { match: /focus|clarit|mind|concentration/i, vars: {
    '--purpose-bg': '#1a1236',
    '--purpose-wash': 'rgba(140, 100, 210, 0.4)',
    '--purpose-border': 'rgba(168, 130, 220, 0.5)',
    '--purpose-glow': 'rgba(107, 63, 160, 0.3)',
    '--purpose-well': 'rgba(140, 100, 210, 0.22)',
  } },
  { match: /calm|emotion|soften|evenness|peace/i, vars: {
    '--purpose-bg': '#162430',
    '--purpose-wash': 'rgba(140, 180, 200, 0.36)',
    '--purpose-border': 'rgba(170, 200, 210, 0.48)',
    '--purpose-glow': 'rgba(80, 140, 160, 0.26)',
    '--purpose-well': 'rgba(140, 180, 200, 0.2)',
  } },
  { match: /sleep|relax|rest|night|dream/i, vars: {
    '--purpose-bg': '#10141f',
    '--purpose-wash': 'rgba(170, 180, 210, 0.32)',
    '--purpose-border': 'rgba(190, 198, 220, 0.45)',
    '--purpose-glow': 'rgba(90, 100, 150, 0.26)',
    '--purpose-well': 'rgba(170, 180, 210, 0.18)',
  } },
  { match: /energy|vital|sun|strength/i, vars: {
    '--purpose-bg': '#32240c',
    '--purpose-wash': 'rgba(232, 190, 70, 0.4)',
    '--purpose-border': 'rgba(232, 196, 90, 0.55)',
    '--purpose-glow': 'rgba(200, 150, 40, 0.28)',
    '--purpose-well': 'rgba(232, 190, 70, 0.22)',
  } },
  { match: /spirit|soul|divine|sacred/i, vars: {
    '--purpose-bg': '#241436',
    '--purpose-wash': 'rgba(170, 110, 220, 0.4)',
    '--purpose-border': 'rgba(186, 140, 230, 0.5)',
    '--purpose-glow': 'rgba(130, 70, 190, 0.3)',
    '--purpose-well': 'rgba(170, 110, 220, 0.22)',
  } },
  { match: /begin|new|fresh|growth|seed/i, vars: {
    '--purpose-bg': '#14281a',
    '--purpose-wash': 'rgba(110, 190, 120, 0.36)',
    '--purpose-border': 'rgba(140, 200, 150, 0.5)',
    '--purpose-glow': 'rgba(60, 140, 80, 0.26)',
    '--purpose-well': 'rgba(110, 190, 120, 0.2)',
  } },
  { match: /communicat|express|speak|voice|listen/i, vars: {
    '--purpose-bg': '#102430',
    '--purpose-wash': 'rgba(90, 170, 220, 0.38)',
    '--purpose-border': 'rgba(120, 186, 230, 0.5)',
    '--purpose-glow': 'rgba(50, 130, 190, 0.28)',
    '--purpose-well': 'rgba(90, 170, 220, 0.2)',
  } },
  { match: /balance|harmony|center|align/i, vars: {
    '--purpose-bg': '#102824',
    '--purpose-wash': 'rgba(90, 190, 170, 0.36)',
    '--purpose-border': 'rgba(198, 167, 94, 0.48)',
    '--purpose-glow': 'rgba(50, 140, 120, 0.26)',
    '--purpose-well': 'rgba(90, 190, 170, 0.2)',
  } },
];

const FALLBACK_TONES = [
  {
    '--purpose-bg': '#2a1830',
    '--purpose-wash': 'rgba(170, 110, 200, 0.32)',
    '--purpose-border': 'rgba(186, 140, 220, 0.45)',
    '--purpose-glow': 'rgba(107, 63, 160, 0.24)',
    '--purpose-well': 'rgba(170, 110, 200, 0.18)',
  },
  {
    '--purpose-bg': '#1c2430',
    '--purpose-wash': 'rgba(198, 167, 94, 0.28)',
    '--purpose-border': 'rgba(198, 167, 94, 0.45)',
    '--purpose-glow': 'rgba(198, 167, 94, 0.2)',
    '--purpose-well': 'rgba(198, 167, 94, 0.16)',
  },
  {
    '--purpose-bg': '#241820',
    '--purpose-wash': 'rgba(210, 130, 150, 0.3)',
    '--purpose-border': 'rgba(220, 160, 175, 0.45)',
    '--purpose-glow': 'rgba(160, 70, 100, 0.22)',
    '--purpose-well': 'rgba(210, 130, 150, 0.16)',
  },
];

function haystack(item) {
  return `${item.slug || ''} ${item.name || ''} ${item.description || ''}`;
}

export function purposeToneStyle(item) {
  const hay = haystack(item);
  const found = TONES.find((tone) => tone.match.test(hay));
  if (found) return found.vars;
  let hash = 0;
  for (let i = 0; i < hay.length; i += 1) hash = (hash * 31 + hay.charCodeAt(i)) >>> 0;
  return FALLBACK_TONES[hash % FALLBACK_TONES.length];
}

export function emojiFor(purpose) {
  const hay = `${purpose.slug || ''} ${purpose.name || ''}`;
  return purpose.icon || LOOKS.find((item) => item.match.test(hay))?.emoji || '✨';
}

export function PurposeIcon({ purpose }) {
  const hay = `${purpose.slug || ''} ${purpose.name || ''}`;
  const src = IMAGES.find((item) => item.match.test(hay))?.src;
  if (src) {
    return <img src={src} alt="" className="purpose-pick-icon" />;
  }
  return emojiFor(purpose);
}

export function purposeHasImage(purpose) {
  const hay = `${purpose.slug || ''} ${purpose.name || ''}`;
  return IMAGES.some((item) => item.match.test(hay));
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
            style={purposeToneStyle(p)}
          >
            <span className={`purpose-pick-emoji ${purposeHasImage(p) ? 'is-image' : ''}`} aria-hidden>
              <PurposeIcon purpose={p} />
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
