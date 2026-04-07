export interface ExpensePayload {
  id: number | null;
  location_id: number;
  category_id: number;
  name: string;
  amount: number;
  date: string;
  ref_no: string;
  payee: string;
}
