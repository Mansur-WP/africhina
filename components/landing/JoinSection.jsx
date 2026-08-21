import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import WhatsAppCta from './WhatsAppCta.jsx';

const JOURNEY = [
  'Create Your Account',
  'Submit Sourcing or Admission Request',
  'Receive Verified Supplier Quote or Admission Guidance',
  'Track Shipment or Visa Progress',
];

export default function JoinSection() {
  return (
    <section className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#CFA13C] uppercase">
              Get started
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Start your journey with us.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Create a free account and start exploring sourcing or educational
              consulting opportunities from verified suppliers and top
              universities in China.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-md bg-[#CFA13C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b58b2e]"
              >
                Create Your Account
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Log In
              </Link>
            </div>

            <div className="mt-6">
              <WhatsAppCta label="Or chat with us on WhatsApp" />
            </div>
          </div>

          {/* Right: Journey steps */}
          <div className="bg-surface-base rounded-lg border border-border p-8">
            <p className="mb-6 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Your path to success
            </p>
            <div className="space-y-4">
              {JOURNEY.map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {step}
                  </span>
                  {i < JOURNEY.length - 1 && (
                    <ArrowRight
                      size={14}
                      className="ml-auto text-muted-foreground"
                    />
                  )}
                  {i === JOURNEY.length - 1 && (
                    <CheckCircle2
                      size={16}
                      className="ml-auto text-[#CFA13C]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
