export default function AboutSection() {
  return (
    <section id="about" className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#CFA13C] uppercase">
              Who we are
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
              Your trusted trade &amp; education partner between Africa &amp;
              China.
            </h2>
            <p className="mt-4 text-sm font-bold tracking-wider text-muted-foreground uppercase">
              WE CONNECT. WE SOURCE. WE DELIVER. WE GROW.
            </p>
          </div>

          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Africhina Connect Ltd is a dedicated sourcing, import, and
              educational consultancy firm based in Kano, Nigeria. We facilitate
              seamless trade operations between Africa and China with reliable
              logistics, and help students achieve their academic dreams
              globally by providing expert guidance for admission and
              scholarships in China.
            </p>
            <p>
              Whether you are looking to secure high-quality products from
              trusted Chinese factories or seeking visa guidance and admission
              for undergraduate, postgraduate, or language programs in China —
              our professional team handles the entire process end-to-end.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
