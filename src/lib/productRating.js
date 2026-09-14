const STAR_COUNT = 5;

function hashReviewCount(id) {
  const s = String(id || '');
  let n = 0;
  for (let i = 0; i < s.length; i += 1) n = (n + s.charCodeAt(i) * (i + 3)) % 180;
  return 18 + n;
}

export function resolveProductRating(product = {}) {
  const raw = Number(product.rating);
  const rating = Number.isFinite(raw) ? Math.min(STAR_COUNT, Math.max(0, raw)) : STAR_COUNT;
  const hasCount = product.reviewCount != null && product.reviewCount !== '';
  const countRaw = Number(product.reviewCount);
  const reviewCount = hasCount && Number.isFinite(countRaw)
    ? Math.max(0, Math.round(countRaw))
    : hashReviewCount(product._id || product.slug);
  return { rating, reviewCount, stars: STAR_COUNT };
}

export function formatReviewCount(count) {
  return Number(count || 0).toLocaleString('en-IN');
}
