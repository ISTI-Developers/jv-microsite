import dayjs from 'dayjs';
import { Column } from '../components/DataTable';
import { ExpenseListRow } from './actions';

function formatAmount(value: string | number | null) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const columns: Column<ExpenseListRow>[] = [
  {
    header: 'ID',
    sortable: true,
    sortValue: (row) => row.id,
    render: (row) => row.id,
  },
  {
    header: 'Source',
    sortable: true,
    sortValue: (row) => row.source_type ?? '',
    render: (row) => row.source_type ?? '—',
  },
  {
    header: 'MOA Shared ID',
    sortable: true,
    sortValue: (row) => row.moa_shared_id ?? 0,
    render: (row) => row.moa_shared_id ?? '—',
  },
  {
    header: 'User ID',
    sortable: true,
    sortValue: (row) => row.user_id,
    render: (row) => row.user_id,
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
    header: 'Due Date From',
    sortable: true,
    sortValue: (row) => (row.due_date_from ? dayjs(row.due_date_from).valueOf() : 0),
    render: (row) => (row.due_date_from ? dayjs(row.due_date_from).format('MMM DD, YYYY') : '—'),
  },
  {
    header: 'Due Date To',
    sortable: true,
    sortValue: (row) => (row.due_date_to ? dayjs(row.due_date_to).valueOf() : 0),
    render: (row) => (row.due_date_to ? dayjs(row.due_date_to).format('MMM DD, YYYY') : '—'),
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
    sortValue: (row) => Number(row.un_amount || 0),
    render: (row) => formatAmount(row.un_amount),
  },
];
