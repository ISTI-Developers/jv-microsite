// components/ChangePasswordModal.tsx
'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

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
        if (
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: string }).error === 'string'
        ) {
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
    <Dialog
      open={open}
      onClose={forced ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown={forced}
    >
      <DialogTitle>Change Password</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {forced && <Alert severity="warning">You must change your password to continue.</Alert>}

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
          />

          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        {!forced && <Button onClick={onClose}>Cancel</Button>}
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          Change
        </Button>
      </DialogActions>
    </Dialog>
  );
}
