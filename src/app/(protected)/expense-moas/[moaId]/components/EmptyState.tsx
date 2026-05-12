'use client';

export default function EmptyState({ title = 'No data', description = 'Nothing to show here yet.' }: { title?: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
