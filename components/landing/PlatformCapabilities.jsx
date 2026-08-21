import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    title: 'Wide Range of Products',
    desc: 'From machinery, electronics, and auto parts to fashion and consumer goods — we source it all.',
  },
  {
    title: 'Educational Admission Sourcing',
    desc: 'Assisting students in securing admissions and full/partial scholarships for study in China.',
  },
  {
    title: 'Professional Local Team',
    desc: 'Operating directly from Kano with deep networks in major Chinese industrial cities.',
  },
  {
    title: 'On-Time Delivery & Support',
    desc: 'Real-time tracking of shipments, customs clearance, and doorstep cargo delivery.',
  },
];

export default function PlatformCapabilities() {
  return (
    <section
      id="capabilities"
      className="border-t border-border bg-background py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Two-column: checklist left, image right */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#CFA13C] uppercase">
              Why Choose Africhina Connect Ltd?
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Creating opportunities. Delivering value.
            </h2>

            <div className="mt-8 divide-y divide-border">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-[#CFA13C]"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative h-80 overflow-hidden rounded-lg border border-border lg:h-[480px]">
            <Image
              src="/section-van.png"
              alt="Delivery van at a warehouse — Africhina Connect last-mile delivery in Kano Nigeria"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
