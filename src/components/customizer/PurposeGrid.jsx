import { mediaUrl } from '../../api/client';
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

// Matched against slug, name and theme, so the zodiac, planetary, profession and numerology
// grids resolve to the same artwork as the purposes. (The source's cards are all cream, so the
// old per-purpose colour tones are gone.)
const IMAGES = [
  { match: /love|relation/i, src: loveIcon },
  { match: /money|abund|prosper/i, src: moneyIcon },
  { match: /career|success/i, src: careerIcon },
  { match: /confidence|power/i, src: confidenceIcon },
  { match: /protect|ground/i, src: protectionIcon },
  { match: /focus|clarit/i, src: focusIcon },
  { match: /calm|emotion/i, src: calmIcon },
  { match: /sleep|relax/i, src: sleepIcon },
  { match: /energy|vital|courage|strength|passion/i, src: energyIcon },
  { match: /spirit/i, src: spiritIcon },
  { match: /begin/i, src: beginningsIcon },
  { match: /communicat|express/i, src: communicationIcon },
  { match: /balance/i, src: balanceIcon },
];

// Artwork deliberately ignores `description`: a purpose whose blurb happens to mention
// an earlier pattern's keyword would otherwise be pulled off its own icon.
function iconHaystack(item) {
  return `${item.slug || ''} ${item.name || ''} ${item.theme || ''}`;
}

function emojiFor(purpose) {
  const hay = iconHaystack(purpose);
  return purpose.icon || LOOKS.find((item) => item.match.test(hay))?.emoji || '✨';
}

export function PurposeIcon({ purpose }) {
  if (purpose?.image) {
    return <img src={mediaUrl(purpose.image)} alt="" className="purpose-pick-icon" />;
  }
  if (purpose?.icon) return purpose.icon;
  const src = IMAGES.find((item) => item.match.test(iconHaystack(purpose)))?.src;
  if (src) {
    return <img src={src} alt="" className="purpose-pick-icon" />;
  }
  return emojiFor(purpose);
}
