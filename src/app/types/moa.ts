// types/moa.ts

export type ID = number;

export type JVUser = {
  id: ID;
  email: string;
  company_name: string;
  first_name: string;
  last_name: string;
  share_percentage: number;
};

export type Location = {
  id: ID;
  location_name: string;
  jv_users: JVUser[];
};

export type Category = {
  id: ID;
  name: string;
};

export type ApiCategory = {
  cAcctNo: ID;
  cTitle: string;
};

export type ExpenseItem = {
  id?: ID;
  user_id?: ID;
  name: string;
  amount: number;
  date: string;
  ref_no: string;
  payee: string;
};

export type ExpensesMap = Record<ID, Record<ID, ExpenseItem[]>>;
// location_id -> category_id -> ExpenseItem[]

export type Moa = {
  id: ID;
  moa_name: string;
  locations: Location[];
};

export type MoaData = {
  moa: {
    id: ID;
    moa_name: string;
  };
  locations: Location[];
  expenses: ExpensesMap;
};
