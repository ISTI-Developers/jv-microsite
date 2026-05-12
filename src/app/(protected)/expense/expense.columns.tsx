import dayjs from 'dayjs';
import { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Column } from '../components/DataTable';
import { ExpenseRow } from './action';

export function getExpenseColumns(setRows: Dispatch<SetStateAction<ExpenseRow[]>>): Column<ExpenseRow>[] {
  return [
    { header: 'Transaction No.', render: (row) => row.cTranNo.trim() },
    {
      header: 'Date',
      render: (row) => dayjs(row.dDate).format('MMM DD, YYYY'),
    },
    { header: 'Payee', render: (row) => row.cName },
    {
      header: 'Month',
      render: () => 'N/A',
    },
    { header: 'Lease Contract ID', render: (row) => row.cleaseContractID },
    {
      header: 'Amount',
      align: 'right',
      render: (row) =>
        Number(row.nAmount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      header: 'Realized Expense',
      align: 'right',
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
                item.cTranNo === row.cTranNo
                  ? {
                      ...item,
                      realizedExpense: value,
                    }
                  : item
              )
            );
          }}
          className="min-w-[140px] text-right"
        />
      ),
    },
    { header: 'Title', render: (row) => row.cTitle },
    { header: 'Location', render: (row) => row.cLocation },
    { header: 'Report Group', render: (row) => row.cReportGroup },
    { header: 'Group Name', render: (row) => row.cGroupName },
  ];
}
