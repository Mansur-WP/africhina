import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell.jsx';
import CartClient from '@/components/cart/CartClient.jsx';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getCart } from '@/src/application/cart/cartService.js';

export const metadata = { title: 'Cart' };

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role?.code !== 'buyer') redirect('/403');
  const cart = await getCart(user.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Review direct-sale products before checkout.
        </p>
        {!cart.items.length ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Your cart is empty.
          </div>
        ) : (
          <CartClient initialCart={cart} />
        )}
      </div>
    </AppShell>
  );
}
