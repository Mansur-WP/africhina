export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto max-w-lg">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
