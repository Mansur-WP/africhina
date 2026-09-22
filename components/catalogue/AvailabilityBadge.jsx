/**
 * Small semantic pill for Direct Sale catalogue stock availability.
 */
export default function AvailabilityBadge({
  stock,
  availableQuantity,
  availability,
}) {
  const count =
    typeof stock === 'number'
      ? stock
      : typeof availableQuantity === 'number'
        ? availableQuantity
        : null;
  const inStock =
    count !== null ? count > 0 : availability?.code === 'available';

  if (count === 0 || (!inStock && count === null)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-600" />
        Out of Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      {count !== null ? `In Stock (${count} available)` : 'In Stock'}
    </span>
  );
}
