import dayjs from 'dayjs';
import { Column } from '../components/DataTable';
import { ExpenseListRow } from './actions';

export const columns: Column<ExpenseListRow>[] = [
  {
    header: 'ID',
    sortable: true,
    sortValue: (row) => row.id,
    render: (row) => row.id,
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
    header: 'Invoice ID',
    sortable: true,
    sortValue: (row) => row.invoice_id ?? '',
    render: (row) => row.invoice_id ?? '—',
  },
  {
    header: 'Account No',
    sortable: true,
    sortValue: (row) => row.account_no ?? '',
    render: (row) => row.account_no ?? '—',
  },
  {
    header: 'Transaction No',
    sortable: true,
    sortValue: (row) => row.transaction_no ?? '',
    render: (row) => row.transaction_no ?? '—',
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
    sortValue: (row) => row.due_date_from ?? '',
    render: (row) => (row.due_date_from ? dayjs(row.due_date_from).format('MMM DD, YYYY') : '—'),
  },
  {
    header: 'Due Date To',
    sortable: true,
    sortValue: (row) => row.due_date_to ?? '',
    render: (row) => (row.due_date_to ? dayjs(row.due_date_to).format('MMM DD, YYYY') : '—'),
  },
  {
    header: 'Structure ID',
    sortable: true,
    sortValue: (row) => row.structure_id ?? '',
    render: (row) => row.structure_id ?? '—',
  },
  {
    header: 'Site ID',
    sortable: true,
    sortValue: (row) => row.site_id ?? '',
    render: (row) => row.site_id ?? '—',
  },
  {
    header: 'Amount',
    align: 'right',
    sortable: true,
    sortValue: (row) => Number(row.amount ?? 0),
    render: (row) =>
      row.amount !== null
        ? Number(row.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '—',
  },
  {
    header: 'Remarks',
    sortable: true,
    sortValue: (row) => row.remarks ?? '',
    render: (row) => row.remarks ?? '—',
  },
  {
    header: 'Group Name',
    sortable: true,
    sortValue: (row) => row.group_name ?? '',
    render: (row) => row.group_name ?? '—',
  },
  {
    header: 'Date Created',
    sortable: true,
    sortValue: (row) => row.date_created ?? '',
    render: (row) => (row.date_created ? dayjs(row.date_created).format('MMM DD, YYYY hh:mm A') : '—'),
  },
];
