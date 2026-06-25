import { ExpenseItem, ExpensesMap, ID, Location } from '@/app/types/moa';

export type EditableRevenueItem = Omit<ExpenseItem, 'amount'> & {
  amount: number | string;
  _tempId?: string;
};

export type RevenueRowValidationErrors = Partial<Record<'due_date' | 'ref_no' | 'payee' | 'particulars' | 'amount', string>>;

export type EditableRevenueMap = Record<number, Record<string, EditableRevenueItem[]>>;

export type SelectedAccountsByLoc = Record<number, number[]>;

export type UnaiManualRevenuePayload = {
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

export type UnaiManualRevenueMoaData = {
  moa: {
    id: ID;
    moa_name: string;
    created_at?: string;
  };
  locations: Location[];
  unai_manual_revenue?: ExpensesMap;
  allowed_locations?: ID[];
};

export type RevenueAccountTitle = {
  id?: number;
  account_no: string | number;
  account_title: string;
  is_enabled?: 0 | 1 | boolean | string | number | null;
};
