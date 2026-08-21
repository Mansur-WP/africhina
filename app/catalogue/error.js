'use client';

import { useEffect } from 'react';

/**
 * Catalogue error boundary. Catches failures from the server data fetch (e.g.
 * the database being unavailable) and offers a retry. Never shows fake product
 * data on failure.
 */
export default function CatalogueError({ error, reset }) {
  useEffect(() => {
    // Surface the error for observability without leaking details to the UI.
    console.error('Catalogue failed to load:', error);
  }, [error]);

  return (
    <div className="bg-background-subtle min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">
            We couldn&apos;t load the catalogue
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Something went wrong while loading products. Please try again in a
            moment.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="hover:bg-brand-hover rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="text-text-secondary hover:text-text-primary text-sm font-medium"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
