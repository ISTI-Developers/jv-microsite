export type Revenue = {
  cCompanyID: string;
  cModule: string;
  cCategory: string;
  cRevenueType: string;
  cTranNo: string;
  dDate: string;
  cClientcode: string;
  cClientName: string;
  cSalesmanCode: string;
  cSalesmanName: string;
  cOwnerID: string;
  cSiteOwnerName: string;
  cContractID: string;
  cJobNo: string;
  dDueDate: string;
  dDueDateTo: string;
  cSiteID: string;
  cStuctureID: string;
  cStructureAddress: string;
  cAcctNo: string;
  cTitle: string;
  nAmount: number;
  dCreateDate: string;
  cLocation: string;
  cReportGroup: string;
  cGroupName: string;
};

export async function fetchRevenues(from: string, to: string) {
  const res = await fetch(`https://api.unmg.com.ph/jv/revenue?from=${from}&to=${to}`);

  if (!res.ok) {
    throw new Error('Failed to fetch revenue');
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error('API returned error');
  }

  return json.data as Revenue[];
}
