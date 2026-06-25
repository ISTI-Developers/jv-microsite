'use client';

import { useQuery } from '@tanstack/react-query';
import { ListOrdered } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import GroupTabsFilter from '../components/GroupTabsFilter';
import { fetchRevenueList } from './actions';
import { columns } from './revenue-list.columns';
import PageHeader from '../components/PageHeader';

export default function RevenueListPage() {
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const {
    data = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['revenue-list'],
    queryFn: fetchRevenueList,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const groupedRows = useMemo(() => {
    return data.reduce<Record<string, typeof data>>((acc, row) => {
      const groupName = row.group_name?.trim() || 'Ungrouped';

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push(row);

      return acc;
    }, {});
  }, [data]);

  const groupTabs = useMemo(() => Object.keys(groupedRows).sort((a, b) => a.localeCompare(b)), [groupedRows]);

  const filteredGroupTabs = useMemo(() => {
    const search = groupSearch.trim().toLowerCase();

    if (!search) {
      return groupTabs;
    }

    return groupTabs.filter((groupName) => groupName.toLowerCase().includes(search));
  }, [groupSearch, groupTabs]);

  const displayedRows = useMemo(() => {
    if (!selectedGroupName) {
      return data;
    }

    return groupedRows[selectedGroupName] || [];
  }, [data, groupedRows, selectedGroupName]);

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue List" subtitle="Saved collection and revenue inputs" icon={ListOrdered} className="mb-6" />

      {isError && <p className="mb-4 text-sm text-red-600">Failed to load revenue list.</p>}

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <GroupTabsFilter
          items={filteredGroupTabs.map((groupName) => ({
            value: groupName,
            count: groupedRows[groupName]?.length ?? 0,
          }))}
          selectedValue={selectedGroupName}
          onSelectedValueChange={setSelectedGroupName}
          searchValue={groupSearch}
          onSearchValueChange={setGroupSearch}
          totalCount={data.length}
          displayedCount={displayedRows.length}
          label="group"
          selectedLabel="Selected group"
          searchPlaceholder="Search group name..."
          noResultsMessage="No matching group names found."
        />
      </div>

      <DataTable rows={displayedRows} columns={columns} getRowKey={(row) => row.id} loading={isFetching} pagination paginationMode="frontend" />
    </div>
  );
}
