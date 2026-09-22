'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { buildCatalogueQuery } from './catalogueParams.js';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'title:asc', label: 'Name: A to Z' },
];

/**
 * Catalogue toolbar (client). Search, category filter and sort all live in the
 * URL — changing any of them navigates with new query params, which re-runs the
 * server component and re-queries the database. Changing filters/search/sort
 * resets pagination to page 1.
 *
 * @param {{ categories: object[], initialQuery?: string, categoryId?: string, sort?: string }} props
 */
export default function CatalogueToolbar({
  categories = [],
  initialQuery = '',
  categoryId = '',
  sort = 'createdAt:desc',
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);

  // Keep the input in sync when the URL query changes elsewhere (e.g. Back
  // button or the Clear action). This is React's "adjust state during render"
  // pattern — no effect, so it stays in sync without a cascading re-render.
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  function navigate(updates) {
    const href =
      pathname + buildCatalogueQuery(searchParams.toString(), updates);
    router.push(href);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    // New search resets to page 1.
    navigate({ q: query.trim(), page: null });
  }

  function handleClearSearch() {
    setQuery('');
    navigate({ q: null, page: null });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="flex w-full max-w-md items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {initialQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-text-muted hover:text-text-primary absolute top-1/2 right-2 -translate-y-1/2 text-xs"
              aria-label="Clear search"
            >
              Clear
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          className="hover:bg-brand-hover rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
      </form>

      <div className="flex items-center gap-2">
        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="category-filter"
          value={categoryId}
          onChange={(event) =>
            navigate({ categoryId: event.target.value || null, page: null })
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="sort-order" className="sr-only">
          Sort products
        </label>
        <select
          id="sort-order"
          value={sort}
          onChange={(event) => navigate({ sort: event.target.value })}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
