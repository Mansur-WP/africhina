import ProductGridSkeleton from '@/components/catalogue/ProductGridSkeleton.jsx';

/**
 * Route-level loading UI shown instantly while the catalogue page's initial
 * server work runs. The in-page Suspense boundary handles subsequent
 * search/filter/page changes with the app shell kept in place.
 */
export default function CatalogueLoading() {
  return (
    <div className="bg-background-subtle min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-2">
          <div className="bg-surface-muted h-7 w-56 rounded motion-safe:animate-pulse" />
          <div className="bg-surface-muted h-4 w-80 rounded motion-safe:animate-pulse" />
        </div>
        <div className="bg-surface-muted h-10 w-full max-w-md rounded-md motion-safe:animate-pulse" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
