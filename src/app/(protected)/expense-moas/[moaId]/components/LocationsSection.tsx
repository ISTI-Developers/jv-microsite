'use client';

import { Location } from '@/app/types/moa';
import LocationCard from './LocationCard';
import EmptyState from './EmptyState';

export default function LocationsSection({ locations }: { locations: Location[] }) {
  if (locations.length === 0) {
    return <EmptyState title="No Locations" description="This MOA has no locations yet." />;
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Locations</h2>
        <p className="text-sm text-muted-foreground">View all tagged locations and their JV partners.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {locations.map((loc) => (
          <LocationCard key={loc.id} location={loc} />
        ))}
      </div>
    </div>
  );
}
