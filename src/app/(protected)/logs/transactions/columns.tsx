import dayjs from 'dayjs';

import { Column } from '../../components/DataTable';
import { TransactionLogRow } from '../actions';

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function getUserLabel(row: TransactionLogRow) {
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

export const columns: Column<TransactionLogRow>[] = [
  {
    header: 'Created At',
    sortable: true,
    sortValue: (row) => (row.created_at ? dayjs(row.created_at).valueOf() : 0),
    render: (row) => (row.created_at ? dayjs(row.created_at).format('MMM DD, YYYY hh:mm A') : '—'),
  },
  {
    header: 'User',
    sortable: true,
    sortValue: (row) => row.user_name ?? row.user_email ?? '',
    render: getUserLabel,
  },
  {
    header: 'Transaction Type',
    sortable: true,
    sortValue: (row) => row.transaction_type ?? '',
    render: (row) => displayValue(row.transaction_type),
  },
  {
    header: 'Action',
    sortable: true,
    sortValue: (row) => row.action ?? '',
    render: (row) => displayValue(row.action),
  },
  {
    header: 'Reference Table',
    sortable: true,
    sortValue: (row) => row.reference_table ?? '',
    render: (row) => displayValue(row.reference_table),
  },
  {
    header: 'Reference No',
    sortable: true,
    sortValue: (row) => row.reference_no ?? '',
    render: (row) => displayValue(row.reference_no),
  },
  {
    header: 'MOA ID',
    sortable: true,
    sortValue: (row) => row.moa_id ?? '',
    render: (row) => displayValue(row.moa_id),
  },
  {
    header: 'Structure ID',
    sortable: true,
    sortValue: (row) => row.structure_id ?? '',
    render: (row) => displayValue(row.structure_id),
  },
  {
    header: 'Account No',
    sortable: true,
    sortValue: (row) => row.account_no ?? '',
    render: (row) => displayValue(row.account_no),
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
  {
    header: 'Description',
    sortable: true,
    sortValue: (row) => row.description ?? '',
    render: (row) => <span className="block min-w-[240px] max-w-xl whitespace-normal">{displayValue(row.description)}</span>,
  },
];
