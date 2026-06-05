'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import DataTable from '@/app/(protected)/components/DataTable';
import { ExpenseItem as BaseExpenseItem } from '@/app/types/moa';
import { EditableExpenseItem, getExpenseTableColumns } from './ExpenseTable.columns';

type Props = {
  locId: number;
  catId: string | number;
  catName: string;
  rows: EditableExpenseItem[];
  addRow: (locId: number, catId: string | number) => void;
  deleteRow: (locId: number, catId: string | number, index: number) => void;
  updateCell: (locId: number, catId: string | number, index: number, field: keyof BaseExpenseItem, value: string) => void;
};

export default function ExpenseTable({ locId, catId, catName, rows, addRow, deleteRow, updateCell }: Props) {
  const totalAmount = useMemo(() => {
    return rows.reduce((sum, row) => {
      const amount = Number(row.amount) || 0;
      return sum + amount;
    }, 0);
  }, [rows]);

  const columns = getExpenseTableColumns({ locId, catId, deleteRow, updateCell });

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex justify-between">
        <p className="font-semibold">{catName}</p>
        <Button size="sm" onClick={() => addRow(locId, catId)}>
          + Add Row
        </Button>
      </div>

      <DataTable rows={rows} columns={columns} getRowKey={(row) => row._tempId ?? `db-${row.id}`} pagination={false} />

      <div className="flex justify-end border-t pt-3">
        <div className="text-sm">
          <span className="mr-2 font-medium">Total Amount:</span>
          <span className="font-semibold">
            {totalAmount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
