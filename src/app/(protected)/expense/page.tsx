'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Button, CircularProgress, Stack } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchExpenses } from './action';

import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { columns } from './gyatt';

export default function ExpensePage() {
  const today = dayjs();

  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(today);

  const [params, setParams] = useState<{ from: string; to: string } | null>(null);

  const {
    data = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => fetchExpenses(params!.from, params!.to),
    enabled: !!params,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSearch = () => {
    if (!from || !to) return;

    setParams({
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Expenses
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ERP Expense Report
        </Typography>
      </Box>

      {/* Filters */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <DatePicker
            label="From"
            value={from}
            onChange={(value) => setFrom(value)}
            maxDate={to ?? today}
            slotProps={{ textField: { size: 'small' } }}
          />

          <DatePicker
            label="To"
            value={to}
            onChange={(value) => setTo(value)}
            minDate={from ?? undefined}
            slotProps={{ textField: { size: 'small' } }}
          />

          <Button variant="contained" onClick={handleSearch} disabled={isFetching}>
            {isFetching ? <CircularProgress size={20} /> : 'Search'}
          </Button>
        </Stack>
      </LocalizationProvider>

      {/* Preset Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setFrom(today);
            setTo(today);
          }}
        >
          Today
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setFrom(today.subtract(7, 'day'));
            setTo(today);
          }}
        >
          Last 7 Days
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setFrom(today.startOf('month'));
            setTo(today);
          }}
        >
          This Month
        </Button>
      </Stack>

      {/* Error */}
      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load expenses.
        </Typography>
      )}

      {/* Table */}
      <DataTable
        rows={data}
        columns={columns}
        getRowKey={(row) => row.cTranNo.trim()}
        loading={isFetching}
        pagination
        paginationMode="frontend"
      />
    </Box>
  );
}
