import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import ProductForm from '@/components/admin/ProductForm.jsx';
import { listCategories } from '@/src/application/products/productService.js';

export const metadata = {
  title: 'Create Product | Admin | Africhina Connect',
  description: 'Add a new direct sale product to the catalogue.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'admin') redirect('/403');

  const categories = await listCategories();

  return (
    <AppShell>
      <ProductForm categories={categories} isEditing={false} />
    </AppShell>
  );
}
