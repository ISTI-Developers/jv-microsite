import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { Column } from '@/app/(protected)/components/DataTable';
import { ExpenseItem as BaseExpenseItem } from '@/app/types/moa';
import VoucherSuggestInput from './components/VoucherSuggestInput';
import { EditableExpenseItem, ExpenseRowValidationErrors } from './types';

type GetExpenseTableColumnsParams = {
  locId: number;
  catId: string | number;
  deleteRow: (locId: number, catId: string | number, index: number) => void;
  updateCell: (locId: number, catId: string | number, index: number, field: keyof BaseExpenseItem, value: string) => void;
  updateVoucherCell: (locId: number, catId: string | number, index: number, value: string, voucherValid: boolean) => void;
  submitAttempted: boolean;
  rowValidationErrors: Record<string, ExpenseRowValidationErrors>;
};

const getRowKey = (row: EditableExpenseItem) => row._tempId ?? `db-${row.id}`;

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;

  return <p className="mt-1 text-sm text-destructive">{message}</p>;
};

export function getExpenseTableColumns({
  locId,
  catId,
  deleteRow,
  updateCell,
  updateVoucherCell,
  submitAttempted,
  rowValidationErrors,
}: GetExpenseTableColumnsParams): Column<EditableExpenseItem>[] {
  const getFieldError = (row: EditableExpenseItem, field: keyof ExpenseRowValidationErrors) => {
    if (!submitAttempted) return undefined;
    return rowValidationErrors[getRowKey(row)]?.[field];
  };

  return [
    {
      header: 'User',
      sortable: true,
      sortValue: (row) => {
        const u = row.user;
        const fullName = [u?.last_name, u?.first_name].filter(Boolean).join(', ');
        return fullName || u?.email || '';
      },
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
      header: 'Date',
      sortable: true,
      sortValue: (row) => (row.due_date ? dayjs(row.due_date).valueOf() : 0),
      render: (row, index) => {
        const error = getFieldError(row, 'due_date');

        return (
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  aria-invalid={!!error}
                  className={cn(
                    'h-10 w-full min-w-[10rem] justify-start rounded-xl text-left font-normal',
                    !row.due_date && 'text-muted-foreground',
                    error && 'border-destructive'
                  )}
                >
                  <CalendarIcon className="mr-2 size-4 shrink-0" />
                  {row.due_date ? dayjs(row.due_date).format('MMM DD, YYYY') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                <Calendar
                  mode="single"
                  selected={row.due_date ? dayjs(row.due_date).toDate() : undefined}
                  onSelect={(date) => updateCell(locId, catId, index, 'due_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <FieldError message={error} />
          </div>
        );
      },
    },
    {
      header: 'Voucher No.',
      sortable: true,
      sortValue: (row) => row.ref_no ?? '',
      render: (row, index) => {
        const error = getFieldError(row, 'ref_no');

        return (
          <VoucherSuggestInput
            value={row.ref_no || ''}
            isValid={row._voucherValid}
            error={error}
            onChange={(value, voucherValid) => updateVoucherCell(locId, catId, index, value, voucherValid)}
          />
        );
      },
    },
    {
      header: 'Payee',
      sortable: true,
      sortValue: (row) => row.payee ?? '',
      render: (row, index) => {
        const error = getFieldError(row, 'payee');

        return (
          <div>
            <Input value={row.payee || ''} onChange={(e) => updateCell(locId, catId, index, 'payee', e.target.value)} aria-invalid={!!error} />
            <FieldError message={error} />
          </div>
        );
      },
    },
    {
      header: 'Particulars',
      sortable: true,
      sortValue: (row) => row.particulars ?? '',
      render: (row, index) => {
        const error = getFieldError(row, 'particulars');

        return (
          <div>
            <Input
              value={row.particulars || ''}
              onChange={(e) => updateCell(locId, catId, index, 'particulars', e.target.value)}
              aria-invalid={!!error}
            />
            <FieldError message={error} />
          </div>
        );
      },
    },
    {
      header: 'Amount',
      sortable: true,
      sortValue: (row) => Number(row.amount || 0),
      render: (row, index) => {
        const error = getFieldError(row, 'amount');

        return (
          <div>
            <Input
              type="number"
              value={row.amount ?? ''}
              onChange={(e) => updateCell(locId, catId, index, 'amount', e.target.value)}
              aria-invalid={!!error}
            />
            <FieldError message={error} />
          </div>
        );
      },
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
}
