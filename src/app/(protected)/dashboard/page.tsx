'use client';

import { Box, Grid, Paper, Typography, Skeleton, Divider } from '@mui/material';

function StatCardSkeleton() {
  return (
    <Paper sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={28} />
      <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" height={6} sx={{ mt: 2, borderRadius: 1 }} />
    </Paper>
  );
}

function ChartCardSkeleton({
  titleWidth = '30%',
  height = 260,
}: {
  titleWidth?: string | number;
  height?: number;
}) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Skeleton variant="text" width={titleWidth} height={28} />
      <Divider sx={{ my: 2 }} />
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
    </Paper>
  );
}

function TableSkeleton() {
  return (
    <Paper sx={{ p: 3 }}>
      <Skeleton variant="text" width="35%" height={28} />
      <Divider sx={{ my: 2 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Skeleton variant="text" width="25%" />
          <Skeleton variant="text" width="15%" />
          <Skeleton variant="text" width="20%" />
        </Box>
      ))}
    </Paper>
  );
}

export default function DashboardPage() {
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview and analytics
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCardSkeleton />
          </Grid>
        ))}

        {/* Main Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCardSkeleton titleWidth="25%" height={320} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCardSkeleton titleWidth="50%" height={320} />
        </Grid>

        {/* Secondary Charts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCardSkeleton titleWidth="40%" height={260} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCardSkeleton titleWidth="35%" height={260} />
        </Grid>

        {/* Table Placeholder */}
        <Grid size={{ xs: 12 }}>
          <TableSkeleton />
        </Grid>
      </Grid>
    </Box>
  );
}
