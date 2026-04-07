// src/app/(private)/users/page.tsx
'use client';

import { ROLE_LABELS, Roles } from '@/constants/roles';
import { ACTIVE_STATUS_CONFIG, FORCE_PASSWORD_CHANGE_CONFIG } from '@/constants/userStatus';
import { apiFetch } from '@/lib/api';
import { Eye, Power, RotateCcw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { User } from './users.type';
import DataTable, { Column } from '../components/DataTable';
import UserProfileModal from './UserProfileModal';
import AppModal from '../components/AppModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function StatusPill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' }) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>{label}</span>;
}

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
    onError: (mutationError) => {
      if (mutationError instanceof Error) alert(mutationError.message);
      else alert('Something went wrong');
    },
  });

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
    onError: (mutationError) => {
      if (mutationError instanceof Error) alert(mutationError.message);
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

  const handleReset = (userId: number) => {
    if (!confirm('Reset password for this user?')) return;
    resetMutation.mutate(userId);
  };

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
    return <div className="p-3 text-sm text-muted-foreground">Loading users...</div>;
  }

  if (error instanceof Error) {
    return <div className="p-3 text-sm text-red-600">{error.message}</div>;
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
      render: (user) => <StatusPill label={ROLE_LABELS[user.role_id] ?? '—'} />,
    },
    {
      header: 'Active',
      render: (user) => {
        const active = ACTIVE_STATUS_CONFIG[user.is_active ? 1 : 0];
        return <StatusPill label={active.label} tone={active.color === 'success' ? 'success' : 'default'} />;
      },
    },
    {
      header: 'Force Change Password',
      render: (user) => {
        const force = FORCE_PASSWORD_CHANGE_CONFIG[user.force_password_change ? 1 : 0];
        return <StatusPill label={force.label} tone={force.color === 'warning' ? 'warning' : 'default'} />;
      },
    },
    {
      header: 'Last Login',
      render: (user) => (user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (user) => {
        const isActive = user.is_active === 1;

        return (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              title="View Profile"
              className="rounded-lg border border-input p-2 transition hover:bg-muted"
              onClick={() => setSelectedUser(user)}
            >
              <Eye className="size-4" />
            </button>

            <button
              type="button"
              title="Reset Password"
              className="rounded-lg border border-input p-2 transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              onClick={() => handleReset(user.id)}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="size-4" />
            </button>

            <button
              type="button"
              title={isActive ? 'Deactivate User' : 'Activate User'}
              className={cn(
                'rounded-lg border p-2 transition disabled:pointer-events-none disabled:opacity-50',
                isActive ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'
              )}
              onClick={() =>
                toggleMutation.mutate({
                  userId: user.id,
                  status: isActive ? 0 : 1,
                })
              }
              disabled={toggleMutation.isPending}
            >
              <Power className="size-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <Button onClick={() => setOpenInvite(true)}>Invite User</Button>
      </div>

      <DataTable rows={users ?? []} columns={columns} getRowKey={(row) => row.id} />

      <UserProfileModal key={selectedUser?.id ?? 'none'} open={!!selectedUser} user={selectedUser} onClose={() => setSelectedUser(null)} />

      <AppModal
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        title="Invite User"
        maxWidth="xs"
        actions={
          <>
            <Button variant="outline" onClick={() => setOpenInvite(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
              Send Invite
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-10" />
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(Number(e.target.value))}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value={Roles.ADMIN}>Admin</option>
              <option value={Roles.JOINT_VENTURE}>Joint Venture</option>
            </select>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
