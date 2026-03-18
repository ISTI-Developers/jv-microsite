'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Button, CircularProgress, Stack } from '@mui/material';
import DataTable, { Column } from '../components/DataTable';
import { fetchRevenues, Revenue } from './action';

import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

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
    queryKey: ['revenues', params],
    queryFn: () => fetchRevenues(params!.from, params!.to),
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

  const columns: Column<Revenue>[] = [
    { header: 'Company', render: (row) => row.cCompanyID.trim() },
    { header: 'Module', render: (row) => row.cModule },
    { header: 'Category', render: (row) => row.cCategory },
    { header: 'Revenue Type', render: (row) => row.cRevenueType },

    { header: 'Tran No', render: (row) => row.cTranNo.trim() },

    {
      header: 'Date',
      render: (row) => dayjs(row.dDate).format('MMM DD, YYYY'),
    },

    { header: 'Client Code', render: (row) => row.cClientcode },
    { header: 'Client Name', render: (row) => row.cClientName.trim() },

    { header: 'Salesman Code', render: (row) => row.cSalesmanCode },
    { header: 'Salesman Name', render: (row) => row.cSalesmanName },

    { header: 'Contract ID', render: (row) => row.cContractID },
    { header: 'Job No', render: (row) => row.cJobNo },

    {
      header: 'Due From',
      render: (row) => dayjs(row.dDueDate).format('MMM DD, YYYY'),
    },

    {
      header: 'Due To',
      render: (row) => dayjs(row.dDueDateTo).format('MMM DD, YYYY'),
    },

    { header: 'Site ID', render: (row) => row.cSiteID },
    { header: 'Structure ID', render: (row) => row.cStuctureID },
    { header: 'Structure Address', render: (row) => row.cStructureAddress },

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

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Revenue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ERP Revenue Report
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
          Failed to load revenue.
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
