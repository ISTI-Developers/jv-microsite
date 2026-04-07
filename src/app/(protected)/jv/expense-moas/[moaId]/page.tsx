'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { MoaData, Category, ApiCategory, ExpenseItem } from '../../../../types/moa';
import { ExpensePayload } from './moaId.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type EditableExpenseItem = ExpenseItem & {
  _tempId?: string;
};

export default function JVExpenseMoaDetailPage() {
  const params = useParams();
  const moaId = params.moaId as string;

  const [tabIndex, setTabIndex] = useState(0);

  const { data } = useQuery<MoaData>({
    queryKey: ['jv-moa', moaId],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa/show?id=${moaId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      return json.data;
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await apiFetch(`https://api.unmg.com.ph/jv/expenses/category`);
      const json: { data: ApiCategory[]; error?: string } = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      return json.data.map((c) => ({
        id: Number(c.cAcctNo),
        name: c.cTitle,
      }));
    },
  });

  const initialExpenses = useMemo(() => {
    if (!data?.expenses) return {};

    const mapped: Record<number, Record<number, EditableExpenseItem[]>> = {};

    Object.entries(data.expenses).forEach(([locId, cats]) => {
      mapped[+locId] = {};

      Object.entries(cats).forEach(([catId, items]) => {
        mapped[+locId][+catId] = items.map((item) => ({
          ...item,
          _tempId: item.id ? `db-${item.id}` : crypto.randomUUID(),
        }));
      });
    });

    return mapped;
  }, [data]);

  const [expenses, setExpenses] = useState<Record<number, Record<number, EditableExpenseItem[]>>>({});

  const [selectedCategoriesByLoc, setSelectedCategoriesByLoc] = useState<Record<number, Category[]>>({});

  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const currentExpenses = Object.keys(expenses).length > 0 || !data?.expenses ? expenses : initialExpenses;

  const updateCell = (locId: number, catId: number, index: number, field: keyof ExpenseItem, value: string) => {
    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = [...(source[locId]?.[catId] || [])];

      rows[index] = {
        ...rows[index],
        [field]: field === 'amount' ? Number(value || 0) : value,
      };

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [catId]: rows,
        },
      };
    });
  };

  const addRow = (locId: number, catId: number) => {
    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = source[locId]?.[catId] || [];

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [catId]: [
            ...rows,
            {
              _tempId: crypto.randomUUID(),
              date: '',
              ref_no: '',
              payee: '',
              name: '',
              amount: 0,
            },
          ],
        },
      };
    });
  };

  const deleteRow = (locId: number, catId: number, index: number) => {
    setExpenses((prev) => {
      const source = Object.keys(prev).length > 0 ? prev : initialExpenses;
      const rows = [...(source[locId]?.[catId] || [])];
      rows.splice(index, 1);

      return {
        ...source,
        [locId]: {
          ...(source[locId] || {}),
          [catId]: rows,
        },
      };
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: ExpensePayload[] = [];
      Object.entries(currentExpenses).forEach(([locId, cats]) => {
        Object.entries(cats).forEach(([catId, items]) => {
          items.forEach((item) => {
            payload.push({
              id: item.id ?? null,
              location_id: Number(locId),
              category_id: Number(catId),
              name: item.name,
              amount: item.amount,
              date: item.date,
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
      if (!res.ok) throw new Error(json.error || 'Failed to submit');

      return json;
    },

    onSuccess: () => {
      setSnack({
        open: true,
        message: 'Expenses saved successfully',
        severity: 'success',
      });
    },

    onError: (err) => {
      if (err instanceof Error) {
        setSnack({
          open: true,
          message: err.message,
          severity: 'error',
        });
      } else {
        setSnack({
          open: true,
          message: 'Something went wrong',
          severity: 'error',
        });
      }
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{data?.moa.moa_name}</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {data?.locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setTabIndex(data.locations.findIndex((item) => item.id === loc.id))}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-medium transition',
              data.locations[tabIndex]?.id === loc.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'
            )}
          >
            {loc.location_name}
          </button>
        ))}
      </div>

      {data?.locations[tabIndex] &&
        (() => {
          const loc = data.locations[tabIndex];
          const existingCatIds = Object.keys(currentExpenses[loc.id] || {}).map(Number);
          const existingCats = categories.filter((c) => existingCatIds.includes(c.id));
          const selectedCatsRaw = selectedCategoriesByLoc[loc.id] || existingCats;
          const selectedCats = Array.from(new Map(selectedCatsRaw.map((c) => [c.id, c])).values());

          return (
            <div key={loc.id}>
              <div className="mb-6 rounded-2xl border border-border bg-card p-4">
                <label htmlFor={`categories-${loc.id}`} className="mb-2 block text-sm font-medium">
                  Categories
                </label>
                <select
                  id={`categories-${loc.id}`}
                  multiple
                  value={selectedCats.map((cat) => String(cat.id))}
                  onChange={(event) => {
                    const chosen = Array.from(event.target.selectedOptions, (option) =>
                      categories.find((item) => String(item.id) === option.value)
                    ).filter(Boolean) as Category[];

                    const merged = [...chosen.filter((value) => !existingCatIds.includes(value.id)), ...existingCats];

                    const unique = Array.from(new Map(merged.map((c) => [c.id, c])).values());

                    setSelectedCategoriesByLoc((prev) => ({
                      ...prev,
                      [loc.id]: unique,
                    }));
                  }}
                  className="min-h-36 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCats.map((cat) => {
                const rows = expenses[loc.id]?.[cat.id] || [];
                const rows = currentExpenses[loc.id]?.[cat.id] || [];

                return (
                  <div key={cat.id} className="mb-6 rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-semibold">{cat.name}</p>

                      <Button size="sm" onClick={() => addRow(loc.id, cat.id)}>
                        + Add Row
                      </Button>
                    </div>

                    <div className="mb-2 hidden grid-cols-[1.2fr_1.4fr_2fr_3fr_1.2fr_48px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
                      <span>Date</span>
                      <span>Ref No</span>
                      <span>Payee</span>
                      <span>Particulars</span>
                      <span>Amount</span>
                      <span />
                    </div>

                    {rows.map((row, i) => (
                      <div
                        key={row._tempId}
                        className="mb-2 grid gap-2 rounded-xl border border-border/70 p-3 lg:grid-cols-[1.2fr_1.4fr_2fr_3fr_1.2fr_48px] lg:border-0 lg:p-0"
                      >
                        <Input
                          type="date"
                          value={row.date || ''}
                          onChange={(e) => updateCell(loc.id, cat.id, i, 'date', e.target.value)}
                          className="h-10"
                        />

                        <Input
                          value={row.ref_no || ''}
                          onChange={(e) => updateCell(loc.id, cat.id, i, 'ref_no', e.target.value)}
                          placeholder="Ref No"
                          className="h-10"
                        />

                        <Input
                          value={row.payee || ''}
                          onChange={(e) => updateCell(loc.id, cat.id, i, 'payee', e.target.value)}
                          placeholder="Payee"
                          className="h-10"
                        />

                        <Input
                          value={row.name || ''}
                          onChange={(e) => updateCell(loc.id, cat.id, i, 'name', e.target.value)}
                          placeholder="Particulars"
                          className="h-10"
                        />

                        <Input
                          type="number"
                          value={row.amount || ''}
                          onChange={(e) => updateCell(loc.id, cat.id, i, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="h-10"
                        />

                        <Button type="button" variant="outline" size="icon" onClick={() => deleteRow(loc.id, cat.id, i)} className="h-10 w-10">
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete row</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })()}

      <Button className="w-full" onClick={() => mutation.mutate()}>
        Save
      </Button>
      {snack.open && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={cn(
              'rounded-xl border px-4 py-3 text-sm shadow-lg',
              snack.severity === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {snack.message}
          </div>
        </div>
      )}
    </div>
  );
}
