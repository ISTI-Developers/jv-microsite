export type ID = number;

export type JVUser = {
  id: ID;
  moa_shared_id?: ID;
  email: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  share_percentage: number;
};

export type Location = {
  id: ID;
  structure_id: number | null;
  location_name: string;
  report_group: string;
  group_name: string;
  unai_management_fee: string | number;
  jv_management_fee: string | number;
  jv_users: JVUser[];
};

export type Category = {
  id: ID;
  name: string;
};

export type ApiCategory = {
  cAcctNo: string | number;
  cTitle: string;
};

export type ExpenseUser = {
  id: ID;
  email: string | null;
  role_id?: ID;
  role_name?: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
};

export type ExpenseItem = {
  id?: ID;
  moa_shared_id?: ID;
  user_id?: ID;
  location_id?: ID;
  share_percentage?: number;
  account_no: string | number | null;
  particulars: string | null;
  amount: number;
  due_date?: string | null;
  due_date_from?: string | null;
  due_date_to?: string | null;
  ref_no: string;
  payee: string;
  date_created?: string;
  user?: ExpenseUser;
};

export type ExpensesMap = Record<ID, Record<string, ExpenseItem[]>>;

export type Moa = {
  id: ID;
  moa_name: string;
  locations: Location[];
  created_at: string;
};

export type MoaData = {
  moa: {
    id: ID;
    moa_name: string;
    created_at?: string;
  };
  locations: Location[];
  expenses: ExpensesMap;
  allowed_locations?: ID[];
  categories?: Category[];
};
