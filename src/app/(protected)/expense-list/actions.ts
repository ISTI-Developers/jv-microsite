import { apiFetch } from '@/lib/api';

type ExternalExpenseRow = {
  cCompanyID: string;
  cModule?: string;
  cCategory?: string;
  cTranNo: string;
  dDate?: string;
  cCode?: string;
  cName?: string;
  dDueDateFrom?: string;
  dDueDateTo?: string;
  cStructureID?: string;
  cDepartment?: string;
  cEmpID?: string;
  cEmpName?: string;
  cleaseContractID?: string;
  cMainRef?: string;
  cJobNumber?: string;
  cRefType?: string;
  cSiteOwnerName?: string;
  nAmount: number;
  cAcctNo: string;
  cTitle: string;
  dCreateDate: string;
  cLocation: string;
  cReportGroup?: string;
  cGroupName: string;
};

type ExpenseSourceHashRow = Pick<
  ExternalExpenseRow,
  'cCompanyID' | 'cTranNo' | 'cAcctNo' | 'cTitle' | 'cLocation' | 'cGroupName' | 'nAmount' | 'dCreateDate'
>;

export type ExpenseListRow = {
  id: number;
  external_key: string;
  source_type: 'JV' | 'UNAI' | 'API' | string;
  source_id: number | string;
  moa_shared_id: number | null;
  account_no: string | null;
  user_id: number;
  ref_no: string | null;
  job_number: string | null;
  due_date: string | null;
  due_date_from: string | null;
  due_date_to: string | null;
  structure_id: string | null;
  payee: string | null;
  particulars: string | null;
  jv_amount: string | number | null;
  un_amount: string | number | null;
  group_name: string | null;
  source_hash: string | null;
  is_realized?: boolean;
  display_status?: 'Realized' | 'API' | 'JV';
  original_amount?: string | number | null;
  realized_amount?: string | number | null;
  display_amount?: string | number | null;
  matched_external_key?: string | null;
  matched_source_id?: number | string | null;
};

export type ExpenseListResponse = {
  success: boolean;
  data: ExpenseListRow[];
  message?: string;
};

export type ExpenseListSearchResult = {
  rows: ExpenseListRow[];
  warning?: string;
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

function getExpenseSourceRow(row: ExternalExpenseRow): ExpenseSourceHashRow {
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

async function getExpenseSourceHash(row: ExpenseSourceHashRow) {
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

function normalizeDateOnly(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return null;

  const date = new Date(timestamp);
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isDateInRange(value: string | null | undefined, from: string, to: string) {
  const date = normalizeDateOnly(value);
  return Boolean(date && date >= from && date <= to);
}

function mapExternalExpenseRow(row: ExternalExpenseRow, sourceHash: string): ExpenseListRow {
  const dueDateFrom = normalizeDateOnly(row.dDueDateFrom);
  const dueDateTo = normalizeDateOnly(row.dDueDateTo);
  const dueDate = dueDateFrom ?? dueDateTo ?? normalizeDateOnly(row.dDate);

  return {
    id: 0,
    external_key: `API-${sourceHash}`,
    source_type: 'API',
    source_id: row.cTranNo?.trim() || sourceHash,
    moa_shared_id: null,
    account_no: row.cAcctNo?.trim() || null,
    user_id: 0,
    ref_no: row.cTranNo?.trim() || null,
    job_number: row.cJobNumber?.trim() || row.cMainRef?.trim() || '',
    due_date: dueDate,
    due_date_from: dueDateFrom,
    due_date_to: dueDateTo,
    structure_id: row.cStructureID?.trim() || row.cLocation?.trim() || null,
    payee: row.cName?.trim() || '',
    particulars: row.cTitle?.trim() || '',
    jv_amount: 0,
    un_amount: row.nAmount ?? 0,
    group_name: row.cGroupName?.trim() || 'Ungrouped',
    source_hash: sourceHash,
    is_realized: false,
    display_status: 'API',
    original_amount: row.nAmount ?? 0,
    realized_amount: null,
    display_amount: row.nAmount ?? 0,
  };
}

async function fetchExternalExpenseRows(from: string, to: string) {
  const res = await apiFetch(`https://api.unmg.com.ph/jv/expenses?from=${from}&to=${to}`);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || 'Failed to fetch expenses from external API');
  }

  return (json.data ?? []) as ExternalExpenseRow[];
}

async function fetchInternalExpenseRows() {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/list/expense-list`);
  const json: ExpenseListResponse = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch saved expense list');
  }

  return json.data;
}

function markRealizedRow(row: ExpenseListRow): ExpenseListRow {
  return {
    ...row,
    source_type: row.source_type || 'UNAI',
    source_hash: row.source_hash,
    is_realized: true,
    display_status: 'Realized',
  };
}

function markJvRow(row: ExpenseListRow): ExpenseListRow {
  return {
    ...row,
    is_realized: false,
    display_status: 'JV',
    display_amount: row.display_amount ?? row.jv_amount,
  };
}

export async function fetchExpenseList(from: string, to: string): Promise<ExpenseListSearchResult> {
  const externalRows = await fetchExternalExpenseRows(from, to);

  let internalRows: ExpenseListRow[] = [];
  let warning: string | undefined;

  try {
    internalRows = await fetchInternalExpenseRows();
  } catch (err) {
    warning = err instanceof Error ? err.message : 'Saved expense list could not be loaded.';
  }

  const realizedRowsBySourceHash = new Map(
    internalRows
      .filter((row) => row.source_type?.toUpperCase() === 'UNAI' && row.source_hash)
      .map((row) => [String(row.source_hash), markRealizedRow(row)])
  );

  const mergedExternalRows = await Promise.all(
    externalRows.map(async (row) => {
      const sourceHash = await getExpenseSourceHash(getExpenseSourceRow(row));
      const apiRow = mapExternalExpenseRow(row, sourceHash);
      const matchedDbRow = realizedRowsBySourceHash.get(sourceHash);

      if (matchedDbRow) {
        return {
          ...apiRow,
          is_realized: true,
          display_status: 'Realized' as const,
          original_amount: apiRow.un_amount,
          realized_amount: matchedDbRow.un_amount,
          display_amount: matchedDbRow.un_amount,
          matched_external_key: matchedDbRow.external_key,
          matched_source_id: matchedDbRow.source_id,
        };
      }

      return {
        ...apiRow,
        is_realized: false,
        display_status: 'API' as const,
        original_amount: apiRow.un_amount,
        realized_amount: null,
        display_amount: apiRow.un_amount,
      };
    })
  );

  const jvRowsInRange = internalRows
    .filter((row) => row.source_type?.toUpperCase() === 'JV' && isDateInRange(row.due_date ?? row.due_date_from, from, to))
    .map(markJvRow);

  return {
    rows: [...mergedExternalRows, ...jvRowsInRange],
    warning,
  };
}
