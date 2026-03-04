// src/app/(private)/users/page.tsx
'use client';

import { ROLE_LABELS, Roles } from '@/constants/roles';
import { ACTIVE_STATUS_CONFIG, FORCE_PASSWORD_CHANGE_CONFIG } from '@/constants/userStatus';
import { apiFetch } from '@/lib/api';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  TextField,
  IconButton,
  Tooltip,
  MenuItem,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { User } from './users.type';
import DataTable, { Column } from '../components/DataTable';
import UserProfileModal from './UserProfileModal';
import AppModal from '../components/AppModal';

export default function UsersPage() {
  const queryClient = useQueryClient();

  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteRole, setInviteRole] = useState<number>(Roles.JOINT_VENTURE);

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[]>({
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
  const resetMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Temporary password sent.');
    },
    onError: (error) => {
      if (error instanceof Error) alert(error.message);
      else alert('Something went wrong');
    },
  });
  const handleReset = (userId: number) => {
    if (!confirm('Reset password for this user?')) return;
    resetMutation.mutate(userId);
  };
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role_id }: { email: string; role_id: number }) => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role_id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Invitation sent successfully.');
      setOpenInvite(false);
      setInviteEmail('');
    },
    onError: (error) => {
      if (error instanceof Error) alert(error.message);
      else alert('Something went wrong');
    },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: 0 | 1 }) =>
      apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          status,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      alert('Email is required');
      return;
    }
    inviteMutation.mutate({
      email: inviteEmail.trim().toLowerCase(),
      role_id: inviteRole,
    });
  };
  if (isLoading) {
    return (
      <Box p={3}>
        <CircularProgress />
      </Box>
    );
  }
  if (error instanceof Error) {
    return (
      <Box p={3}>
        <Typography color="error">{error.message}</Typography>
      </Box>
    );
  }
  const columns: Column<User>[] = [
    {
      header: 'Email',
      render: (user) => user.email,
    },
    {
      header: 'First Name',
      render: (user) => user.profile?.first_name ?? '—',
    },
    {
      header: 'Last Name',
      render: (user) => user.profile?.last_name ?? '—',
    },
    {
      header: 'Role',
      render: (user) => <Chip size="small" label={ROLE_LABELS[user.role_id] ?? '—'} />,
    },
    {
      header: 'Active',
      render: (user) => {
        const active = ACTIVE_STATUS_CONFIG[user.is_active ? 1 : 0];
        return <Chip size="small" label={active.label} color={active.color} />;
      },
    },
    {
      header: 'Force Change Password',
      render: (user) => {
        const force = FORCE_PASSWORD_CHANGE_CONFIG[user.force_password_change ? 1 : 0];
        return <Chip size="small" label={force.label} color={force.color} />;
      },
    },
    {
      header: 'Last Login',
      render: (user) =>
        user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
    },
    {
      header: 'Actions',
      align: 'right',
      render: (user) => {
        const isActive = user.is_active === 1;
        return (
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Tooltip title="View Profile">
              <IconButton size="small" onClick={() => setSelectedUser(user)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset Password">
              <IconButton
                size="small"
                onClick={() => handleReset(user.id)}
                disabled={resetMutation.isPending}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={isActive ? 'Deactivate User' : 'Activate User'}>
              <IconButton
                size="small"
                color={isActive ? 'success' : 'error'}
                onClick={() =>
                  toggleMutation.mutate({
                    userId: user.id,
                    status: isActive ? 0 : 1,
                  })
                }
                disabled={toggleMutation.isPending}
              >
                {isActive ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          Users
        </Typography>
        <Button variant="contained" onClick={() => setOpenInvite(true)}>
          Invite User
        </Button>
      </Box>

      <DataTable rows={users ?? []} columns={columns} getRowKey={(row) => row.id} />
      <UserProfileModal
        key={selectedUser?.id ?? 'none'}
        open={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      <AppModal
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        title="Invite User"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setOpenInvite(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleInvite} disabled={inviteMutation.isPending}>
              Send Invite
            </Button>
          </>
        }
      >
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value={Roles.ADMIN}>Admin</MenuItem>
            <MenuItem value={Roles.JOINT_VENTURE}>Joint Venture</MenuItem>
          </TextField>
        </Box>
      </AppModal>
    </Box>
  );
}
