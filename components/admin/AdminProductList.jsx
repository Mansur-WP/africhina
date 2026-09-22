'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  Globe,
  EyeOff,
  Trash2,
  Plus,
  Search,
  Package,
  Check,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { formatMoney } from '@/src/shared/lib/money.js';

export default function AdminProductList({
  products = [],
  categories = [],
  pagination = {},
  currentSearch = '',
  currentStatus = '',
  currentCategoryId = '',
}) {
  const router = useRouter();

  const [search, setSearch] = useState(currentSearch);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [selectedCategory, setSelectedCategory] = useState(currentCategoryId);

  // Quick action states
  const [loadingId, setLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inline Stock Editing
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockVal, setEditingStockVal] = useState('');

  function applyFilters(newSearch, newStatus, newCat) {
    const params = new URLSearchParams();
    if (newSearch !== undefined ? newSearch : search) {
      params.set(
        'search',
        (newSearch !== undefined ? newSearch : search).trim(),
      );
    }
    if (newStatus !== undefined ? newStatus : selectedStatus) {
      params.set(
        'status',
        newStatus !== undefined ? newStatus : selectedStatus,
      );
    }
    if (newCat !== undefined ? newCat : selectedCategory) {
      params.set(
        'categoryId',
        newCat !== undefined ? newCat : selectedCategory,
      );
    }
    router.push(`/admin/products?${params.toString()}`);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    applyFilters(search, selectedStatus, selectedCategory);
  }

  async function handleToggleStatus(product) {
    const nextStatus = product.status === 'active' ? 'draft' : 'active';
    setLoadingId(product.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update status.');
      }
      setSuccessMsg(
        `Product marked as ${nextStatus === 'active' ? 'Published (Active)' : 'Draft'}.`,
      );
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleSaveStock(productId) {
    const parsed = parseInt(editingStockVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      setErrorMsg('Stock must be a non-negative integer.');
      return;
    }

    setLoadingId(productId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update stock.');
      }
      setSuccessMsg(`Stock updated to ${parsed} units.`);
      setEditingStockId(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleArchiveProduct(product) {
    if (
      !window.confirm(
        `Are you sure you want to archive "${product.title}"? It will be removed from the active catalogue while preserving historical orders.`,
      )
    ) {
      return;
    }

    setLoadingId(product.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to archive product.');
      }
      setSuccessMsg(`"${product.title}" has been archived.`);
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {errorMsg ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Check size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {/* Toolbar: Search, Filters & Add Product */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 items-center gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute top-3 left-3 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title or description..."
              className="w-full rounded-xl border border-border bg-background py-2 pr-4 pl-9 text-xs text-foreground transition focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              applyFilters(search, selectedStatus, e.target.value);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground transition focus:border-primary focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              applyFilters(search, e.target.value, selectedCategory);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground transition focus:border-primary focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active (Published)</option>
            <option value="draft">Draft (Unpublished)</option>
          </select>

          {/* Add Product CTA */}
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package
              size={36}
              className="text-muted-foreground/30"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm font-semibold text-foreground">
              No products found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || selectedCategory || selectedStatus
                ? 'Try adjusting your search query or filters.'
                : 'Get started by creating your first direct sale product.'}
            </p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus size={14} /> Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                <tr>
                  <th className="py-3.5 pr-3 pl-5">Product</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">Final Price</th>
                  <th className="px-3 py-3.5">Stock</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const primaryImg = p.images?.[0]?.url;
                  const isBusy = loadingId === p.id;
                  const isEditingStock = editingStockId === p.id;

                  return (
                    <tr key={p.id} className="transition hover:bg-muted/30">
                      {/* Product Name & Thumbnail */}
                      <td className="py-3 pr-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {primaryImg ? (
                              <Image
                                src={primaryImg}
                                alt={p.title}
                                fill
                                unoptimized={primaryImg.endsWith('.svg')}
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div className="max-w-xs min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {p.title}
                            </p>
                            {p.description ? (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {p.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3 font-bold whitespace-nowrap text-foreground tabular-nums">
                        {formatMoney(p.price, p.currency)}
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isEditingStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={editingStockVal}
                              onChange={(e) =>
                                setEditingStockVal(e.target.value)
                              }
                              className="w-16 rounded-md border border-primary px-2 py-1 text-xs font-semibold tabular-nums focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStock(p.id)}
                              disabled={isBusy}
                              className="rounded-md bg-primary p-1 text-white hover:bg-primary/90"
                              title="Save stock"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="rounded-md border border-border p-1 text-muted-foreground hover:bg-muted"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold tabular-nums ${
                                (p.stock ?? 0) === 0
                                  ? 'text-red-600'
                                  : (p.stock ?? 0) < 5
                                    ? 'text-amber-600'
                                    : 'text-foreground'
                              }`}
                            >
                              {(p.stock ?? 0).toLocaleString()} units
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStockId(p.id);
                                setEditingStockVal((p.stock ?? 0).toString());
                              }}
                              className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              title="Quick edit stock"
                            >
                              <TrendingUp size={12} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Publish / Unpublish */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(p)}
                            title={
                              p.status === 'active'
                                ? 'Unpublish (Move to Draft)'
                                : 'Publish in Catalogue'
                            }
                            className={`rounded-lg border p-1.5 text-xs font-semibold transition ${
                              p.status === 'active'
                                ? 'border-border text-muted-foreground hover:bg-amber-50 hover:text-amber-700'
                                : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                            } disabled:opacity-50`}
                          >
                            {p.status === 'active' ? (
                              <EyeOff size={13} />
                            ) : (
                              <Globe size={13} />
                            )}
                          </button>

                          {/* Edit Product */}
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title="Edit Product"
                          >
                            <Edit3 size={13} />
                          </Link>

                          {/* Archive Product */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleArchiveProduct(p)}
                            className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            title="Archive Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination summary */}
      {pagination?.total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Total: <strong>{pagination.total}</strong> products
          </span>
          <span>
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>
      )}
    </div>
  );
}
