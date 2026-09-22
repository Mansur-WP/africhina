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
import { ShieldCheck, Truck, ArrowLeft } from 'lucide-react';

// Cache the fetch so the page body and generateMetadata share one query.
const loadProduct = cache((id) => getActiveProductById(id));

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);
  return {
    title: product
      ? `${product.title} — Africhina Connect`
      : 'Product Not Found',
  };
}

/**
 * Customer Direct Sale Product Detail (/catalogue/[id]).
 *
 * Displays product image gallery, category, name, final customer selling price,
 * description, stock status, quantity selector, and Add to Cart action.
 */
export default async function ProductDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const stock =
    typeof product.stock === 'number'
      ? product.stock
      : typeof product.availableQuantity === 'number'
        ? product.availableQuantity
        : 0;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {/* Breadcrumbs */}
        <nav
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/catalogue" className="hover:text-foreground">
            Catalogue
          </Link>
          <span aria-hidden>/</span>
          {product.category ? (
            <>
              <span>{product.category.name}</span>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span className="truncate text-foreground">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: Gallery */}
          <div>
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* Right: Info & Purchase */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {product.category ? (
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {product.category.name}
                </span>
              ) : null}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {product.title}
              </h1>
              <div className="pt-1">
                <AvailabilityBadge
                  stock={stock}
                  availability={product.availability}
                />
              </div>
            </div>

            {/* Price Box */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-foreground tabular-nums">
                  {formatMoney(product.price, product.currency)}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                ✓ Final selling price · No hidden charges
              </p>
            </div>

            {/* Purchase CTA with Quantity Stepper */}
            <div>
              <AddToCartButton product={product} />
            </div>

            {/* Description */}
            {product.description ? (
              <div className="border-t border-border pt-4">
                <h2 className="text-sm font-bold text-foreground">
                  Product Description
                </h2>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {product.description}
                </p>
              </div>
            ) : null}

            {/* Product Specifications & Trust */}
            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/20 p-4 text-xs sm:grid-cols-2">
              {product.category ? (
                <div>
                  <dt className="font-semibold text-muted-foreground">
                    Category
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {product.category.name}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="font-semibold text-muted-foreground">
                  Available Stock
                </dt>
                <dd
                  className={`mt-0.5 font-bold tabular-nums ${stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {stock > 0 ? `${stock} units in stock` : 'Out of stock'}
                </dd>
              </div>
            </dl>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Verified Direct Sale</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck size={16} className="text-primary" />
                <span>Nationwide Delivery</span>
              </div>
            </div>

            <div>
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={14} />
                <span>Back to Catalogue</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
