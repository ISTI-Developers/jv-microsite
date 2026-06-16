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
    <div className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{catName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? 'expense row' : 'expense rows'}
          </p>
        </div>

        <Button size="sm" onClick={() => addRow(locId, catId)} className="shrink-0 rounded-xl">
          + Add Row
        </Button>
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          No rows yet. Use Add Row to start entering expenses for this account.
        </div>
      )}

      <DataTable rows={rows} columns={columns} getRowKey={(row) => row._tempId ?? `db-${row.id}`} pagination={false} />

      <div className="flex justify-end border-t border-border pt-3">
        <div className="text-sm">
          <span className="mr-2 font-medium text-muted-foreground">Total Amount:</span>
          <span className="font-semibold text-foreground">
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
