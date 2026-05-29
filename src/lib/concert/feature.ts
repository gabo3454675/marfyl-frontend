export function isConcertFeatureEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_FEATURE_CONCERT === 'false') return false;
  return (
    process.env.NEXT_PUBLIC_FEATURE_CONCERT === 'true' ||
    process.env.NODE_ENV !== 'production'
  );
}

export const CONCERT_DEFAULT_SLUG =
  process.env.NEXT_PUBLIC_CONCERT_SLUG || 'hemenegilda-capacidad';
