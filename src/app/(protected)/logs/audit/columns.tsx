import dayjs from 'dayjs';

import { Column } from '../../components/DataTable';
import { AuditLogRow } from '../actions';

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function getModule(row: AuditLogRow) {
  return row.module ?? row.module_or_type ?? '—';
}

function getUserLabel(row: AuditLogRow) {
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

export const columns: Column<AuditLogRow>[] = [
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
    header: 'Action',
    sortable: true,
    sortValue: (row) => row.action ?? '',
    render: (row) => displayValue(row.action),
  },
  {
    header: 'Module',
    sortable: true,
    sortValue: (row) => row.module ?? row.module_or_type ?? '',
    render: getModule,
  },
  {
    header: 'Entity Type',
    sortable: true,
    sortValue: (row) => row.entity_type ?? '',
    render: (row) => displayValue(row.entity_type),
  },
  {
    header: 'Entity ID',
    sortable: true,
    sortValue: (row) => row.entity_id ?? '',
    render: (row) => displayValue(row.entity_id),
  },
  {
    header: 'Description',
    sortable: true,
    sortValue: (row) => row.description ?? '',
    render: (row) => <span className="block min-w-[240px] max-w-xl whitespace-normal">{displayValue(row.description)}</span>,
  },
  {
    header: 'IP Address',
    sortable: true,
    sortValue: (row) => row.ip_address ?? '',
    render: (row) => displayValue(row.ip_address),
  },
];
