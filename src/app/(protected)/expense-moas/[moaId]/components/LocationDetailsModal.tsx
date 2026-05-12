'use client';

import { Location, JVUser } from '@/app/types/moa';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function getUserDisplayName(user: JVUser) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || user.company_name || user.email;
}

export default function LocationDetailsModal({ open, onClose, location }: { open: boolean; onClose: () => void; location: Location | null }) {
  if (!location) return null;

  const users = (location.jv_users ?? []).slice().sort((a, b) => (b.share_percentage ?? 0) - (a.share_percentage ?? 0));

  const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());

  const totalShare = uniqueUsers.reduce((sum, u) => sum + (u.share_percentage ?? 0), 0);
  const unaiShare = Math.max(0, 100 - totalShare);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{location.location_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {uniqueUsers.length} JV partner{uniqueUsers.length === 1 ? '' : 's'}
            </p>
            <Badge variant="secondary">UNAI: {unaiShare.toFixed(2)}%</Badge>
          </div>

          {uniqueUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No JV partners assigned yet.</div>
          ) : (
            <div className="space-y-2">
              {uniqueUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{getUserDisplayName(user)}</div>
                    {user.company_name ? <div className="text-xs text-muted-foreground">{user.company_name}</div> : null}
                  </div>

                  <Badge variant="outline">{(user.share_percentage ?? 0).toFixed(2)}%</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
