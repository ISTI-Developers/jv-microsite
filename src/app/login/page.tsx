'use client';

import { Box, Button, Card, CardContent, TextField, Typography, Link } from '@mui/material';

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
        }}
      >
        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
          }}
        >
          <Typography variant="h4" textAlign="center" mb={1}>
            Welcome to JV Microsite
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
            Sign in to continue
          </Typography>

          <Box component="form" display="flex" flexDirection="column" gap={2.5}>
            <TextField label="Email" type="email" fullWidth autoComplete="email" />

            <TextField label="Password" type="password" fullWidth autoComplete="current-password" />

            <Box textAlign="right">
              <Link href="/forgot-password" variant="body2" underline="hover">
                Forgot password?
              </Link>
            </Box>

            <Button variant="contained" size="large" sx={{ py: 1.4 }}>
              Sign In
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
