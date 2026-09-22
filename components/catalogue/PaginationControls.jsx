'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { buildCatalogueQuery } from './catalogueParams.js';

/**
 * Pagination controls (client). Prev/Next update the `page` query param, which
 * re-runs the server page against the database — the full result set is never
 * loaded client-side.
 *
 * @param {{ pagination: { page:number, totalPages:number, hasNextPage:boolean, hasPrevPage:boolean } }} props
 */
export default function PaginationControls({ pagination }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  function goToPage(nextPage) {
    const href =
      pathname +
      buildCatalogueQuery(searchParams.toString(), {
        // Drop the param entirely for page 1 to keep URLs clean.
        page: nextPage <= 1 ? null : nextPage,
      });
    router.push(href);
  }

  const buttonBase =
    'inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <nav
      className="flex items-center justify-between gap-4"
      aria-label="Catalogue pagination"
    >
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={!hasPrevPage}
        className={`${buttonBase} hover:bg-surface-muted`}
      >
        Previous
      </button>

      <span className="text-text-secondary text-sm">
        Page <span className="font-medium tabular-nums">{page}</span> of{' '}
        <span className="font-medium tabular-nums">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={!hasNextPage}
        className={`${buttonBase} hover:bg-surface-muted`}
      >
        Next
      </button>
    </nav>
  );
}
