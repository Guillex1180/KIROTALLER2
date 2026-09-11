function StarRating({ rating, max = 5, size = 'md' }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = max - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className={`star-rating star-rating--${size}`} aria-label={`${rating} out of ${max} stars`}>
      {'★'.repeat(fullStars)}
      {hasHalf ? '½' : ''}
      {'☆'.repeat(emptyStars)}
    </span>
  );
}

export default StarRating;
