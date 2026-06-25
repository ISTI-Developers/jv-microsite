import dayjs from 'dayjs';
import { createElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Column } from '../components/DataTable';
import { ExpenseListRow } from './actions';

function formatAmount(value: string | number | null) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function renderStatus(row: ExpenseListRow) {
  const status = row.display_status ?? (row.is_realized ? 'Realized' : row.source_type === 'JV' ? 'JV' : 'API');
  const className =
    status === 'Realized'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'JV'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return createElement(Badge, { variant: 'outline', className }, status);
}

function renderUnaiAmount(row: ExpenseListRow) {
  const amount = row.display_amount ?? (row.is_realized ? row.realized_amount : null) ?? row.un_amount;

  if (!row.is_realized) {
    return formatAmount(amount);
  }

  return createElement('div', { className: 'space-y-0.5' }, [
    createElement('div', { key: 'amount', className: 'font-medium text-emerald-700' }, formatAmount(amount)),
    createElement('div', { key: 'label', className: 'text-xs text-muted-foreground' }, 'Realized DB amount'),
  ]);
}

export const columns: Column<ExpenseListRow>[] = [
  {
    header: 'Status',
    sortable: true,
    sortValue: (row) => row.display_status ?? (row.is_realized ? 'Realized' : row.source_type),
    render: renderStatus,
  },
  {
    header: 'Group Name',
    sortable: true,
    sortValue: (row) => row.group_name ?? '',
    render: (row) => row.group_name ?? '—',
  },
  {
    header: 'Ref No.',
    sortable: true,
    sortValue: (row) => row.ref_no ?? '',
    render: (row) => row.ref_no ?? '—',
  },
  {
    header: 'Account No',
    sortable: true,
    sortValue: (row) => row.account_no ?? '',
    render: (row) => row.account_no ?? '—',
  },
  {
    header: 'Job Number',
    sortable: true,
    sortValue: (row) => row.job_number ?? '',
    render: (row) => row.job_number ?? '—',
  },
  {
    header: 'Due Date',
    sortable: true,
    sortValue: (row) => (row.due_date ? dayjs(row.due_date).valueOf() : 0),
    render: (row) => (row.due_date ? dayjs(row.due_date).format('MMM DD, YYYY') : '—'),
  },
  {
    header: 'Structure ID',
    sortable: true,
    sortValue: (row) => row.structure_id ?? '',
    render: (row) => row.structure_id ?? '—',
  },
  {
    header: 'Payee',
    sortable: true,
    sortValue: (row) => row.payee ?? '',
    render: (row) => row.payee ?? '—',
  },
  {
    header: 'Particulars',
    sortable: true,
    sortValue: (row) => row.particulars ?? '',
    render: (row) => row.particulars ?? '—',
  },
  {
    header: 'JV Amount',
    align: 'right',
    sortable: true,
    sortValue: (row) => Number(row.jv_amount || 0),
    render: (row) => formatAmount(row.jv_amount),
  },
  {
    header: 'UNAI Amount',
    align: 'right',
    sortable: true,
    sortValue: (row) => Number(row.display_amount ?? (row.is_realized ? row.realized_amount : null) ?? row.un_amount ?? 0),
    render: renderUnaiAmount,
  },
];
