export interface ExpensePayload {
  id: number | null;
  location_id: number;
  account_no: string | number;
  particulars: string;
  amount: number;
  due_date_from: string | null;
  due_date_to: string | null;
  ref_no: string;
  payee: string;
}
