'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import AppModal from '@/app/(protected)/components/AppModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Location = {
  id: number;
  location_name: string;
};

type Category = {
  id: number;
  name: string;
};

type MoaData = {
  moa: {
    id: number;
    moa_name: string;
  };
  locations: Location[];
  categories: Category[];
};

export default function JVExpenseMoaDetailPage() {
  const params = useParams();
  const moaId = params.moaId as string;

  const { data } = useQuery<MoaData>({
    queryKey: ['jv-moa', moaId],
    queryFn: async () => {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa/show?id=${moaId}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      return json.data;
    },
  });

  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: '',
    amount: '',
    date: '',
  });

  const [expenses, setExpenses] = useState<Record<number, { name: string; amount: number; date: string }[]>>({});

  const addExpense = () => {
    if (!selectedCategory) return;

    const newExpense = {
      name: form.name,
      amount: Number(form.amount),
      date: form.date,
    };

    setExpenses((prev) => ({
      ...prev,
      [selectedCategory.id]: [...(prev[selectedCategory.id] || []), newExpense],
    }));

    setForm({ name: '', amount: '', date: '' });
    setOpen(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(expenses).flatMap(([categoryId, items]) =>
        items.map((item) => ({
          category_id: Number(categoryId),
          name: item.name,
          amount: item.amount,
          date: item.date,
        }))
      );

      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/expenses/create`, {
        method: 'POST',
        body: JSON.stringify({
          moa_id: Number(moaId),
          expenses: payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      return data;
    },
  });

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold tracking-tight">{data?.moa.moa_name}</h1>

      <p className="text-sm font-medium text-muted-foreground">Locations</p>
      {data?.locations.map((loc) => (
        <div key={loc.id} className="text-sm">
          {loc.location_name}
        </div>
      ))}

      <div className="my-4 border-t border-border" />

      <h2 className="mb-3 text-lg font-semibold">Categories</h2>

      {data?.categories.map((cat) => (
        <div key={cat.id} className="mb-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{cat.name}</p>
            <Button
              size="small"
              onClick={() => {
                setSelectedCategory(cat);
                setOpen(true);
              }}
            >
              Add +
            </Button>
          </div>

          {(expenses[cat.id] || []).map((exp, i) => (
            <div key={i} className="ml-2 mt-2 text-sm text-muted-foreground">
              {exp.name} - {exp.amount} - {exp.date}
            </div>
          ))}
        </div>
      ))}

      <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Submit All
      </Button>

      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add Expense (${selectedCategory?.name || ''})`}
        actions={<Button onClick={addExpense}>Save</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="expense-name" className="text-sm font-medium">
              Expense Name
            </label>
            <Input id="expense-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10" />
          </div>

          <div className="space-y-2">
            <label htmlFor="expense-amount" className="text-sm font-medium">
              Amount
            </label>
            <Input
              id="expense-amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="expense-date" className="text-sm font-medium">
              Date
            </label>
            <Input id="expense-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-10" />
          </div>
        </div>
      </AppModal>
    </div>
  );
}
