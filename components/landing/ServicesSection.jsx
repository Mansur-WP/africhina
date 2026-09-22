import { CheckCircle2 } from 'lucide-react';

const SERVICES = [
  {
    title: 'Export & Import Services',
    desc: 'Seamless shipping operations between Africa and China with customs clearance, documentation support, freight forwarding, and supply chain management.',
  },
  {
    title: 'Procurement & Sourcing',
    desc: 'We source quality products directly from verified Chinese manufacturers. Includes supplier verification, quality inspections, price negotiation, and bulk procurement.',
  },
  {
    title: 'General Trading',
    desc: 'Access to a wide range of verified products including consumer goods, electronics, auto parts, machinery, fashion & textiles, and building materials.',
  },
  {
    title: 'Educational Consultancy',
    desc: 'Full assistance to study in China or other countries. We handle scholarship sourcing, university admissions, visa guidance, and career counseling for undergraduate & postgraduate programs.',
  },
];

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="border-t border-border bg-background py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left header */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold tracking-widest text-[#CFA13C] uppercase">
              What we do
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Our Core Services
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Africhina Connect is your trusted partner covering trade
              logistics, bulk sourcing, and international educational admissions
              under one roof.
            </p>
          </div>

          {/* Right services list */}
          <div className="divide-y divide-border">
            {SERVICES.map((s, i) => (
              <div key={i} className="flex gap-4 py-6 first:pt-0 last:pb-0">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-[#CFA13C]"
                />
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
