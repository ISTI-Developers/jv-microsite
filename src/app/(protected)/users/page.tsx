'use client';

import { Roles } from '@/constants/roles';
import { apiFetch } from '@/lib/api';
import { Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { User } from './users.type';
import DataTable from '../components/DataTable';
import UserProfileModal from './UserProfileModal';
import AppModal from '../components/AppModal';
import PageHeader from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUserColumns } from './columns';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
export default function UsersPage() {
  const queryClient = useQueryClient();

  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteRole, setInviteRole] = useState<number>(Roles.JOINT_VENTURE);
  const [inviteSubmitAttempted, setInviteSubmitAttempted] = useState(false);
  const roleItems = [
    { label: 'Admin', value: String(Roles.ADMIN) },
    { label: 'Joint Venture', value: String(Roles.JOINT_VENTURE) },
  ];
  const inviteEmailMissing = inviteSubmitAttempted && !inviteEmail.trim();
  const inviteRoleMissing = inviteSubmitAttempted && !inviteRole;
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
      toast.success('Temporary password sent.');
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Something went wrong');
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
      toast.success('Invitation sent successfully.');
      setOpenInvite(false);
      setInviteEmail('');
      setInviteSubmitAttempted(false);
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Something went wrong');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: 0 | 1 }) => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Something went wrong');
    },
  });

  const handleReset = (userId: number) => {
    if (!confirm('Reset password for this user?')) return;
    resetMutation.mutate(userId);
  };

  const handleInvite = () => {
    setInviteSubmitAttempted(true);

    if (!inviteEmail.trim() || !inviteRole) {
      toast.error('Please fill in all required fields.');
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

  const columns = createUserColumns({
    setSelectedUser,
    handleReset,
    resetPending: resetMutation.isPending,
    togglePending: toggleMutation.isPending,
    toggleStatus: toggleMutation.mutate,
  });

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage users and invitations"
        icon={Users}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInviteSubmitAttempted(false);
              setOpenInvite(true);
            }}
          >
            Invite User
          </Button>
        }
        className="mb-6"
      />

      <DataTable rows={users ?? []} columns={columns} getRowKey={(row) => row.id} />

      <UserProfileModal
        key={selectedUser?.id ?? 'none'}
        open={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        showActivityLogs
      />

      <AppModal
        open={openInvite}
        onClose={() => {
          setOpenInvite(false);
          setInviteSubmitAttempted(false);
        }}
        title="Invite User"
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setOpenInvite(false);
                setInviteSubmitAttempted(false);
              }}
            >
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
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-10"
              aria-invalid={inviteEmailMissing}
            />
            {inviteEmailMissing && <p className="text-sm text-destructive">Email is required.</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Role <span className="text-destructive">*</span>
            </label>

            <Select value={String(inviteRole)} onValueChange={(value) => setInviteRole(Number(value))}>
              <SelectTrigger id="invite-role" className="h-10 w-full rounded-lg" aria-invalid={inviteRoleMissing}>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>

                  {roleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {inviteRoleMissing && <p className="text-sm text-destructive">Role is required.</p>}
          </div>
        </div>
      </AppModal>
    </div>
  );
}
