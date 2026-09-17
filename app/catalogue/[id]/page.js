import { cache } from 'react';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import ProductGallery from '@/components/catalogue/ProductGallery.jsx';
import AvailabilityBadge from '@/components/catalogue/AvailabilityBadge.jsx';
import { getActiveProductById } from '@/src/application/products/productService.js';
import { formatMoney } from '@/src/shared/lib/money.js';
import AddToCartButton from '@/components/cart/AddToCartButton.jsx';

// Cache the fetch so the page body and generateMetadata share one query.
const loadProduct = cache((id) => getActiveProductById(id));

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);
  return { title: product ? product.title : 'Product not found' };
}

/**
 * SCR-013 — Authenticated Product Detail (/catalogue/[id]).
 *
 * Shows the image gallery, product info, price, availability and sourcing
 * context, plus a "Request this product" CTA. Unknown/hidden products render
 * the route's not-found page. Deliberately shows NO internal supplier data
 * (company, rating, verification) — only neutral sourcing context.
 */
export default async function ProductDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  return (
    <AppShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <nav className="text-text-secondary text-sm" aria-label="Breadcrumb">
          <Link href="/catalogue" className="hover:text-text-primary">
            Catalogue
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-text-primary">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images} title={product.title} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {product.category ? (
                <span className="text-text-muted text-xs font-medium tracking-wide uppercase">
                  {product.category.name}
                </span>
              ) : null}
              <h1 className="text-2xl font-semibold">{product.title}</h1>
              <AvailabilityBadge
                availability={product.availability}
                purchaseMode={product.purchaseMode}
              />
            </div>

            <div>
              <p className="text-text-primary text-3xl font-semibold tabular-nums">
                {formatMoney(product.price, product.currency)}
              </p>
              <p className="text-text-muted mt-1 text-xs">
                Indicative price. A final quotation is provided on request.
              </p>
            </div>

            {product.description ? (
              <div>
                <h2 className="text-sm font-semibold">Description</h2>
                <p className="text-text-secondary mt-2 text-sm whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            ) : null}

            <dl className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-muted text-xs">Sourcing</dt>
                <dd className="text-text-primary mt-0.5">
                  Sourced from China via Africhina Connect
                </dd>
              </div>
              {product.minimumOrderQty ? (
                <div>
                  <dt className="text-text-muted text-xs">Minimum order</dt>
                  <dd className="text-text-primary mt-0.5 tabular-nums">
                    {product.minimumOrderQty} units
                  </dd>
                </div>
              ) : null}
              {product.category ? (
                <div>
                  <dt className="text-text-muted text-xs">Category</dt>
                  <dd className="text-text-primary mt-0.5">
                    {product.category.name}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
              {product.purchaseMode === 'DIRECT_SALE' ? (
                <AddToCartButton product={product} />
              ) : (
                <Link
                  href={`/rfq/new?productId=${product.id}`}
                  className="hover:bg-brand-hover inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Request this product
                </Link>
              )}
              <Link
                href="/catalogue"
                className="text-text-secondary hover:text-text-primary inline-flex items-center justify-center px-2 py-2.5 text-sm font-medium"
              >
                Back to catalogue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
