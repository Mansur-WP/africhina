const PROBLEMS = [
  {
    title: 'Finding Reliable Suppliers',
    description:
      'Most buyers have no way to verify which Chinese factories are legitimate, leading to wrong products, poor quality, or outright fraud.',
  },
  {
    title: 'Unclear Costs & Hidden Fees',
    description:
      'Agent fees, currency conversions, and unclear shipping quotes make it almost impossible to know your real landed cost before committing.',
  },
  {
    title: 'Shipping & Customs Confusion',
    description:
      'Organising sea or air freight, clearing Nigerian customs, and tracking a shipment across thousands of miles is overwhelming without the right experience.',
  },
  {
    title: 'Capital & Experience Barriers',
    description:
      'Many people believe importing requires huge capital or deep industry knowledge. We make it accessible for anyone who wants to start small.',
  },
];

export default function ProblemSection() {
  return (
    <section className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          {/* Left header */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              The problem
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Why buying from China feels risky and overwhelming.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Most people face these four major challenges when trying to import
              products from China on their own.
            </p>
          </div>

          {/* Right problem list */}
          <div className="divide-y divide-border">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="py-6 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
