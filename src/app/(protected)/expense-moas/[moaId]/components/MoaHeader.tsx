'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MoaHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">MOA Details</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button onClick={onEdit}>Edit MOA</Button>
      </div>
    </div>
  );
}
