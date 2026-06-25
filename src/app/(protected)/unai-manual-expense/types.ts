import { ExpenseItem, ExpensesMap, ID, Location } from '@/app/types/moa';

export type EditableExpenseItem = Omit<ExpenseItem, 'amount'> & {
  amount: number | string;
  _tempId?: string;
  _voucherValid?: boolean;
};

export type ExpenseRowValidationErrors = Partial<Record<'due_date' | 'ref_no' | 'payee' | 'particulars' | 'amount', string>>;

export type EditableExpensesMap = Record<number, Record<string, EditableExpenseItem[]>>;

export type SelectedAccountsByLoc = Record<number, number[]>;

export type UnaiManualExpensePayload = {
  id?: number;
  moa_shared_id?: number;
  location_id: number;
  account_no: string | number;
  particulars: string;
  amount: number;
  due_date: string | null;
  due_date_from?: string | null;
  due_date_to?: string | null;
  ref_no: string;
  payee: string;
};

export type AdminMoaListItem = {
  id: ID;
  moa_name: string;
  locations?: Location[];
  created_at?: string;
};

export type UnaiManualMoaData = {
  moa: {
    id: ID;
    moa_name: string;
    created_at?: string;
  };
  locations: Location[];
  expenses?: ExpensesMap;
  manual_expenses?: ExpensesMap;
  unai_manual_expenses?: ExpensesMap;
  allowed_locations?: ID[];
};

export type AccountTitle = {
  id?: number;
  account_no: string | number;
  account_title: string;
  is_enabled?: 0 | 1 | boolean | string | number | null;
};
