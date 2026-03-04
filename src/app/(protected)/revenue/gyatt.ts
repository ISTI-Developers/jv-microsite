import dayjs from 'dayjs';
import { Column } from '../components/DataTable';
import { Expense } from './action';

export const columns: Column<Expense>[] = [
  { header: 'Company', render: (row) => row.cCompanyID },
  { header: 'Module', render: (row) => row.cModule },
  { header: 'Category', render: (row) => row.cCategory },
  { header: 'Tran No', render: (row) => row.cTranNo.trim() },
  {
    header: 'Date',
    render: (row) => dayjs(row.dDate).format('MMM DD, YYYY'),
  },
  { header: 'Code', render: (row) => row.cCode },
  { header: 'Name', render: (row) => row.cName },
  { header: 'Structure', render: (row) => row.cStructureID },
  { header: 'Lease ID', render: (row) => row.cleaseContractID },
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
