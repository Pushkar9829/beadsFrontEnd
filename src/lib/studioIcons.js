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
  opportunities: '🔑',
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

export function intentionEmoji(intention) {
  if (intention?.icon) return intention.icon;
  const name = (intention?.name || '').trim().toLowerCase();
  if (BY_NAME[name]) return BY_NAME[name];
  const hay = `${intention?.slug || ''} ${intention?.name || ''}`;
  const found = LOOKS.find((item) => item.match.test(hay));
  if (found) return found.emoji;
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return FALLBACKS[n % FALLBACKS.length];
}
