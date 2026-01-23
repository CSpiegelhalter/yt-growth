
/**
 * Calculate subscribers gained per 1000 views.
 */
export function calcSubsPerThousandViews(subsGained: number, views: number): number {
  if (views <= 0) return 0;
  return Math.round((subsGained / views) * 1000 * 100) / 100;
}

