import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="bg-background-subtle flex min-h-screen items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-xl rounded-3xl border bg-card p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-amber-700">403</p>
        <h1 className="mt-4 text-3xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You do not have permission to view this page. Please sign in with an
          authorized account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="rounded-xl border px-4 py-3 text-sm font-semibold"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
