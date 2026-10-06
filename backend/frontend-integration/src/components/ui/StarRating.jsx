import { Star } from 'lucide-react';

export default function StarRating({ rating, size = 14, showCount = false, count = 0 }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(full)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className="fill-brand-gold text-brand-gold" />
      ))}
      {hasHalf && (
        <Star size={size} className="fill-brand-gold/50 text-brand-gold" />
      )}
      {[...Array(empty)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-brand-beige-dark" />
      ))}
      {showCount && (
        <span className="text-xs text-brand-gray ml-1">({count})</span>
      )}
    </div>
  );
}
