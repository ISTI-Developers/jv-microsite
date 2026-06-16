import { Eye, Power, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Column } from '@/app/(protected)/components/DataTable';
import { ROLE_LABELS } from '@/constants/roles';
import { ACTIVE_STATUS_CONFIG, FORCE_PASSWORD_CHANGE_CONFIG } from '@/constants/userStatus';
import { User } from './users.type';

type CreateUserColumnsProps = {
  setSelectedUser: (user: User) => void;
  handleReset: (userId: number) => void;
  resetPending: boolean;
  togglePending: boolean;
  toggleStatus: (payload: { userId: number; status: 0 | 1 }) => void;
};

export function createUserColumns({
  setSelectedUser,
  handleReset,
  resetPending,
  togglePending,
  toggleStatus,
}: CreateUserColumnsProps): Column<User>[] {
  return [
    {
      header: 'Email',
      render: (user) => user.email,
      sortable: true,
      sortValue: (user) => user.email,
    },
    {
      header: 'First Name',
      render: (user) => user.profile?.first_name ?? '—',
      sortable: true,
      sortValue: (user) => user.profile?.first_name ?? '',
    },
    {
      header: 'Last Name',
      render: (user) => user.profile?.last_name ?? '—',
      sortable: true,
      sortValue: (user) => user.profile?.last_name ?? '',
    },
    {
      header: 'Role',
      render: (user) => <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">{ROLE_LABELS[user.role_id] ?? '—'}</Badge>,
      sortable: true,
      sortValue: (user) => ROLE_LABELS[user.role_id] ?? '',
    },
    {
      header: 'Active',
      render: (user) => {
        const active = ACTIVE_STATUS_CONFIG[user.is_active ? 1 : 0];

        return (
          <Badge
            className={
              active.color === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
            }
          >
            {active.label}
          </Badge>
        );
      },
      sortable: true,
      sortValue: (user) => ACTIVE_STATUS_CONFIG[user.is_active ? 1 : 0].label,
    },
    {
      header: 'Force Change Password',
      render: (user) => {
        const force = FORCE_PASSWORD_CHANGE_CONFIG[user.force_password_change ? 1 : 0];

        return (
          <Badge
            className={
              force.color === 'warning'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
            }
          >
            {force.label}
          </Badge>
        );
      },
      sortable: true,
      sortValue: (user) => FORCE_PASSWORD_CHANGE_CONFIG[user.force_password_change ? 1 : 0].label,
    },
    {
      header: 'Last Login',
      render: (user) => (user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'),
      sortable: true,
      sortValue: (user) => (user.last_login ? new Date(user.last_login).getTime() : 0),
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
              disabled={resetPending}
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
                toggleStatus({
                  userId: user.id,
                  status: isActive ? 0 : 1,
                })
              }
              disabled={togglePending}
            >
              <Power className="size-4" />
            </button>
          </div>
        );
      },
    },
  ];
}
