import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import ProductForm from '@/components/admin/ProductForm.jsx';
import { getAdminProductById } from '@/src/application/products/adminProductService.js';
import { listCategories } from '@/src/application/products/productService.js';

export const metadata = {
  title: 'Edit Product | Admin | Africhina Connect',
  description: 'Update product information, pricing, stock, and images.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditProductPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductById(id),
    listCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <ProductForm
        categories={categories}
        initialData={product}
        isEditing={true}
      />
    </AppShell>
  );
}
