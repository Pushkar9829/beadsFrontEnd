import { Star } from 'lucide-react';
import { formatReviewCount, resolveProductRating } from '../../lib/productRating';

export default function ProductRating({ product, size = 'sm' }) {
  const { rating, reviewCount, stars } = resolveProductRating(product);
  const score = rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1);
  const label = `${score} out of ${stars} stars, ${formatReviewCount(reviewCount)} reviews`;

  return (
    <div className={`product-rating product-rating-${size}`} aria-label={label}>
      <span className="product-stars" aria-hidden>
        {Array.from({ length: stars }, (_, i) => {
          const fill = Math.min(1, Math.max(0, rating - i));
          return (
            <span key={i} className="product-star">
              <Star className="product-star-empty" size={size === 'md' ? 14 : 11} strokeWidth={1.4} />
              <span className="product-star-fill" style={{ width: `${fill * 100}%` }}>
                <Star size={size === 'md' ? 14 : 11} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </span>
      <span className="product-rating-meta">
        <span className="product-rating-score">{score}</span>
        <span className="product-rating-count">
          ({formatReviewCount(reviewCount)}{size === 'md' ? ' reviews' : ''})
        </span>
      </span>
    </div>
  );
}
