import dayjs from 'dayjs';

import { Column } from '@/app/(protected)/components/DataTable';
import { MoaActivityLogRow } from '@/app/(protected)/logs/actions';

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function getUserLabel(row: MoaActivityLogRow) {
  const name = row.user_name?.trim();
  const email = row.user_email?.trim();

  if (name && email) {
    return (
      <div className="min-w-[180px]">
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
    );
  }

  return name || email || '—';
}

export const moaActivityLogColumns: Column<MoaActivityLogRow>[] = [
  {
    header: 'Created At',
    sortable: true,
    sortValue: (row) => (row.created_at ? dayjs(row.created_at).valueOf() : 0),
    render: (row) => (row.created_at ? dayjs(row.created_at).format('MMM DD, YYYY hh:mm A') : '—'),
  },
  {
    header: 'Log Type',
    sortable: true,
    sortValue: (row) => row.log_type ?? '',
    render: (row) => displayValue(row.log_type),
  },
  {
    header: 'User',
    sortable: true,
    sortValue: (row) => row.user_name ?? row.user_email ?? '',
    render: getUserLabel,
  },
  {
    header: 'Action',
    sortable: true,
    sortValue: (row) => row.action ?? '',
    render: (row) => displayValue(row.action),
  },
  {
    header: 'Module / Type',
    sortable: true,
    sortValue: (row) => row.module_or_type ?? '',
    render: (row) => displayValue(row.module_or_type),
  },
  {
    header: 'Description',
    sortable: true,
    sortValue: (row) => row.description ?? '',
    render: (row) => <span className="block min-w-[240px] max-w-xl whitespace-normal">{displayValue(row.description)}</span>,
  },
  {
    header: 'Reference No',
    sortable: true,
    sortValue: (row) => row.reference_no ?? '',
    render: (row) => displayValue(row.reference_no),
  },
  {
    header: 'Amount',
    align: 'right',
    sortable: true,
    sortValue: (row) => Number(row.amount ?? 0),
    render: (row) =>
      row.amount !== null && row.amount !== undefined && row.amount !== ''
        ? Number(row.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '—',
  },
];
