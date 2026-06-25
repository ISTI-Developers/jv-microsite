'use client';

import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, Layers, LoaderCircle, MapPin, ReceiptText, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { Category, ExpenseItem } from '@/app/types/moa';
import { Button } from '@/components/ui/button';
import CheckboxMultiSelect from '@/app/(protected)/components/CheckboxMultiSelect';
import DataTable from '@/app/(protected)/components/DataTable';
import GTabs from '@/app/(protected)/components/GTabs';
import PageHeader from '../components/PageHeader';
import ExpenseTable from './ExpenseTable';
import { fetchAdminAccountTitles, fetchAdminMoaDetail, fetchAdminMoaList, syncUnaiManualExpenses } from './action';
import { moaColumns } from './moa.columns';
import { EditableExpenseItem, EditableExpensesMap, ExpenseRowValidationErrors, SelectedAccountsByLoc, UnaiManualExpensePayload } from './types';

type RowPointer = {
  locId: number;
  accountKey: string;
  row: EditableExpenseItem;
};

const getRowKey = (row: EditableExpenseItem) => row._tempId ?? `db-${row.id}`;

const isNonEmpty = (value: unknown) => String(value ?? '').trim().length > 0;

const isBlank = (value: unknown) => value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0);

const isExpenseRowEmpty = (row: EditableExpenseItem) => {
  return isBlank(row.due_date) && isBlank(row.ref_no) && isBlank(row.payee) && isBlank(row.particulars) && isBlank(row.amount);
};

const normalizeAmountForCompare = (value: EditableExpenseItem['amount']) => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : rawValue;
};

const normalizeRowForCompare = (row: EditableExpenseItem, locId: number, accountKey: string) => {
  return JSON.stringify({
    moa_shared_id: row.moa_shared_id ?? null,
    location_id: row.location_id ?? locId,
    account_no: String(row.account_no ?? accountKey),
    due_date: row.due_date ?? null,
    due_date_from: row.due_date_from ?? null,
    due_date_to: row.due_date_to ?? null,
    ref_no: String(row.ref_no ?? '').trim(),
    payee: String(row.payee ?? '').trim(),
    particulars: String(row.particulars ?? '').trim(),
    amount: normalizeAmountForCompare(row.amount),
  });
};

const getAmountError = (value: EditableExpenseItem['amount']) => {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) return 'Amount is required.';

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return 'Amount must be a valid number.';
  if (numericValue <= 0) return 'Amount must be greater than 0.';

  return null;
};

const validateExpenseRow = (row: EditableExpenseItem): ExpenseRowValidationErrors => {
  if (!row.id && isExpenseRowEmpty(row)) {
    return {};
  }

  const errors: ExpenseRowValidationErrors = {};

  if (!isNonEmpty(row.due_date)) {
    errors.due_date = 'Date is required.';
  }

  if (!isNonEmpty(row.ref_no) || row._voucherValid !== true) {
    errors.ref_no = 'Please select a valid voucher no. from the list.';
  }

  if (!isNonEmpty(row.payee)) {
    errors.payee = 'Payee is required.';
  }

  if (!isNonEmpty(row.particulars)) {
    errors.particulars = 'Particulars is required.';
  }

  const amountError = getAmountError(row.amount);
  if (amountError) {
    errors.amount = amountError;
  }

  return errors;
};

const flattenExpenseRows = (expenses: EditableExpensesMap): RowPointer[] => {
  return Object.entries(expenses).flatMap(([locId, accounts]) =>
    Object.entries(accounts).flatMap(([accountKey, rows]) =>
      rows.map((row) => ({
        locId: Number(locId),
        accountKey,
        row,
      }))
    )
  );
};

const toUpsertPayload = ({ locId, accountKey, row }: RowPointer): UnaiManualExpensePayload => {
  const payload: UnaiManualExpensePayload = {
    location_id: row.location_id ?? locId,
    account_no: row.account_no ?? accountKey,
    particulars: String(row.particulars ?? '').trim(),
    amount: Number(row.amount || 0),
    due_date: row.due_date ?? null,
    due_date_from: row.due_date_from ?? null,
    due_date_to: row.due_date_to ?? null,
    ref_no: String(row.ref_no ?? '').trim(),
    payee: String(row.payee ?? '').trim(),
  };

  if (row.id) {
    payload.id = row.id;
  }

  if (row.moa_shared_id) {
    payload.moa_shared_id = row.moa_shared_id;
  }

  return payload;
};

function UnaiManualExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moaId = searchParams.get('moa_id')?.trim() || '';

  const [tabIndex, setTabIndex] = useState(0);
  const [expenses, setExpenses] = useState<EditableExpensesMap>({});
  const [selectedAccountsByLoc, setSelectedAccountsByLoc] = useState<SelectedAccountsByLoc>({});
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const tempIdRef = useRef(0);

  const makeTempId = useCallback(() => {
    tempIdRef.current += 1;
    return `tmp-${tempIdRef.current}`;
  }, []);

  const moaListQuery = useQuery({
    queryKey: ['admin-moa-list-for-unai-manual'],
    queryFn: fetchAdminMoaList,
    enabled: !moaId,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['admin-unai-manual-moa-detail', moaId],
    queryFn: () => fetchAdminMoaDetail(moaId),
    enabled: !!moaId,
  });

  const {
    data: categories = [],
    isFetching: categoriesFetching,
    isError: categoriesIsError,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ['admin-manual-expense-account-titles'],
    queryFn: fetchAdminAccountTitles,
    enabled: !!moaId,
  });

  const initialExpenses = useMemo<EditableExpensesMap>(() => {
    if (!data?.unai_manual_expenses) return {};

    const mapped: EditableExpensesMap = {};

    Object.entries(data.unai_manual_expenses).forEach(([locId, accounts]) => {
      mapped[Number(locId)] = {};

      Object.entries(accounts).forEach(([accountNo, items]) => {
        mapped[Number(locId)][String(accountNo)] = items.map((item) => ({
          ...item,
          account_no: item.account_no ?? accountNo,
          particulars: item.particulars ?? '',
          due_date: item.due_date ?? null,
          _voucherValid: isNonEmpty(item.ref_no),
          _tempId: item.id ? `db-${item.id}` : undefined,
        }));
      });
    });

    return mapped;
  }, [data]);

  const baselineById = useMemo(() => {
    return flattenExpenseRows(initialExpenses).reduce<Record<number, string>>((acc, pointer) => {
      if (pointer.row.id) {
        acc[pointer.row.id] = normalizeRowForCompare(pointer.row, pointer.locId, pointer.accountKey);
      }

      return acc;
    }, {});
  }, [initialExpenses]);

  const initialSelectedAccountsByLoc = useMemo<SelectedAccountsByLoc>(() => {
    const mapped: SelectedAccountsByLoc = {};

    Object.entries(initialExpenses).forEach(([locId, accounts]) => {
      mapped[Number(locId)] = Object.keys(accounts).map(Number);
    });

    return mapped;
  }, [initialExpenses]);

  const currentExpenses = Object.keys(expenses).length > 0 || !data?.unai_manual_expenses ? expenses : initialExpenses;

  const currentSelectedAccountsByLoc =
    Object.keys(selectedAccountsByLoc).length > 0 || !data?.unai_manual_expenses ? selectedAccountsByLoc : initialSelectedAccountsByLoc;

  const visibleLocations = useMemo(() => {
    if (!data?.locations) return [];
    if (!data.allowed_locations || data.allowed_locations.length === 0) {
      return data.locations;
    }

    return data.locations.filter((loc) => data.allowed_locations?.includes(loc.id));
  }, [data]);

  const activeLocation = visibleLocations[tabIndex] ?? null;
  const selectedIds = activeLocation ? currentSelectedAccountsByLoc[activeLocation.id] || [] : [];
  const selectedCats = categories.filter((c) => selectedIds.includes(c.id));

  const changedRows = useMemo(() => {
    return flattenExpenseRows(currentExpenses).filter(({ locId, accountKey, row }) => {
      if (!row.id) {
        return !isExpenseRowEmpty(row);
      }

      const baseline = baselineById[row.id];
      return normalizeRowForCompare(row, locId, accountKey) !== baseline;
    });
  }, [baselineById, currentExpenses]);

  const getExpenseValidationErrors = (rows: RowPointer[]) => {
    const errors: Record<string, ExpenseRowValidationErrors> = {};

    rows.forEach(({ row }) => {
      const rowErrors = validateExpenseRow(row);

      if (Object.keys(rowErrors).length > 0) {
        errors[getRowKey(row)] = rowErrors;
      }
    });

    return errors;
  };

  const rowValidationErrors = submitAttempted ? getExpenseValidationErrors(changedRows) : {};

  const updateCell = (locId: number, catId: string | number, index: number, field: keyof ExpenseItem, value: string) => {
    const accountKey = String(catId);

    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = [...(source[locId]?.[accountKey] || [])];

      const nextRow: EditableExpenseItem = {
        ...rows[index],
        [field]: value,
      };

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

  const updateVoucherCell = (locId: number, catId: string | number, index: number, value: string, voucherValid: boolean) => {
    const accountKey = String(catId);

    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = [...(source[locId]?.[accountKey] || [])];

      rows[index] = {
        ...rows[index],
        ref_no: value,
        _voucherValid: voucherValid,
      };

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
              location_id: locId,
              account_no: accountKey,
              particulars: '',
              amount: '',
              due_date: null,
              ref_no: '',
              _voucherValid: false,
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
      const [deletedRow] = rows.splice(index, 1);

      if (deletedRow?.id) {
        setDeletedIds((current) => {
          const next = new Set(current);
          next.add(deletedRow.id as number);
          return next;
        });
      }

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [accountKey]: rows,
        },
      };
    });
  };

  const upserts = useMemo(() => changedRows.map(toUpsertPayload), [changedRows]);
  const deletePayload = useMemo(() => Array.from(deletedIds), [deletedIds]);
  const hasExpenseChanges = upserts.length > 0 || deletePayload.length > 0;
  const showSaveActions = hasExpenseChanges || isFetching;

  const mutation = useMutation({
    mutationFn: () => syncUnaiManualExpenses(moaId, upserts, deletePayload),
    onSuccess: async () => {
      toast.success('UNAI manual expenses saved successfully');
      setExpenses({});
      setSelectedAccountsByLoc({});
      setDeletedIds(new Set());
      setSubmitAttempted(false);
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

  const handleSave = () => {
    setSubmitAttempted(true);

    if (!hasExpenseChanges) return;

    if (Object.keys(getExpenseValidationErrors(changedRows)).length > 0) {
      toast.error('Please complete all required expense row fields.');
      return;
    }

    mutation.mutate();
  };

  const selectedRows = activeLocation ? selectedCats.flatMap((cat) => currentExpenses[activeLocation.id]?.[String(cat.id)] || []) : [];

  const currentTotalAmount = selectedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const changedRowCount = upserts.length;
  const deletedRowCount = deletePayload.length;

  if (!moaId) {
    return (
      <div className="space-y-6">
        <PageHeader title="UNAI Manual Expense" subtitle="Select an MOA to encode Admin/UNAI manual expense entries." icon={ReceiptText} />

        <div className="mt-4">
          {moaListQuery.isLoading ? (
            <DataTable rows={[]} columns={moaColumns} getRowKey={(row) => row.id} loading />
          ) : moaListQuery.isError ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              Open this page with a MOA query parameter, for example <span className="font-medium">/unai-manual-expense?moa_id=123</span>.
            </div>
          ) : moaListQuery.data && moaListQuery.data.length > 0 ? (
            <DataTable
              rows={moaListQuery.data}
              columns={moaColumns}
              getRowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/unai-manual-expense?moa_id=${row.id}`)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              No MOAs found. Open this page with a MOA query parameter, for example{' '}
              <span className="font-medium">/unai-manual-expense?moa_id=123</span>.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="UNAI Manual Expense"
          subtitle="Loading MOA expense details"
          icon={ReceiptText}
          actions={
            <Button variant="outline" onClick={() => router.push('/unai-manual-expense')}>
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
          title="UNAI Manual Expense"
          subtitle="Unable to load MOA expense details"
          icon={ReceiptText}
          actions={
            <Button variant="outline" onClick={() => router.push('/unai-manual-expense')}>
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
        subtitle="UNAI Manual Expense"
        icon={ReceiptText}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/unai-manual-expense')}>
              Back
            </Button>
            {(showSaveActions || mutation.isPending) && (
              <Button onClick={handleSave} disabled={mutation.isPending || isFetching || !hasExpenseChanges} className="h-10 rounded-xl px-5">
                {mutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : 'Save UNAI Manual Expenses'}
              </Button>
            )}
          </>
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

                <CheckboxMultiSelect
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
                  placeholder="Select accounts"
                  searchPlaceholder="Search accounts..."
                  emptyMessage="No accounts found."
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
                    updateVoucherCell={updateVoucherCell}
                    submitAttempted={submitAttempted}
                    rowValidationErrors={rowValidationErrors}
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

          {(showSaveActions || mutation.isPending) && (
            <div className="sticky bottom-4 z-10 rounded-3xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                    <WalletCards className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">UNAI manual expense changes</p>
                    <p className="text-muted-foreground">
                      {hasExpenseChanges
                        ? `${changedRowCount} changed/new ${changedRowCount === 1 ? 'row' : 'rows'} and ${deletedRowCount} deleted ${
                            deletedRowCount === 1 ? 'row' : 'rows'
                          } ready to save.`
                        : 'Refreshing expense rows...'}
                    </p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={mutation.isPending || isFetching || !hasExpenseChanges} className="h-10 rounded-xl px-6">
                  {mutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="size-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save UNAI Manual Expenses'
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UnaiManualExpensePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <LoaderCircle className="size-5 animate-spin" />
            Loading UNAI manual expense page...
          </div>
        </div>
      }
    >
      <UnaiManualExpensePageContent />
    </Suspense>
  );
}
