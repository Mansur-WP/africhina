'use client';

import Image from 'next/image';
import { useState } from 'react';

const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';

function isUnoptimized(url) {
  return url.endsWith('.svg');
}

/**
 * Product detail image gallery (client). Shows a main 4:3 image with a
 * thumbnail strip when more than one image exists. Selecting a thumbnail swaps
 * the main image. Falls back to the shared placeholder when there are none.
 *
 * @param {{ images: {id:string,url:string,alt:string|null}[], title: string }} props
 */
export default function ProductGallery({ images = [], title }) {
  const gallery =
    images.length > 0
      ? images
      : [{ id: 'placeholder', url: PLACEHOLDER_IMAGE, alt: title }];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[activeIndex] ?? gallery[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
        <Image
          src={active.url}
          alt={active.alt || title}
          fill
          unoptimized={isUnoptimized(active.url)}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {gallery.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2">
          {gallery.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={selected}
                  className={`bg-surface-muted relative aspect-square w-full overflow-hidden rounded-md border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${title} thumbnail ${index + 1}`}
                    fill
                    unoptimized={isUnoptimized(image.url)}
                    sizes="20vw"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
