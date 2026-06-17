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

type ExpenseSourceHashRow = Pick<Expense, 'cCompanyID' | 'cTranNo' | 'cAcctNo' | 'cTitle' | 'cLocation' | 'cGroupName' | 'nAmount' | 'dCreateDate'>;

export type SavedExpense = {
  id: number;
  source_hash?: string | null;
  transaction_no: string;
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
  sourceHash: string;
};

function sourceStringValue(row: Partial<ExpenseSourceHashRow>, key: keyof ExpenseSourceHashRow) {
  const value = row[key];

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function sourceAmountValue(row: Partial<ExpenseSourceHashRow>, key: keyof ExpenseSourceHashRow) {
  const value = sourceStringValue(row, key);

  if (value === '') {
    return '';
  }

  const normalized = value.replaceAll(',', '');
  const numericValue = Number(normalized);

  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function sourceDateValue(row: Partial<ExpenseSourceHashRow>, key: keyof ExpenseSourceHashRow) {
  const value = sourceStringValue(row, key);

  if (value === '') {
    return '';
  }

  const localDateTime = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (localDateTime) {
    return `${localDateTime[1]}-${localDateTime[2]}-${localDateTime[3]} ${localDateTime[4] ?? '00'}:${localDateTime[5] ?? '00'}:${localDateTime[6] ?? '00'}`;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const date = new Date(timestamp);
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getExpenseSourceRow(row: Expense): ExpenseSourceHashRow {
  return {
    cCompanyID: row.cCompanyID,
    cTranNo: row.cTranNo,
    cAcctNo: row.cAcctNo,
    cTitle: row.cTitle,
    cLocation: row.cLocation,
    cGroupName: row.cGroupName,
    nAmount: row.nAmount,
    dCreateDate: row.dCreateDate,
  };
}

export async function getExpenseSourceHash(row: ExpenseSourceHashRow) {
  const basis = {
    cCompanyID: sourceStringValue(row, 'cCompanyID'),
    cTranNo: sourceStringValue(row, 'cTranNo'),
    cAcctNo: sourceStringValue(row, 'cAcctNo'),
    cTitle: sourceStringValue(row, 'cTitle'),
    cLocation: sourceStringValue(row, 'cLocation'),
    cGroupName: sourceStringValue(row, 'cGroupName'),
    nAmount: sourceAmountValue(row, 'nAmount'),
    dCreateDate: sourceDateValue(row, 'dCreateDate'),
  };

  const bytes = new TextEncoder().encode(JSON.stringify(basis));
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function fetchSavedExpenses(rows: Expense[]) {
  if (!rows.length) return {};

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/expenses/savedExpenses`, {
    method: 'POST',
    body: JSON.stringify({
      rows: rows.map(getExpenseSourceRow),
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

  const savedExpenseMap = await fetchSavedExpenses(erpRows);
  const savedExpenseMapUsesSourceHash = Object.values(savedExpenseMap).some((savedExpense) => !!savedExpense.source_hash);
  const rowsWithHashes = await Promise.all(
    erpRows.map(async (row) => {
      const sourceHash = await getExpenseSourceHash(getExpenseSourceRow(row));
      const savedExpense = savedExpenseMap[sourceHash] ?? (!savedExpenseMapUsesSourceHash ? savedExpenseMap[row.cTranNo.trim()] : undefined);

      return {
        ...row,
        sourceHash,
        rowKey: sourceHash,
        realizedExpense: savedExpense?.amount ?? '',
      };
    })
  );

  return rowsWithHashes as ExpenseRow[];
}

export async function saveRealizedExpenses(rows: ExpenseRow[], moaSharedId?: number | null) {
  const payloadRows = rows
    .filter((row) => row.realizedExpense !== '' && row.realizedExpense !== null && row.realizedExpense !== undefined)
    .map(({ realizedExpense, rowKey, sourceHash, ...row }) => {
      void rowKey;
      const sourceRow = { ...row } as Record<string, unknown>;

      delete sourceRow.remarks;

      return {
        ...sourceRow,
        source_hash: sourceHash,
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
