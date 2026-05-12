'use client';

export default function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
      <h3 className="font-semibold text-destructive">Failed to load MOA</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
