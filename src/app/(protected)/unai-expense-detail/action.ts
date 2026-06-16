import { apiFetch } from '@/lib/api';
export type Expense = {
  cCompanyID: string;
  cModule: string;
  cCategory: string;
  cTranNo: string;
  dDate: string;
  cCode: string;
  cName: string;
  dDueDateFrom?: string;
  dDueDateTo?: string;
  cStructureID: string;
  cDepartment?: string;
  cEmpID?: string;
  cEmpName?: string;
  cleaseContractID: string;
  cMainRef?: string;
  cRefType?: string;
  cSiteOwnerName?: string;
  nAmount: number;
  cAcctNo: string;
  cTitle: string;
  dCreateDate: string;
  cLocation: string;
  cReportGroup: string;
  cGroupName: string;
  realizedExpense?: number | string | null;
};

export type SavedExpense = {
  id: number;
  invoice_id: string;
  amount: number | null;
  user_id: number | null;
  date_created?: string | null;
  user?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  };
};

export type SavedExpenseMap = Record<string, SavedExpense>;

export type ExpenseRow = Expense & {
  rowKey: string;
};

export async function fetchSavedExpenses(transactionIds: string[]) {
  if (!transactionIds.length) return {};

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses/savedExpenses`, {
    method: 'POST',
    body: JSON.stringify({
      transaction_ids: transactionIds,
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || json?.error || 'Failed to fetch saved expense');
  }

  return json.data as SavedExpenseMap;
}

export async function fetchExpenses(from: string, to: string) {
  const res = await apiFetch(`https://api.unmg.com.ph/jv/expenses?from=${from}&to=${to}`);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch expenses');
  }

  const erpRows = json.data as Expense[];

  const transactionIds = Array.from(new Set(erpRows.map((row) => row.cTranNo.trim()).filter(Boolean)));

  const savedExpenseMap = await fetchSavedExpenses(transactionIds);

  return erpRows.map((row, index) => ({
    ...row,
    rowKey: `${row.cTranNo.trim()}-${row.cleaseContractID?.trim() || ''}-${index}`,
    realizedExpense: savedExpenseMap[row.cTranNo.trim()]?.amount ?? '',
  })) as ExpenseRow[];
}

export async function saveRealizedExpenses(rows: ExpenseRow[], moaSharedId?: number | null) {
  const payloadRows = rows
    .filter((row) => row.realizedExpense !== '' && row.realizedExpense !== null && row.realizedExpense !== undefined)
    .map(({ realizedExpense, rowKey, ...row }) => {
      void rowKey;

      return {
        ...row,
        moa_shared_id: moaSharedId ?? null,
        realized_expense: Number(realizedExpense),
      };
    });

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses/realizedExpenses`, {
    method: 'POST',
    body: JSON.stringify({ rows: payloadRows }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || json?.error || 'Failed to save realized expense');
  }

  return json;
}
