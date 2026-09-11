import {
  Award,
  BadgeCheck,
  Flower2,
  Gem,
  Hand,
  Heart,
  Leaf,
  Lock,
  Moon,
  Shield,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';

export const CLAIM_ICON_OPTIONS = [
  { key: 'gem', label: 'Gem', Icon: Gem },
  { key: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { key: 'hand', label: 'Hand', Icon: Hand },
  { key: 'shield', label: 'Shield', Icon: Shield },
  { key: 'lock', label: 'Lock', Icon: Lock },
  { key: 'heart', label: 'Heart', Icon: Heart },
  { key: 'star', label: 'Star', Icon: Star },
  { key: 'leaf', label: 'Leaf', Icon: Leaf },
  { key: 'sun', label: 'Sun', Icon: Sun },
  { key: 'moon', label: 'Moon', Icon: Moon },
  { key: 'flower', label: 'Flower', Icon: Flower2 },
  { key: 'award', label: 'Award', Icon: Award },
  { key: 'check', label: 'Check', Icon: BadgeCheck },
];

const BY_KEY = Object.fromEntries(CLAIM_ICON_OPTIONS.map((o) => [o.key, o.Icon]));

const LEGACY_TITLE = {
  'Natural & Authentic': 'gem',
  'Designed for Intentions': 'sparkles',
  Handmade: 'hand',
  'Energized / Cleansed': 'sparkles',
  'Secure Payments': 'shield',
};

export function claimIcon(claim) {
  const key = claim?.icon || LEGACY_TITLE[claim?.title] || 'lock';
  return BY_KEY[key] || Lock;
}
