'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import DataTable, { Column } from '@/app/(protected)/components/DataTable';
import { ExpenseItem as BaseExpenseItem } from '@/app/types/moa';

type UserMeta = {
  email?: string | null;
  role_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
};

type EditableExpenseItem = BaseExpenseItem & {
  _tempId?: string;
  user?: UserMeta;
};

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

  const columns: Column<EditableExpenseItem>[] = [
    {
      header: 'User',
      render: (row) => {
        const u = row.user;

        const fullName = [u?.last_name, u?.first_name].filter(Boolean).join(', ');
        const fallbackName = u?.email || '-';

        return (
          <div className="max-w-[180px] text-xs leading-tight">
            <p className="font-medium">{fullName || fallbackName}</p>

            {u?.company_name && <p className="truncate text-muted-foreground">{u.company_name}</p>}

            {u?.role_name && (
              <p className={u.role_name === 'ADMIN' ? 'text-xs font-semibold text-red-500' : 'text-muted-foreground'}>
                {u.role_name === 'ADMIN' ? 'UNAI' : u.role_name}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Due Date From',
      render: (row, index) => (
        <Input
          type="date"
          value={row.due_date_from || ''}
          onChange={(e) => {
            updateCell(locId, catId, index, 'due_date_from', e.target.value);

            if (row.due_date_to && e.target.value && row.due_date_to < e.target.value) {
              updateCell(locId, catId, index, 'due_date_to', e.target.value);
            }
          }}
        />
      ),
    },
    {
      header: 'Due Date To',
      render: (row, index) => (
        <Input
          type="date"
          min={row.due_date_from || ''}
          value={row.due_date_to || ''}
          onChange={(e) => {
            const value = e.target.value;

            if (value && row.due_date_from && value < row.due_date_from) {
              e.target.setCustomValidity('Date To cannot be earlier than Date From');
              e.target.reportValidity();
              return;
            }

            e.target.setCustomValidity('');
            updateCell(locId, catId, index, 'due_date_to', value);
          }}
        />
      ),
    },
    {
      header: 'Ref No',
      render: (row, index) => <Input value={row.ref_no || ''} onChange={(e) => updateCell(locId, catId, index, 'ref_no', e.target.value)} />,
    },
    {
      header: 'Payee',
      render: (row, index) => <Input value={row.payee || ''} onChange={(e) => updateCell(locId, catId, index, 'payee', e.target.value)} />,
    },
    {
      header: 'Particulars',
      render: (row, index) => (
        <Input value={row.particulars || ''} onChange={(e) => updateCell(locId, catId, index, 'particulars', e.target.value)} />
      ),
    },
    {
      header: 'Amount',
      render: (row, index) => (
        <Input type="number" value={row.amount || ''} onChange={(e) => updateCell(locId, catId, index, 'amount', e.target.value)} />
      ),
    },
    {
      header: '',
      align: 'center',
      render: (_row, index) => (
        <Button variant="outline" size="icon" onClick={() => deleteRow(locId, catId, index)}>
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

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
