'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, Typography } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './components/Sidebar';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <Typography p={4}>Loading…</Typography>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          ml: { md: `${SIDEBAR_WIDTH}px` },
          p: { xs: 2, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
