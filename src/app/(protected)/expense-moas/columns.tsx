import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '../components/DataTable';
import { Location, Moa, JVUser } from '../../types/moa';

function getUniqueJvUsers(locations: Location[]): JVUser[] {
  const map = new Map<number, JVUser>();

  locations.forEach((loc) => {
    loc.jv_users.forEach((user) => {
      if (!map.has(user.id)) {
        map.set(user.id, user);
      }
    });
  });

  return Array.from(map.values());
}

type CreateExpenseMoaColumnsParams = {
  router: AppRouterInstance;
};

export function createExpenseMoaColumns({ router }: CreateExpenseMoaColumnsParams): Column<Moa>[] {
  return [
    {
      header: 'MOA',
      sortable: true,
      sortValue: (row) => row.moa_name ?? '',
      render: (row) => <span className="font-medium">{row.moa_name}</span>,
    },
    {
      header: 'Locations',
      sortable: true,
      sortValue: (row) => row.locations.length,
      render: (row) => <Badge variant="secondary">{row.locations.length}</Badge>,
    },
    {
      header: 'JV Partners',
      sortable: true,
      sortValue: (row) => getUniqueJvUsers(row.locations).length,
      render: (row) => {
        const uniqueUsers = getUniqueJvUsers(row.locations);
        return <Badge variant="secondary">{uniqueUsers.length}</Badge>;
      },
    },
    {
      header: 'Creation Date',
      sortable: true,
      sortValue: (row) => (row.created_at ? new Date(row.created_at).getTime() : 0),
      render: (row) => row.created_at,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/expense-moas/${row.id}`);
            }}
          >
            View
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/jv/expense-moas/${row.id}`);
            }}
          >
            Expenses
          </Button>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/expense-moas/${row.id}/edit`);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];
}
