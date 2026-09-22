import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import AdminProductList from '@/components/admin/AdminProductList.jsx';
import { listAdminProducts } from '@/src/application/products/adminProductService.js';
import { listCategories } from '@/src/application/products/productService.js';
import { ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Manage Products | Admin | Africhina Connect',
  description:
    'Manage direct sale product catalogue, inventory, pricing, and images.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProductsPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const resolvedParams = (await searchParams) ?? {};
  const page = Math.max(1, Number(resolvedParams.page || 1));
  const limit = Math.min(100, Math.max(1, Number(resolvedParams.limit || 20)));
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || '';
  const categoryId = resolvedParams.categoryId || '';

  const [productsData, categories] = await Promise.all([
    listAdminProducts({
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
    }),
    listCategories(),
  ]);

  return (
    <AppShell>
      <div suppressHydrationWarning className="space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Manage Products
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <ShoppingBag size={12} /> Direct Sale
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, update, set final pricing, adjust stock, and publish direct
            sale products for the customer catalogue.
          </p>
        </div>

        {/* Product Table & Actions */}
        <AdminProductList
          products={productsData.products}
          categories={categories}
          pagination={productsData.pagination}
          currentSearch={search}
          currentStatus={status}
          currentCategoryId={categoryId}
        />
      </div>
    </AppShell>
  );
}
