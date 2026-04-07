import dayjs from 'dayjs';
import { Column } from '../components/DataTable';
import { Revenue } from './action';

export const columns: Column<Revenue>[] = [
  { header: 'Company', render: (row) => row.cCompanyID.trim() },
  { header: 'Module', render: (row) => row.cModule },
  { header: 'Category', render: (row) => row.cCategory },
  { header: 'Revenue Type', render: (row) => row.cRevenueType },

  { header: 'Tran No', render: (row) => row.cTranNo.trim() },

  {
    header: 'Date',
    render: (row) => dayjs(row.dDate).format('MMM DD, YYYY'),
  },

  { header: 'Client Code', render: (row) => row.cClientcode },
  { header: 'Client Name', render: (row) => row.cClientName.trim() },

  { header: 'Salesman Code', render: (row) => row.cSalesmanCode },
  { header: 'Salesman Name', render: (row) => row.cSalesmanName },

  { header: 'Contract ID', render: (row) => row.cContractID },
  { header: 'Job No', render: (row) => row.cJobNo },

  {
    header: 'Due From',
    render: (row) => dayjs(row.dDueDate).format('MMM DD, YYYY'),
  },

  {
    header: 'Due To',
    render: (row) => dayjs(row.dDueDateTo).format('MMM DD, YYYY'),
  },

  { header: 'Site ID', render: (row) => row.cSiteID },
  { header: 'Structure ID', render: (row) => row.cStuctureID },
  { header: 'Structure Address', render: (row) => row.cStructureAddress },

  {
    header: 'Amount',
    align: 'right',
    render: (row) =>
      Number(row.nAmount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },

  { header: 'Acct No', render: (row) => row.cAcctNo.trim() },
  { header: 'Title', render: (row) => row.cTitle },

  {
    header: 'Created',
    render: (row) => dayjs(row.dCreateDate).format('MMM DD, YYYY HH:mm'),
  },

  { header: 'Location', render: (row) => row.cLocation },
  { header: 'Report Group', render: (row) => row.cReportGroup },
  { header: 'Group Name', render: (row) => row.cGroupName },
];
