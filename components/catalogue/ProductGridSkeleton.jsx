/**
 * Skeleton placeholders shown while the catalogue grid loads. Matches the
 * ProductCard footprint (4:3 image + text lines) so layout doesn't shift.
 * Respects prefers-reduced-motion via Tailwind's motion-safe variant.
 */

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="bg-surface-muted aspect-[4/3] w-full motion-safe:animate-pulse" />
      <div className="flex flex-col gap-3 p-4">
        <div className="bg-surface-muted h-3 w-1/3 rounded motion-safe:animate-pulse" />
        <div className="bg-surface-muted h-4 w-4/5 rounded motion-safe:animate-pulse" />
        <div className="bg-surface-muted mt-2 h-5 w-1/2 rounded motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
