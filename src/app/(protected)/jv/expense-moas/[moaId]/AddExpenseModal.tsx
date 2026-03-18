'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Button, Divider, TextField } from '@mui/material';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import AppModal from '@/app/(protected)/components/AppModal';

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

  const [expenses, setExpenses] = useState<
    Record<number, { name: string; amount: number; date: string }[]>
  >({});

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
    <Box>
      <Typography variant="h5" mb={2}>
        {data?.moa.moa_name}
      </Typography>

      <Typography variant="subtitle1">Locations</Typography>
      {data?.locations.map((loc) => (
        <Box key={loc.id}>{loc.location_name}</Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" mb={2}>
        Categories
      </Typography>

      {data?.categories.map((cat) => (
        <Box key={cat.id} mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography>{cat.name}</Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setSelectedCategory(cat);
                setOpen(true);
              }}
            >
              Add +
            </Button>
          </Box>

          {(expenses[cat.id] || []).map((exp, i) => (
            <Box key={i} ml={2}>
              {exp.name} - {exp.amount} - {exp.date}
            </Box>
          ))}
        </Box>
      ))}

      <Button
        variant="contained"
        fullWidth
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        Submit All
      </Button>

      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add Expense (${selectedCategory?.name || ''})`}
        actions={
          <Button onClick={addExpense} variant="contained">
            Save
          </Button>
        }
      >
        <TextField
          label="Expense Name"
          fullWidth
          sx={{ mb: 2 }}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <TextField
          label="Amount"
          type="number"
          fullWidth
          sx={{ mb: 2 }}
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <TextField
          type="date"
          fullWidth
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </AppModal>
    </Box>
  );
}
