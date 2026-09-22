import Link from 'next/link';
import AppShell from '@/components/AppShell.jsx';
import EmptyState from '@/components/EmptyState.jsx';

/**
 * Shown when a product id is unknown, soft-deleted, or not active
 * (getActiveProductById returned null and the page called notFound()).
 */
export default function ProductNotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Product not found"
          description="This product may no longer be available or the link is incorrect."
          action={
            <Link href="/catalogue" className="text-sm text-primary underline">
              Back to catalogue
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
