const GOLD_SEL = [
  '.gold-cloud',
  '.gold-text',
  '.marquee-item',
  '.header-nav-link',
  '.footer-link',
  '.text-gold',
  '.text-gold-light',
  '[class*="text-gold/"]',
].join(',');

const GOLD_GEN = '4';

function roll() {
  return {
    dur: `${(2 + Math.random() * 1.4).toFixed(2)}s`,
    delay: `${(-Math.random() * 4).toFixed(2)}s`,
  };
}

export function paintGoldShine(root = document) {
  root.querySelectorAll(GOLD_SEL).forEach((el) => {
    if (el.tagName === 'svg' || el.closest?.('svg')) return;
    if (el.dataset.goldRand === GOLD_GEN) return;
    const t = roll();
    el.dataset.goldRand = GOLD_GEN;
    el.style.setProperty('--gold-dur', t.dur);
    el.style.setProperty('--gold-delay', t.delay);
  });
}
