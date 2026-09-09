import { useState } from 'react';
import { useCustomizerStore } from '../../store/customizerStore';
import CrystalSelectModal from './CrystalSelectModal';

const BY_NAME = {
  'attract wealth': '💎',
  'financial freedom': '🕊️',
  'increase income': '📈',
  'business success': '💼',
  'smart investments': '📊',
  'money flow': '🌊',
  'debt relief': '🔓',
  'savings growth': '🏦',
  'career advancement': '🚀',
  'prosperity mindset': '🧠',
  'opportunities': '🔑',
  'material comfort': '🏡',
  'open the heart': '🩷',
  'attract partnership': '💑',
  'self-love': '💗',
  'heal after heartache': '🩹',
  'recognition at work': '🏆',
  'leadership presence': '👑',
  'creative success': '🎨',
  'inner authority': '🦁',
  'courage in rooms': '🔥',
  'daily shield': '🛡️',
  'rooted presence': '🌳',
  'study & decisions': '📚',
  'mental stillness': '🧘',
  'soothe anxiety': '🪷',
  'even mood': '😌',
  'night unwind': '🌙',
  'gentle rest': '😴',
  'morning drive': '☀️',
  'recover stamina': '⚡',
  'deepen practice': '🕉️',
  'intuitive listening': '🔮',
  'clean slate': '🌱',
  'threshold ritual': '🚪',
  'speak truth': '💬',
  'creative voice': '🎤',
  'harmony composition': '☯️',
  'daily alignment': '⚖️',
};

const LOOKS = [
  { match: /wealth/i, emoji: '💎' },
  { match: /freedom/i, emoji: '🕊️' },
  { match: /income/i, emoji: '📈' },
  { match: /business/i, emoji: '💼' },
  { match: /invest/i, emoji: '📊' },
  { match: /flow/i, emoji: '🌊' },
  { match: /debt/i, emoji: '🔓' },
  { match: /saving/i, emoji: '🏦' },
  { match: /advancement/i, emoji: '🚀' },
  { match: /mindset|prosper/i, emoji: '🧠' },
  { match: /opportunit/i, emoji: '🔑' },
  { match: /comfort/i, emoji: '🏡' },
  { match: /partnership|partner/i, emoji: '💑' },
  { match: /self-love|self love/i, emoji: '💗' },
  { match: /heal|heartache/i, emoji: '🩹' },
  { match: /heart|love/i, emoji: '🩷' },
  { match: /recognition/i, emoji: '🏆' },
  { match: /leadership/i, emoji: '👑' },
  { match: /creative success/i, emoji: '🎨' },
  { match: /authority/i, emoji: '🦁' },
  { match: /courage/i, emoji: '🔥' },
  { match: /shield/i, emoji: '🛡️' },
  { match: /root|ground/i, emoji: '🌳' },
  { match: /study|decision/i, emoji: '📚' },
  { match: /still/i, emoji: '🧘' },
  { match: /anxiety|soothe/i, emoji: '🪷' },
  { match: /mood/i, emoji: '😌' },
  { match: /night|unwind/i, emoji: '🌙' },
  { match: /rest|sleep/i, emoji: '😴' },
  { match: /morning|drive/i, emoji: '☀️' },
  { match: /stamina|energy/i, emoji: '⚡' },
  { match: /practice/i, emoji: '🕉️' },
  { match: /intuit/i, emoji: '🔮' },
  { match: /slate|begin/i, emoji: '🌱' },
  { match: /threshold|ritual/i, emoji: '🚪' },
  { match: /speak|truth/i, emoji: '💬' },
  { match: /voice/i, emoji: '🎤' },
  { match: /harmony/i, emoji: '☯️' },
  { match: /align|balance/i, emoji: '⚖️' },
];

const FALLBACKS = ['🩷', '💎', '👑', '🔥', '🛡️', '🔮', '🪷', '🌙', '☀️', '✨', '🌱', '💬', '⚖️'];

function emojiFor(intention) {
  if (intention.icon) return intention.icon;
  const name = (intention.name || '').trim().toLowerCase();
  if (BY_NAME[name]) return BY_NAME[name];
  const hay = `${intention.slug || ''} ${intention.name || ''}`;
  const found = LOOKS.find((item) => item.match.test(hay));
  if (found) return found.emoji;
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return FALLBACKS[n % FALLBACKS.length];
}

export default function IntentionGrid() {
  const purpose = useCustomizerStore((s) => s.purpose);
  const intentions = useCustomizerStore((s) => s.intentions);
  const selected = useCustomizerStore((s) => s.intention);
  const recommended = useCustomizerStore((s) => s.recommended);
  const quantities = useCustomizerStore((s) => s.quantities);
  const selectIntention = useCustomizerStore((s) => s.selectIntention);
  const selectingIntention = useCustomizerStore((s) => s.selectingIntention);
  const stepError = useCustomizerStore((s) => s.stepError);
  const goNext = useCustomizerStore((s) => s.goNext);
  const picked = recommended.filter((b) => (quantities[b._id] || 0) > 0);
  const [crystalOpen, setCrystalOpen] = useState(false);

  async function onPick(it) {
    setCrystalOpen(true);
    if (selected?._id === it._id && recommended.length) return;
    await selectIntention(it);
  }

  async function onComplete() {
    setCrystalOpen(false);
    await goNext();
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
        For {purpose?.name || 'this purpose'}
      </p>

      <div className="purpose-pick mt-5">
        {intentions.map((it) => {
          const on = selected?._id === it._id;
          return (
            <button
              key={it._id}
              type="button"
              disabled={selectingIntention}
              onClick={() => onPick(it)}
              className={`purpose-pick-card disabled:opacity-60 ${on ? 'is-on' : ''}`}
            >
              <span className="purpose-pick-emoji" aria-hidden>
                {emojiFor(it)}
              </span>
              <span className="purpose-pick-copy">
                <h3>{it.name}</h3>
                <p>{it.description}</p>
                <span className="purpose-pick-meta">
                  {on
                    ? selectingIntention
                      ? 'Selecting crystals…'
                      : `${picked.length} crystal${picked.length === 1 ? '' : 's'} · Edit`
                    : 'Select →'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {stepError && !crystalOpen && <p className="mt-4 text-sm text-red-300">{stepError}</p>}

      <CrystalSelectModal
        open={crystalOpen}
        onClose={() => setCrystalOpen(false)}
        onComplete={onComplete}
      />
    </div>
  );
}
