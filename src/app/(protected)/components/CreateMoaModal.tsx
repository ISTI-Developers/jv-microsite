'use client';

import { useState } from 'react';
import { Button, TextField, Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Roles } from '@/constants/roles';
import { User } from '../users/users.type';
import AppModal from './AppModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateMoaModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [moaName, setMoaName] = useState('');
  const [jvUserId, setJvUserId] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [locInput, setLocInput] = useState('');

  const addLocation = () => {
    if (!locInput.trim()) return;
    setLocations((prev) => [...prev, locInput.trim()]);
    setLocInput('');
  };

  const removeLocation = (index: number) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      return data.users;
    },
  });
  const jvUsers = (users ?? []).filter((u) => u.role_id === Roles.JOINT_VENTURE);
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa/create`, {
        method: 'POST',
        body: JSON.stringify({
          moa_name: moaName,
          jv_user_id: Number(jvUserId),
          locations,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create MOA');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-moas'] });
      onClose();
      setMoaName('');
      setJvUserId('');
      setLocations([]);
    },
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Create MOA"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Create
          </Button>
        </>
      }
    >
      <TextField
        label="MOA Name"
        fullWidth
        value={moaName}
        onChange={(e) => setMoaName(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        select
        label="JV User"
        fullWidth
        value={jvUserId}
        onChange={(e) => setJvUserId(e.target.value)}
        sx={{ mb: 2 }}
      >
        {jvUsers.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            {user.profile.first_name} {user.profile.last_name} ({user.profile.company_name})
          </MenuItem>
        ))}
      </TextField>

      <Box display="flex" gap={1} mb={2}>
        <TextField
          label="Location"
          fullWidth
          value={locInput}
          onChange={(e) => setLocInput(e.target.value)}
        />
        <Button variant="contained" onClick={addLocation}>
          Add
        </Button>
      </Box>

      {locations.map((loc, i) => (
        <Box key={i} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          {loc}
          <IconButton size="small" onClick={() => removeLocation(i)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </AppModal>
  );
}
