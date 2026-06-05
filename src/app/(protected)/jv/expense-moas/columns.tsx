import { Column } from '../../components/DataTable';
import { Moa } from '../../../types/moa';

export const columns: Column<Moa>[] = [
  {
    header: 'MOA',
    sortable: true,
    sortValue: (row) => row.moa_name ?? '',
    render: (row) => row.moa_name,
  },
  {
    header: 'Locations',
    sortable: true,
    sortValue: (row) => (row.locations.length ? row.locations.map((location) => location.location_name).join(', ') : ''),
    render: (row) => (row.locations.length ? row.locations.map((l) => l.location_name).join(', ') : '—'),
  },
];
