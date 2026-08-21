import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import WhatsAppCta from './WhatsAppCta.jsx';

export default function FinalCta() {
  return (
    <section className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <span className="text-xs font-semibold tracking-widest text-[#CFA13C] uppercase">
              Get in touch
            </span>
            <h2 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Ready to start?
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#CFA13C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b58b2e]"
            >
              Create Your Account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Log In
            </Link>
            <WhatsAppCta label="Chat on WhatsApp" />
          </div>
        </div>
      </div>
    </section>
  );
}
