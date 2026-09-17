/**
 * Small semantic pill for catalogue availability. Availability is derived from
 * product status by the service (see productService.toAvailability); this only
 * renders it. Wording avoids implying physical Nigerian stock — the platform
 * sources on request.
 */
export default function AvailabilityBadge({ availability, purchaseMode }) {
  if (!availability) return null;

  const isAvailable = availability.code === 'available';
  const classes = isAvailable
    ? 'bg-success-bg text-success'
    : 'bg-surface-muted text-text-secondary';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          isAvailable ? 'bg-success' : 'bg-text-muted'
        }`}
      />
      {purchaseMode === 'DIRECT_SALE'
        ? 'Available to buy'
        : purchaseMode === 'SOURCING_REQUIRED'
          ? 'Available for sourcing'
          : availability.label}
    </span>
  );
}
