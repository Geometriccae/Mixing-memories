/**
 * Integer discount % for display: (MRP − selling) / MRP × 100.
 * Returns null when there is no meaningful discount.
 */
export function discountPercentOff(mrp: number, selling: number): number | null {
  if (!Number.isFinite(mrp) || !Number.isFinite(selling) || mrp <= 0) return null;
  if (selling >= mrp) return null;
  const pct = Math.round(((mrp - selling) / mrp) * 100);
  if (pct <= 0) return null;
  return Math.min(99, pct);
}
