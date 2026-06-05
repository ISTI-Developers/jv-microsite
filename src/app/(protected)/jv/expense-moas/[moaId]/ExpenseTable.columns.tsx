import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { Column } from '@/app/(protected)/components/DataTable';
import { ExpenseItem as BaseExpenseItem } from '@/app/types/moa';

type UserMeta = {
  email?: string | null;
  role_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
};

export type EditableExpenseItem = BaseExpenseItem & {
  _tempId?: string;
  user?: UserMeta;
};

type GetExpenseTableColumnsParams = {
  locId: number;
  catId: string | number;
  deleteRow: (locId: number, catId: string | number, index: number) => void;
  updateCell: (locId: number, catId: string | number, index: number, field: keyof BaseExpenseItem, value: string) => void;
};

export function getExpenseTableColumns({ locId, catId, deleteRow, updateCell }: GetExpenseTableColumnsParams): Column<EditableExpenseItem>[] {
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
      header: 'Due Date From',
      sortable: true,
      sortValue: (row) => (row.due_date_from ? dayjs(row.due_date_from).valueOf() : 0),
      render: (row, index) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-10 w-full min-w-[10rem] justify-start rounded-xl text-left font-normal',
                !row.due_date_from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 size-4 shrink-0" />
              {row.due_date_from ? dayjs(row.due_date_from).format('MMM DD, YYYY') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-2xl p-0" align="start">
            <Calendar
              mode="single"
              selected={row.due_date_from ? dayjs(row.due_date_from).toDate() : undefined}
              onSelect={(date) => {
                const value = date ? dayjs(date).format('YYYY-MM-DD') : '';
                updateCell(locId, catId, index, 'due_date_from', value);

                if (row.due_date_to && value && row.due_date_to < value) {
                  updateCell(locId, catId, index, 'due_date_to', value);
                }
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      header: 'Due Date To',
      sortable: true,
      sortValue: (row) => (row.due_date_to ? dayjs(row.due_date_to).valueOf() : 0),
      render: (row, index) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn('h-10 w-full min-w-[10rem] justify-start rounded-xl text-left font-normal', !row.due_date_to && 'text-muted-foreground')}
            >
              <CalendarIcon className="mr-2 size-4 shrink-0" />
              {row.due_date_to ? dayjs(row.due_date_to).format('MMM DD, YYYY') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-2xl p-0" align="start">
            <Calendar
              mode="single"
              selected={row.due_date_to ? dayjs(row.due_date_to).toDate() : undefined}
              onSelect={(date) => updateCell(locId, catId, index, 'due_date_to', date ? dayjs(date).format('YYYY-MM-DD') : '')}
              disabled={(date) => Boolean(row.due_date_from) && dayjs(date).isBefore(dayjs(row.due_date_from), 'day')}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      header: 'Ref No',
      sortable: true,
      sortValue: (row) => row.ref_no ?? '',
      render: (row, index) => <Input value={row.ref_no || ''} onChange={(e) => updateCell(locId, catId, index, 'ref_no', e.target.value)} />,
    },
    {
      header: 'Payee',
      sortable: true,
      sortValue: (row) => row.payee ?? '',
      render: (row, index) => <Input value={row.payee || ''} onChange={(e) => updateCell(locId, catId, index, 'payee', e.target.value)} />,
    },
    {
      header: 'Particulars',
      sortable: true,
      sortValue: (row) => row.particulars ?? '',
      render: (row, index) => (
        <Input value={row.particulars || ''} onChange={(e) => updateCell(locId, catId, index, 'particulars', e.target.value)} />
      ),
    },
    {
      header: 'Amount',
      sortable: true,
      sortValue: (row) => Number(row.amount || 0),
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
}
