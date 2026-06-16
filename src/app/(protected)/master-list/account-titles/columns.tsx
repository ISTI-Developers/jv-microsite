import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Column } from '../../components/DataTable';
import { AccountTitle, AccountTitleColumnsProps } from './types';

function isAccountEnabled(item: AccountTitle) {
  return Number(item.is_enabled) === 1;
}

export function createAccountTitleColumns({
  currentEnabledByAccountNo,
  setAccountEnabled,
  isSaving,
}: AccountTitleColumnsProps): Column<AccountTitle>[] {
  return [
    {
      header: 'Enabled',
      align: 'center',
      sortable: true,
      sortValue: (row) => (currentEnabledByAccountNo[row.account_no] ? 1 : 0),
      render: (row) => (
        <Checkbox
          checked={currentEnabledByAccountNo[row.account_no]}
          disabled={isSaving}
          aria-label={`Enable ${row.account_title}`}
          onCheckedChange={(value) => setAccountEnabled(row.account_no, value === true)}
        />
      ),
    },
    {
      header: 'Account No.',
      sortable: true,
      sortValue: (row) => row.account_no,
      render: (row) => <span className="font-mono text-xs">{row.account_no}</span>,
    },
    {
      header: 'Account Title',
      sortable: true,
      sortValue: (row) => row.account_title,
      render: (row) => <span className="block min-w-[220px] whitespace-normal font-medium">{row.account_title}</span>,
    },
    {
      header: 'Status',
      sortable: true,
      sortValue: (row) => {
        const checked = currentEnabledByAccountNo[row.account_no];
        const changed = checked !== isAccountEnabled(row);

        if (changed) return 'Changed';
        if (!row.saved) return 'New';
        return checked ? 'Saved' : 'Disabled';
      },
      render: (row) => {
        const checked = currentEnabledByAccountNo[row.account_no];
        const changed = checked !== isAccountEnabled(row);

        if (changed) {
          return <Badge variant="secondary">Changed</Badge>;
        }

        if (!row.saved) {
          return <Badge variant="outline">New</Badge>;
        }

        return <Badge variant={checked ? 'default' : 'outline'}>{checked ? 'Saved' : 'Disabled'}</Badge>;
      },
    },
  ];
}
