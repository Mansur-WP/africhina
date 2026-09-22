'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const SAMPLE_IMAGES = [
  {
    name: 'Wireless Earbuds',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
  },
  {
    name: 'Smart Watch',
    url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
  },
  {
    name: 'Leather Handbag',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
  },
  {
    name: 'Sneakers',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  },
  {
    name: 'Power Bank',
    url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80',
  },
  {
    name: 'Sunglasses',
    url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
  },
];

export default function ProductForm({
  categories = [],
  initialData = null,
  isEditing = false,
}) {
  const router = useRouter();

  // Convert initial price from minor units (kobo) to major units (naira) for input
  const initialNairaPrice = initialData?.price
    ? (initialData.price / 100).toString()
    : '';

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(
    initialData?.description || '',
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [priceNaira, setPriceNaira] = useState(initialNairaPrice);
  const [stock, setStock] = useState(
    initialData?.stock !== undefined && initialData?.stock !== null
      ? initialData.stock.toString()
      : '0',
  );
  const [status, setStatus] = useState(initialData?.status || 'draft');

  // Images state: array of { url, alt, sortOrder }
  const [images, setImages] = useState(
    initialData?.images?.map((img, i) => ({
      url: img.url,
      alt: img.alt || '',
      sortOrder: img.sortOrder ?? i,
    })) || [],
  );

  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleAddImage(urlToAdd) {
    const url = (urlToAdd || newImageUrl).trim();
    if (!url) return;
    if (images.length >= 10) {
      setError('Maximum 10 images allowed per product.');
      return;
    }
    if (images.some((img) => img.url === url)) {
      setError('Image URL is already in the list.');
      return;
    }

    setImages([...images, { url, alt: title || '', sortOrder: images.length }]);
    setNewImageUrl('');
    setError('');
  }

  function handleRemoveImage(index) {
    setImages(images.filter((_, i) => i !== index));
  }

  function handleSetPrimary(index) {
    if (index === 0) return;
    const reordered = [...images];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);
    // update sort orders
    const updated = reordered.map((img, i) => ({ ...img, sortOrder: i }));
    setImages(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Product name is required.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const parsedPrice = parseFloat(priceNaira);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a valid positive number in Naira.');
      return;
    }

    // Convert Naira to minor units (kobo) as an integer
    const priceInKobo = Math.round(parsedPrice * 100);

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError('Stock must be a non-negative whole number.');
      return;
    }

    const payload = {
      title: trimmedTitle,
      description: description.trim() || null,
      categoryId,
      price: priceInKobo,
      stock: parsedStock,
      status,
      images: images.map((img, i) => ({
        url: img.url,
        alt: img.alt || trimmedTitle,
        sortOrder: i,
      })),
    };

    setSubmitting(true);

    try {
      const endpoint = isEditing
        ? `/api/v1/admin/products/${initialData.id}`
        : '/api/v1/admin/products';

      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to save product.');
      }

      setSuccess(
        isEditing
          ? 'Product updated successfully!'
          : 'Product created successfully!',
      );

      // Redirect back to admin products list after a short pause
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 700);
    } catch (err) {
      setError(err.message || 'An error occurred while saving the product.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>
        <span className="text-xs text-muted-foreground">
          {isEditing ? 'Editing Product' : 'New Direct Sale Product'}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="border-b border-border pb-5">
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? 'Edit Product' : 'Create Direct Sale Product'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Set product details, images, final customer price, and inventory.
            Direct sale products are priced simply as{' '}
            <span className="font-semibold text-foreground">
              Total = Price × Quantity
            </span>
            .
          </p>
        </div>

        {error ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              1. Basic Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 3-in-1 Fast Wireless Charging Station"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Publish Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="draft">
                    Draft (Hidden from public catalogue)
                  </option>
                  <option value="active">
                    Active (Published in catalogue)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed specifications, features, dimensions, or package contents..."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              2. Pricing & Inventory (Direct Sale)
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Final Customer Price (₦ Naira){' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute top-2.5 left-4 text-sm font-bold text-muted-foreground">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={priceNaira}
                    onChange={(e) => setPriceNaira(e.target.value)}
                    placeholder="25,000"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pr-4 pl-9 text-sm font-semibold text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  This is the exact price the customer pays per unit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">
                  Available Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Integer inventory quantity available for immediate checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Product Images */}
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                3. Product Images
              </h2>
              <span className="text-xs text-muted-foreground">
                {images.length}/10 images
              </span>
            </div>

            {/* Current Image Thumbnails */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {images.map((img, idx) => (
                  <div
                    key={img.url + idx}
                    className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                      idx === 0
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border'
                    } bg-muted`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `Product image ${idx + 1}`}
                      fill
                      unoptimized={img.url.endsWith('.svg')}
                      className="object-cover"
                    />

                    {/* Primary Badge */}
                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-xs">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-black"
                      >
                        Set Primary
                      </button>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      aria-label="Remove image"
                      className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-red-700"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
                <ImageIcon
                  size={32}
                  className="text-muted-foreground/40"
                  strokeWidth={1.5}
                />
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  No images added yet. Add an image URL below.
                </p>
              </div>
            )}

            {/* Add Image URL Input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste an image URL (e.g. https://images.unsplash.com/...)"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddImage()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                <Plus size={14} /> Add Image
              </button>
            </div>

            {/* Quick Sample Image Picker */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles size={13} className="text-primary" />
                <span>Or pick from sample high-res direct sale images:</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleAddImage(sample.url)}
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    + {sample.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Link
              href="/admin/products"
              className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting
                ? 'Saving Product…'
                : isEditing
                  ? 'Update Product'
                  : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
