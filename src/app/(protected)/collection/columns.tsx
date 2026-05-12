import dayjs from 'dayjs';
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Column } from '../components/DataTable';
import { RevenueRow } from './action';

export function getRevenueColumns(setRows: Dispatch<SetStateAction<RevenueRow[]>>): Column<RevenueRow>[] {
  return [
    { header: 'Contract ID', render: (row) => row.cContractID ?? '—' },
    { header: 'Job Number', render: (row) => row.cJobNo ?? '—' },
    {
      header: 'Invoice Date',
      render: (row) => (row.invoiceDate ? dayjs(row.invoiceDate).format('MMM DD, YYYY') : '—'),
    },
    { header: 'Invoice No', render: (row) => row.cInvNo ?? '—' },
    { header: 'Client Name', render: (row) => row.cClientName ?? '—' },
    { header: 'Product', render: (row) => row.cBrandName ?? '—' },
    {
      header: 'Due Date From',
      render: (row) => (row.dueDateFrom ? dayjs(row.dueDateFrom).format('MMM DD, YYYY') : '—'),
    },
    {
      header: 'Due Date To',
      render: (row) => (row.dueDateTo ? dayjs(row.dueDateTo).format('MMM DD, YYYY') : '—'),
    },
    {
      header: 'Invoice Amount',
      align: 'right',
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
                item.cInvNo === row.cInvNo
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
    { header: 'OR Number', render: (row) => row.orNumber ?? '—' },
    {
      header: 'OR Date',
      render: (row) => (row.orDate ? dayjs(row.orDate).format('MMM DD, YYYY') : '—'),
    },
    { header: 'Group Name', render: (row) => row.cGroupName || '—' },
    { header: 'Report Group', render: (row) => row.cReportGroup || '—' },
  ];
}
