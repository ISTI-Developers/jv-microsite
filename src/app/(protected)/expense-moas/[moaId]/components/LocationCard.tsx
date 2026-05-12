'use client';

import { useState } from 'react';
import { Location, JVUser } from '@/app/types/moa';
import { Badge } from '@/components/ui/badge';
import LocationDetailsModal from './LocationDetailsModal';

function getUserDisplayName(user: JVUser) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.company_name || user.email;
}

export default function LocationCard({ location }: { location: Location }) {
  const [open, setOpen] = useState(false);

  const users = location?.jv_users ?? [];
  const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer rounded-xl border p-4 transition hover:bg-muted/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{location.location_name}</h3>
            <p className="text-sm text-muted-foreground">
              {uniqueUsers.length} JV partner{uniqueUsers.length === 1 ? '' : 's'}
            </p>
          </div>

          <Badge variant="secondary">{uniqueUsers.length}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {uniqueUsers.slice(0, 3).map((user) => (
            <Badge key={user.id} variant="outline">
              {getUserDisplayName(user)}
            </Badge>
          ))}

          {uniqueUsers.length > 3 && <Badge variant="outline">+{uniqueUsers.length - 3} more</Badge>}
        </div>
      </div>

      <LocationDetailsModal open={open} onClose={() => setOpen(false)} location={location} />
    </>
  );
}
