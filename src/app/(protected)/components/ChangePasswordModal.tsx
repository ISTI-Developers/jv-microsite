// components/ChangePasswordModal.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AppModal from './AppModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  open: boolean;
  onClose: () => void;
  forced?: boolean;
};

export default function ChangePasswordModal({ open, onClose, forced = false }: Props) {
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('session')}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string') {
          throw new Error((data as { error: string }).error);
        }

        throw new Error('Failed');
      }

      logout();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={forced ? () => {} : onClose}
      hideCloseButton={forced}
      title="Change Password"
      maxWidth="sm"
      footer={
        <>
          {!forced && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading}>
            Change
          </Button>
        </>
      }
    >
      <div className="space-y-4 pt-1">
        {forced && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You must change your password to continue.
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-2">
          <label htmlFor="current-password" className="text-sm font-medium">
            Current Password
          </label>
          <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-password" className="text-sm font-medium">
            New Password
          </label>
          <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </div>
    </AppModal>
  );
}
