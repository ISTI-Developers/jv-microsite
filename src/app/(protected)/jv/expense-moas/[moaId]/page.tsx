'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ApiCategory, Category, ExpenseItem, MoaData } from '../../../../types/moa';
import { ExpensePayload } from './moaId.types';
import { Button } from '@/components/ui/button';
import JVComboSelect from '@/app/(protected)/components/jvComboSelect';
import { toast } from 'sonner';
import GTabs from '@/app/(protected)/components/GTabs';
import ExpenseTable from './ExpenseTable';

type EditableExpenseItem = ExpenseItem & {
  _tempId?: string;
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

  const { data, refetch } = useQuery<MoaData>({
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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await apiFetch('https://api.unmg.com.ph/jv/expenses/category');
      const json: { data: ApiCategory[]; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed');
      }

      return json.data.map((c) => ({
        id: Number(c.cAcctNo),
        name: c.cTitle,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{data?.moa.moa_name}</h1>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
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
        <div className="space-y-6">
          <div>
            <h2 className="font-medium">{activeLocation.location_name}</h2>
            {activeLocation.report_group ? <p className="text-sm text-muted-foreground">{activeLocation.report_group}</p> : null}
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

          {selectedCats.map((cat) => {
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
          })}
        </div>
      )}

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
