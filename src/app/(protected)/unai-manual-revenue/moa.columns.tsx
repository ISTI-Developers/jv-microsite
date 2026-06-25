import { Column } from '@/app/(protected)/components/DataTable';
import { AdminMoaListItem } from './types';

export const moaColumns: Column<AdminMoaListItem>[] = [
  {
    header: 'MOA',
    sortable: true,
    sortValue: (row) => row.moa_name ?? '',
    render: (row) => <span className="font-medium">{row.moa_name}</span>,
  },
  {
    header: 'Locations',
    sortable: true,
    sortValue: (row) => row.locations?.length ?? 0,
    render: (row) => {
      const locations = row.locations ?? [];

      if (locations.length === 0) {
        return '—';
      }

      return locations.map((location) => location.location_name).join(', ');
    },
  },
  {
    header: 'Creation Date',
    sortable: true,
    sortValue: (row) => (row.created_at ? new Date(row.created_at).getTime() : 0),
    render: (row) => row.created_at ?? '—',
  },
];
