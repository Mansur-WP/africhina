import { Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell.jsx';
import EmptyState from '@/components/EmptyState.jsx';
import ProductGrid from '@/components/catalogue/ProductGrid.jsx';
import ProductGridSkeleton from '@/components/catalogue/ProductGridSkeleton.jsx';
import CatalogueToolbar from '@/components/catalogue/CatalogueToolbar.jsx';
import PaginationControls from '@/components/catalogue/PaginationControls.jsx';
import {
  listProducts,
  listCategories,
} from '@/src/application/products/productService.js';
import {
  productListQuerySchema,
  resolveProductSort,
  DEFAULT_PRODUCT_SORT,
  PRODUCT_PAGE_SIZE_DEFAULT,
} from '@/src/shared/validators/product.js';

export const metadata = {
  title: 'Product Catalogue',
};

function sortToParam(sort) {
  return `${sort.field}:${sort.direction}`;
}

/**
 * Results region — async server component. Kept separate so it can sit inside a
 * Suspense boundary keyed on the query, giving an inline skeleton while a new
 * search/filter/page is fetched from the database. Errors thrown here bubble to
 * app/catalogue/error.js.
 */
async function CatalogueResults({ query, sort }) {
  const { products, pagination } = await listProducts({
    q: query.q,
    categoryId: query.categoryId,
    page: query.page,
    limit: query.limit,
    sort,
  });

  if (products.length === 0) {
    const description = query.q
      ? `No products match “${query.q}”. Try a different search term or clear your filters.`
      : query.categoryId
        ? 'No products in this category yet. Try another category.'
        : 'There are no products in the catalogue yet. Please check back soon.';

    return (
      <EmptyState
        title="No products found"
        description={description}
        action={
          query.q || query.categoryId ? (
            <Link href="/catalogue" className="text-sm text-primary underline">
              Clear search and filters
            </Link>
          ) : null
        }
      />
    );
  }

  const firstItem = (pagination.page - 1) * pagination.limit + 1;
  const lastItem = firstItem + products.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-text-secondary text-sm">
        Showing <span className="font-medium tabular-nums">{firstItem}</span>–
        <span className="font-medium tabular-nums">{lastItem}</span> of{' '}
        <span className="font-medium tabular-nums">{pagination.total}</span>{' '}
        products
      </p>
      <ProductGrid products={products} />
      <PaginationControls pagination={pagination} />
    </div>
  );
}

/**
 * SCR-012 — Public Product Catalogue (/catalogue).
 *
 * Server component: search/filter/sort/pagination state lives in the URL and is
 * read here, then products are queried server-side. Query params are parsed
 * leniently so a stray value falls back to defaults rather than breaking the
 * page (the API route at /api/v1/products is the strict, validated contract).
 */
export default async function CataloguePage({ searchParams }) {
  const rawParams = (await searchParams) ?? {};
  const parsed = productListQuerySchema.safeParse(rawParams);
  const query = parsed.success
    ? parsed.data
    : { page: 1, limit: PRODUCT_PAGE_SIZE_DEFAULT };

  const sort = resolveProductSort(query.sort) ?? { ...DEFAULT_PRODUCT_SORT };
  const sortParam = sortToParam(sort);

  const categories = await listCategories();

  // Key the boundary on the effective query so changing any input shows the
  // skeleton while the new results stream in.
  const resultsKey = JSON.stringify({
    q: query.q ?? '',
    categoryId: query.categoryId ?? '',
    page: query.page,
    sort: sortParam,
  });

  return (
    <AppShell loadUser={false}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold">Product Catalogue</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Browse available products, check live stock, and purchase directly
            with secure payment and nationwide delivery.
          </p>
        </div>

        <CatalogueToolbar
          categories={categories}
          initialQuery={query.q ?? ''}
          categoryId={query.categoryId ?? ''}
          sort={sortParam}
        />

        <Suspense key={resultsKey} fallback={<ProductGridSkeleton />}>
          <CatalogueResults query={query} sort={sort} />
        </Suspense>
      </div>
    </AppShell>
  );
}
