import dayjs from 'dayjs';
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Column } from '../components/DataTable';
import { ExpenseRow } from './action';

export function getExpenseColumns(setRows: Dispatch<SetStateAction<ExpenseRow[]>>): Column<ExpenseRow>[] {
  return [
    { header: 'Transaction No.', sortable: true, sortValue: (row) => row.cTranNo.trim(), render: (row) => row.cTranNo.trim() },
    {
      header: 'Date',
      sortable: true,
      sortValue: (row) => dayjs(row.dDate).valueOf(),
      render: (row) => dayjs(row.dDate).format('MMM DD, YYYY'),
    },
    { header: 'Payee', sortable: true, sortValue: (row) => row.cName ?? '', render: (row) => row.cName },
    {
      header: 'Month',
      sortable: true,
      sortValue: () => '',
      render: () => 'N/A',
    },
    { header: 'Lease Contract ID', sortable: true, sortValue: (row) => row.cleaseContractID ?? '', render: (row) => row.cleaseContractID },
    {
      header: 'Amount',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.nAmount ?? 0),
      render: (row) =>
        Number(row.nAmount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      header: 'Realized Expense',
      align: 'right',
      sortable: true,
      sortValue: (row) => Number(row.realizedExpense || 0),
      render: (row) => (
        <Input
          type="number"
          step="0.01"
          min="0"
          value={row.realizedExpense ?? ''}
          onChange={(e) => {
            const value = e.target.value;

            setRows((prev) =>
              prev.map((item) =>
                item.rowKey === row.rowKey
                  ? {
                      ...item,
                      realizedExpense: value,
                    }
                  : item
              )
            );
          }}
          className="min-w-[140px] border-border bg-muted/50 text-right font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      ),
    },
    { header: 'Title', sortable: true, sortValue: (row) => row.cTitle ?? '', render: (row) => row.cTitle },
    { header: 'Location', sortable: true, sortValue: (row) => row.cLocation ?? '', render: (row) => row.cLocation },
    { header: 'Report Group', sortable: true, sortValue: (row) => row.cReportGroup ?? '', render: (row) => row.cReportGroup },
  ];
}
