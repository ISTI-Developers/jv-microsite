'use client';

import { Box, Button, TextField, MenuItem } from '@mui/material';
import { useState } from 'react';
import AppModal from '../components/AppModal';
import { User } from './users.type';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
type Props = {
  open: boolean;
  user: User | null;
  onClose: () => void;
};

export default function UserProfileModal({ open, user, onClose }: Props) {
  const { user: currentUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user?.profile?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.profile?.last_name ?? '');
  const [entityType, setEntityType] = useState<'individual' | 'company'>(
    (user?.profile?.entity_type as 'individual' | 'company') ?? 'individual'
  );
  const [companyName, setCompanyName] = useState(user?.profile?.company_name ?? '');
  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;

    const isSelf = currentUser?.id === user.id;

    const endpoint = isSelf ? '/users/update-profile' : '/admin/users/update-profile';

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('session')}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        entity_type: entityType,
        company_name: entityType === 'company' ? companyName : null,
      }),
    });

    if (isSelf) {
      await refreshUser();
    } else {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }

    onClose();
  };

  return (
    <AppModal
      key={user.id}
      open={open}
      onClose={onClose}
      title="User Profile"
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="Email" value={user.email} disabled fullWidth />

        <TextField
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          fullWidth
        />

        <TextField
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
        />

        <TextField
          select
          label="Entity Type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as 'individual' | 'company')}
          fullWidth
        >
          <MenuItem value="individual">Individual</MenuItem>
          <MenuItem value="company">Company</MenuItem>
        </TextField>

        {entityType === 'company' && (
          <TextField
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            fullWidth
          />
        )}
      </Box>
    </AppModal>
  );
}
