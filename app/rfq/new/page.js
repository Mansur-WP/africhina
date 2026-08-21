import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import AppShell from '@/components/AppShell.jsx';
import RfqForm from '@/components/rfq/RfqForm.jsx';
import { getActiveProductById } from '@/src/application/products/productService.js';

export const metadata = {
  title: 'Request a Quote',
};

/**
 * SCR-014 — Create RFQ  (/rfq/new)
 *
 * When reached from a product detail page the `productId` search param is set;
 * the form pre-populates product details so the customer does not re-type them.
 * Without a productId the form opens in free-text (custom request) mode.
 */
export default async function NewRfqPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/dashboard');

  const { productId } = (await searchParams) ?? {};

  // Load product details server-side to pre-populate the form. Falls back
  // to null (custom-request mode) if the id is missing or the product is
  // not active.
  let product = null;
  if (productId) {
    product = await getActiveProductById(productId);
  }

  return (
    <AppShell>
      <div suppressHydrationWarning className="mx-auto max-w-3xl px-4 py-8">
        <RfqForm product={product} />
      </div>
    </AppShell>
  );
}
