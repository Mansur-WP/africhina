const STEPS = [
  {
    n: '01',
    title: 'Create Your Account',
    desc: 'Sign up free in under 2 minutes. No credit card or commitment required.',
  },
  {
    n: '02',
    title: 'Tell Us What You Need',
    desc: 'Submit a product request — describe what you want to source, in simple terms.',
  },
  {
    n: '03',
    title: 'We Source & Quote',
    desc: 'Our team finds verified suppliers and sends you a clear, itemised quotation.',
  },
  {
    n: '04',
    title: 'Review & Confirm',
    desc: 'Review the quote in your account. Ask questions, then confirm your order.',
  },
  {
    n: '05',
    title: 'Make Your Payment',
    desc: 'Pay safely through our platform. Your funds are held securely until the order is verified.',
  },
  {
    n: '06',
    title: 'Goods Are Shipped',
    desc: 'Your products leave China by sea or air and head towards Nigeria.',
  },
  {
    n: '07',
    title: 'Track Your Shipment',
    desc: 'Follow your order at every milestone. We update you throughout the journey.',
  },
  {
    n: '08',
    title: 'Receive Your Goods',
    desc: 'Your goods are cleared through customs and delivered to your address in Kano.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border bg-background py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left header — sticky */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              How it works
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Your full sourcing journey, step by step.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              From your first product request to the moment goods arrive at your
              door — here is exactly what happens.
            </p>
          </div>

          {/* Right step list */}
          <div className="divide-y divide-border">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                <span className="mt-0.5 w-6 shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                  {s.n}
                </span>
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
