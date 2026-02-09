'use client';

import { Box, Typography, Paper } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          lg: 'repeat(3, 1fr)',
        },
        gap: 3,
      }}
    >
      {[1, 2, 3].map((i) => (
        <Paper key={i} sx={{ p: 3 }}>
          <Typography variant="h6">Widget {i}</Typography>
          <Typography variant="body2" color="text.secondary">
            Placeholder content
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
