import dayjs from 'dayjs';
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Column } from '../components/DataTable';
import { RevenueRow } from './action';

export function getRevenueColumns(setRows: Dispatch<SetStateAction<RevenueRow[]>>): Column<RevenueRow>[] {
  return [
    { header: 'Contract ID', sortable: true, sortValue: (row) => row.cContractID ?? '', render: (row) => row.cContractID ?? '—' },
    { header: 'Job Number', sortable: true, sortValue: (row) => row.cJobNo ?? '', render: (row) => row.cJobNo ?? '—' },
    {
      header: 'Invoice Date',
      sortable: true,
      sortValue: (row) => (row.invoiceDate ? dayjs(row.invoiceDate).valueOf() : 0),
      render: (row) => (row.invoiceDate ? dayjs(row.invoiceDate).format('MMM DD, YYYY') : '—'),
    },
    { header: 'Invoice No', sortable: true, sortValue: (row) => row.cInvNo ?? '', render: (row) => row.cInvNo ?? '—' },
    { header: 'Client Name', sortable: true, sortValue: (row) => row.cClientName ?? '', render: (row) => row.cClientName ?? '—' },
    { header: 'Product', sortable: true, sortValue: (row) => row.cBrandName ?? '', render: (row) => row.cBrandName ?? '—' },
    {
      header: 'Due Date From',
      sortable: true,
      sortValue: (row) => (row.dueDateFrom ? dayjs(row.dueDateFrom).valueOf() : 0),
      render: (row) => (row.dueDateFrom ? dayjs(row.dueDateFrom).format('MMM DD, YYYY') : '—'),
    },
    {
      header: 'Due Date To',
      sortable: true,
      sortValue: (row) => (row.dueDateTo ? dayjs(row.dueDateTo).valueOf() : 0),
      render: (row) => (row.dueDateTo ? dayjs(row.dueDateTo).format('MMM DD, YYYY') : '—'),
    },
    {
      header: 'Invoice Amount',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.invoiceAmount ?? 0),
      render: (row) =>
        row.invoiceAmount != null
          ? Number(row.invoiceAmount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : '—',
    },
    {
      header: 'Realized Revenue',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.realizedRevenue || 0),
      render: (row) => (
        <Input
          type="number"
          step="0.01"
          min="0"
          value={row.realizedRevenue ?? ''}
          onChange={(e) => {
            const value = e.target.value;

            setRows((prev) =>
              prev.map((item) =>
                item.rowKey === row.rowKey
                  ? {
                      ...item,
                      realizedRevenue: value,
                    }
                  : item
              )
            );
          }}
          className="min-w-[140px] text-right"
        />
      ),
    },
    { header: 'OR Number', sortable: true, sortValue: (row) => row.orNumber ?? '', render: (row) => row.orNumber ?? '—' },
    {
      header: 'OR Date',
      sortable: true,
      sortValue: (row) => (row.orDate ? dayjs(row.orDate).valueOf() : 0),
      render: (row) => (row.orDate ? dayjs(row.orDate).format('MMM DD, YYYY') : '—'),
    },
    { header: 'Report Group', sortable: true, sortValue: (row) => row.cReportGroup ?? '', render: (row) => row.cReportGroup || '—' },
  ];
}
