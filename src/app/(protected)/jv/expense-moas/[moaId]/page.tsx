'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Category, ExpenseItem, MoaData } from '../../../../types/moa';
import { ExpensePayload } from './moaId.types';
import { Button } from '@/components/ui/button';
import { AlertCircle, Layers, LoaderCircle, MapPin, ReceiptText, WalletCards } from 'lucide-react';
import JVComboSelect from '@/app/(protected)/components/jvComboSelect';
import { toast } from 'sonner';
import GTabs from '@/app/(protected)/components/GTabs';
import ExpenseTable from './ExpenseTable';
import PageHeader from '../../../components/PageHeader';

type EditableExpenseItem = ExpenseItem & {
  _tempId?: string;
};

type ApiMasterAccountTitle = {
  id: number;
  account_no: string;
  account_title: string;
};

type EditableExpensesMap = Record<number, Record<string, EditableExpenseItem[]>>;
type SelectedAccountsByLoc = Record<number, number[]>;

export default function JVExpenseMoaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const moaId = params.moaId as string;

  const [tabIndex, setTabIndex] = useState(0);
  const [expenses, setExpenses] = useState<EditableExpensesMap>({});
  const [selectedAccountsByLoc, setSelectedAccountsByLoc] = useState<SelectedAccountsByLoc>({});
  const tempIdRef = useRef(0);

  const makeTempId = useCallback(() => {
    tempIdRef.current += 1;
    return `tmp-${tempIdRef.current}`;
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery<MoaData>({
    queryKey: ['jv-moa', moaId],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa/show?id=${moaId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed');
      }

      return json.data;
    },
    enabled: !!moaId,
  });

  const {
    data: categories = [],
    isFetching: categoriesFetching,
    isError: categoriesIsError,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/master-list/account-titles`);
      const json: { success?: boolean; data?: ApiMasterAccountTitle[]; error?: string; message?: string } = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.error || json.message || 'Failed');
      }

      return (json.data ?? []).map((c) => ({
        id: Number(c.account_no),
        name: c.account_title,
      }));
    },
  });

  const initialExpenses = useMemo<EditableExpensesMap>(() => {
    if (!data?.expenses) return {};

    const mapped: EditableExpensesMap = {};

    Object.entries(data.expenses).forEach(([locId, accounts]) => {
      mapped[Number(locId)] = {};

      Object.entries(accounts).forEach(([accountNo, items]) => {
        mapped[Number(locId)][String(accountNo)] = items.map((item) => ({
          ...item,
          account_no: item.account_no ?? accountNo,
          particulars: item.particulars ?? '',
          due_date_from: item.due_date_from ?? null,
          due_date_to: item.due_date_to ?? null,
          _tempId: item.id ? `db-${item.id}` : undefined,
        }));
      });
    });

    return mapped;
  }, [data]);

  const initialSelectedAccountsByLoc = useMemo<SelectedAccountsByLoc>(() => {
    const mapped: SelectedAccountsByLoc = {};

    Object.entries(initialExpenses).forEach(([locId, accounts]) => {
      mapped[Number(locId)] = Object.keys(accounts).map(Number);
    });

    return mapped;
  }, [initialExpenses]);

  const currentExpenses = Object.keys(expenses).length > 0 || !data?.expenses ? expenses : initialExpenses;

  const currentSelectedAccountsByLoc =
    Object.keys(selectedAccountsByLoc).length > 0 || !data?.expenses ? selectedAccountsByLoc : initialSelectedAccountsByLoc;

  const visibleLocations = useMemo(() => {
    if (!data?.locations) return [];
    if (!data.allowed_locations || data.allowed_locations.length === 0) {
      return data.locations;
    }

    return data.locations.filter((loc) => data.allowed_locations?.includes(loc.id));
  }, [data]);

  const updateCell = (locId: number, catId: string | number, index: number, field: keyof ExpenseItem, value: string) => {
    const accountKey = String(catId);

    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = [...(source[locId]?.[accountKey] || [])];

      const nextRow: EditableExpenseItem = {
        ...rows[index],
        [field]: field === 'amount' ? Number(value || 0) : value,
      };

      if (field === 'due_date_from' && nextRow.due_date_to && value && nextRow.due_date_to < value) {
        nextRow.due_date_to = value;
      }

      rows[index] = nextRow;

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [accountKey]: rows,
        },
      };
    });
  };

  const addRow = (locId: number, catId: string | number) => {
    const accountKey = String(catId);

    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = source[locId]?.[accountKey] || [];

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [accountKey]: [
            ...rows,
            {
              _tempId: makeTempId(),
              account_no: accountKey,
              particulars: '',
              amount: 0,
              due_date_from: null,
              due_date_to: null,
              ref_no: '',
              payee: '',
            },
          ],
        },
      };
    });
  };

  const deleteRow = (locId: number, catId: string | number, index: number) => {
    const accountKey = String(catId);

    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = [...(source[locId]?.[accountKey] || [])];

      rows.splice(index, 1);

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [accountKey]: rows,
        },
      };
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: ExpensePayload[] = [];

      Object.entries(currentExpenses).forEach(([locId, accounts]) => {
        Object.entries(accounts).forEach(([accountNo, items]) => {
          items.forEach((item) => {
            payload.push({
              id: item.id ?? null,
              location_id: Number(locId),
              account_no: item.account_no ?? accountNo,
              particulars: item.particulars ?? '',
              amount: Number(item.amount || 0),
              due_date_from: item.due_date_from ?? null,
              due_date_to: item.due_date_to ?? null,
              ref_no: item.ref_no,
              payee: item.payee,
            });
          });
        });
      });

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/expenses/sync`, {
        method: 'POST',
        body: JSON.stringify({
          moa_id: Number(moaId),
          expenses: payload,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed');
      }

      return json;
    },
    onSuccess: async () => {
      toast.success('Saved successfully');
      setExpenses({});
      setSelectedAccountsByLoc({});
      await refetch();
    },
    onError: (err) => {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    },
  });

  const activeLocation = visibleLocations[tabIndex] ?? null;
  const selectedIds = activeLocation ? currentSelectedAccountsByLoc[activeLocation.id] || [] : [];
  const selectedCats = categories.filter((c) => selectedIds.includes(c.id));
  const selectedRows = activeLocation ? selectedCats.flatMap((cat) => currentExpenses[activeLocation.id]?.[String(cat.id)] || []) : [];

  const currentTotalAmount = selectedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="JV Expense Detail"
          subtitle="Loading MOA expense details"
          icon={ReceiptText}
          actions={
            <Button variant="outline" onClick={() => router.push('/jv/expense-moas')}>
              Back
            </Button>
          }
        />

        <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <LoaderCircle className="size-5 animate-spin" />
            Loading MOA details...
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="JV Expense Detail"
          subtitle="Unable to load MOA expense details"
          icon={ReceiptText}
          actions={
            <Button variant="outline" onClick={() => router.push('/jv/expense-moas')}>
              Back
            </Button>
          }
        />

        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Failed to load MOA details.</p>
              <p className="mt-1">{error instanceof Error ? error.message : 'Please try again later.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.moa.moa_name}
        subtitle="JV Expense Detail"
        icon={ReceiptText}
        actions={
          <Button variant="outline" onClick={() => router.push('/jv/expense-moas')}>
            Back
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">MOA</p>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">{data.moa.moa_name}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">Active Location</p>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">{activeLocation?.location_name || 'No location selected'}</p>
          {activeLocation?.report_group ? <p className="mt-1 truncate text-xs text-muted-foreground">{activeLocation.report_group}</p> : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">Locations</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{visibleLocations.length} available</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">Selected Accounts</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{selectedCats.length} accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total:{' '}
            {currentTotalAmount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {visibleLocations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
          <MapPin className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold text-foreground">No assigned locations</h2>
          <p className="mt-1 text-sm text-muted-foreground">There are no locations available for this MOA.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">Locations and accounts</h2>
              <p className="text-sm text-muted-foreground">Choose a location, then select the expense accounts to edit.</p>
            </div>

            <GTabs
              value={activeLocation ? String(activeLocation.id) : ''}
              onChange={(val) => {
                const index = visibleLocations.findIndex((l) => String(l.id) === val);
                setTabIndex(index >= 0 ? index : 0);
              }}
              items={visibleLocations.map((loc) => ({
                value: String(loc.id),
                label: loc.location_name,
              }))}
            />

            {activeLocation && (
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                      <MapPin className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{activeLocation.location_name}</h3>
                      {activeLocation.report_group ? (
                        <p className="text-sm text-muted-foreground">{activeLocation.report_group}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No report group assigned</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                    {selectedCats.length} selected {selectedCats.length === 1 ? 'account' : 'accounts'}
                  </div>
                </div>

                <JVComboSelect
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={selectedIds}
                  onChange={(vals) =>
                    setSelectedAccountsByLoc((prev) => ({
                      ...prev,
                      [activeLocation.id]: vals,
                    }))
                  }
                  placeholder="Select Account"
                />

                {categoriesFetching && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading enabled account titles...
                  </p>
                )}

                {categoriesIsError && (
                  <p className="mt-3 text-sm text-red-600">
                    {categoriesError instanceof Error
                      ? categoriesError.message
                      : 'Failed to load enabled account titles. Please refresh and try again.'}
                  </p>
                )}

                {!categoriesFetching && !categoriesIsError && categories.length === 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">No enabled account titles are available.</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {activeLocation && selectedCats.length > 0 ? (
              selectedCats.map((cat) => {
                const accountKey = String(cat.id);
                const rows = currentExpenses[activeLocation.id]?.[accountKey] || [];

                return (
                  <ExpenseTable
                    key={accountKey}
                    locId={activeLocation.id}
                    catId={accountKey}
                    catName={cat.name}
                    rows={rows}
                    addRow={addRow}
                    deleteRow={deleteRow}
                    updateCell={updateCell}
                  />
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
                <Layers className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-3 text-base font-semibold text-foreground">Select an account first</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose one or more expense accounts to start entering rows for this location.</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-4 z-10 rounded-3xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                  <WalletCards className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Ready to save expense entries</p>
                  <p className="text-muted-foreground">
                    {selectedRows.length} {selectedRows.length === 1 ? 'row' : 'rows'} selected across {selectedCats.length}{' '}
                    {selectedCats.length === 1 ? 'account' : 'accounts'}.
                  </p>
                </div>
              </div>

              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !activeLocation} className="h-10 rounded-xl px-6">
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="size-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
