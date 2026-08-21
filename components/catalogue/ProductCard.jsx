import Image from 'next/image';
import Link from 'next/link';
import { formatMoney } from '@/src/shared/lib/money.js';
import AvailabilityBadge from './AvailabilityBadge.jsx';

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';

/**
 * Catalogue product card (molecule).
 *
 * Shows image, category, title, price, availability and a "View details"
 * affordance. The whole card links to the product detail page. Intentionally
 * clean: a subtle shadow lift on hover, no scale/glow/gradient effects.
 *
 * @param {{ product: object }} props Public product shape from productService.
 */
export default function ProductCard({ product }) {
  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage?.url || PLACEHOLDER_IMAGE;
  const imageAlt = primaryImage?.alt || product.title;
  // Local SVG placeholder: skip the image optimizer (SVGs aren't optimized and
  // the optimizer blocks them by default). Real raster images optimize normally.
  const unoptimized = imageUrl.endsWith('.svg');

  return (
    <Link
      href={`/catalogue/${product.id}`}
      className="group hover:shadow-dropdown flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="bg-surface-muted relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          unoptimized={unoptimized}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category ? (
          <span className="text-text-muted text-xs font-medium tracking-wide uppercase">
            {product.category.name}
          </span>
        ) : null}

        <h3 className="text-text-primary line-clamp-2 text-sm font-semibold">
          {product.title}
        </h3>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <span className="text-text-primary text-base font-semibold tabular-nums">
            {formatMoney(product.price, product.currency)}
          </span>
          <div className="flex items-center justify-between gap-2">
            <AvailabilityBadge availability={product.availability} />
            <span className="text-xs font-medium text-primary group-hover:underline">
              View details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
