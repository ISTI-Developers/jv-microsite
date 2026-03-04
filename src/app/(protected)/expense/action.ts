export type Expense = {
  cCompanyID: string;
  cModule: string;
  cCategory: string;
  cTranNo: string;
  dDate: string;
  cCode: string;
  cName: string;
  cStructureID: string;
  cleaseContractID: string;
  nAmount: number;
  cAcctNo: string;
  cTitle: string;
  dCreateDate: string;
  cLocation: string;
  cReportGroup: string;
  cGroupName: string;
};

export async function fetchExpenses(from: string, to: string) {
  const res = await fetch(`https://api.unmg.com.ph/jv/expenses?from=${from}&to=${to}`);

  if (!res.ok) {
    throw new Error('Failed to fetch expenses');
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error('API returned error');
  }

  return json.data as Expense[];
}
