'use client';

import { Card, CardContent } from '@/components/ui/card';

export default function ExpenseSummaryCard({ totalLocations, totalJV }: { totalLocations: number; totalJV: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">Total Locations</div>
          <div className="mt-1 text-2xl font-semibold">{totalLocations}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="text-sm text-muted-foreground">Total JV Partners</div>
          <div className="mt-1 text-2xl font-semibold">{totalJV}</div>
        </CardContent>
      </Card>
    </div>
  );
}
