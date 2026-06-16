import dayjs from 'dayjs';
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Column } from '../../components/DataTable';
import { RevenueList } from './action';

export function getColumns(setRows: Dispatch<SetStateAction<RevenueList[]>>): Column<RevenueList>[] {
  return [
    {
      header: 'Invoice ID',
      sortable: true,
      sortValue: (row) => row.invoice_id,
      render: (row) => row.invoice_id,
    },
    {
      header: 'Job Number',
      sortable: true,
      sortValue: (row) => row.job_number,
      render: (row) => row.job_number,
    },
    {
      header: 'Reference Date',
      sortable: true,
      sortValue: (row) => (row.reference_date ? dayjs(row.reference_date).valueOf() : 0),
      render: (row) => dayjs(row.reference_date).format('MMM DD, YYYY'),
    },
    {
      header: 'Address',
      sortable: true,
      sortValue: (row) => row.address,
      render: (row) => row.address,
    },
    {
      header: 'Customer Name',
      sortable: true,
      sortValue: (row) => row.Customer_Name,
      render: (row) => row.Customer_Name,
    },
    {
      header: 'Product',
      sortable: true,
      sortValue: (row) => row.Product,
      render: (row) => row.Product || '—',
    },
    {
      header: 'Project',
      sortable: true,
      sortValue: (row) => row.project,
      render: (row) => row.project || '—',
    },
    {
      header: 'Date From',
      sortable: true,
      sortValue: (row) => (row.date_from ? dayjs(row.date_from).valueOf() : 0),
      render: (row) => dayjs(row.date_from).format('MMM DD, YYYY'),
    },
    {
      header: 'Date To',
      sortable: true,
      sortValue: (row) => (row.date_to ? dayjs(row.date_to).valueOf() : 0),
      render: (row) => dayjs(row.date_to).format('MMM DD, YYYY'),
    },
    {
      header: 'Realized Revenue',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.collectionAmount || 0),
      render: (row) => (
        <Input
          type="number"
          step="0.01"
          min="0"
          value={row.collectionAmount ?? ''}
          onChange={(e) => {
            const value = e.target.value;

            setRows((prev) =>
              prev.map((item) =>
                item.invoice_id === row.invoice_id
                  ? {
                      ...item,
                      collectionAmount: value,
                    }
                  : item
              )
            );
          }}
          className="min-w-[140px] border-border bg-muted/50 text-right font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      ),
    },
  ];
}
