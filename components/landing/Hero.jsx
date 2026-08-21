import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import WhatsAppCta from './WhatsAppCta.jsx';

export default function Hero() {
  return (
    <section id="top" className="bg-background">
      {/* ── Full Cover Background Hero Banner ── */}
      <div className="relative flex min-h-[75vh] items-center overflow-hidden bg-zinc-950">
        {/* Cover Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-truck.png"
            alt="Cargo truck on the road — Africhina Connect China-to-Nigeria import logistics"
            fill
            className="object-cover object-center opacity-60"
            priority
            sizes="100vw"
          />
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30 lg:from-black/95 lg:via-black/60 lg:to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-12">
          <div className="max-w-2xl text-white">
            <p className="text-xs font-bold tracking-widest text-[#CFA13C] uppercase">
              China-to-Nigeria sourcing &amp; education platform
            </p>

            <h1 className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl md:text-[3.5rem]">
              Import from China to Nigeria like never before.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-300">
              Africhina Connect handles the entire sourcing, import, and
              educational consultancy process for you — from finding trusted
              factories to securing university admissions and scholarships in
              China.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#CFA13C] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#b58b2e] sm:w-auto"
              >
                Create Your Account
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-md border border-white/30 bg-black/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
              >
                Log In
              </Link>
              <WhatsAppCta
                label="WhatsApp"
                className="w-full !border-white/30 !bg-black/20 !text-white backdrop-blur-sm hover:!bg-white/10 hover:!text-white sm:w-auto [&_svg]:!text-[#CFA13C]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <p className="mb-8 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Useful for business.
        </p>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Our sourcing and import management solutions help businesses and
          individuals cut through the complexity and cost of buying from China —
          without needing prior experience.
        </p>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { value: '100%', label: 'Supplier Verified Orders' },
            { value: 'Direct', label: 'Factory Pricing — No Hidden Fees' },
            { value: 'End-to-End', label: 'Import Management & Support' },
            { value: '24/7', label: 'Shipment Tracking Updates' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-base rounded-lg border border-border p-5"
            >
              <span className="block text-2xl font-bold text-foreground tabular-nums">
                {s.value}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
