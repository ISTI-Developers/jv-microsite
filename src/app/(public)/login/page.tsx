'use client';

import { useEffect, useMemo, useState, type SubmitEventHandler } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const canSubmit = useMemo(() => {
    return !!email.trim() && !!password && !loading;
  }, [email, password, loading]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
        skipAuthHeader: true,
        skipAuthRedirectOn401: true,
      });

      const data: {
        session?: string;
        user?: { id: number; email: string; force_password_change: boolean };
        error?: string;
      } = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      if (!data.session || !data.user) throw new Error('Invalid server response');

      localStorage.setItem('session', data.session);
      await refreshUser();
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',

        background: `
      radial-gradient(circle at 15% 20%, rgba(59,130,246,0.15), transparent 40%),
      radial-gradient(circle at 85% 80%, rgba(99,102,241,0.18), transparent 40%),
      linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)
    `,
      }}
    >
      {/* 🔥 Glow Shape 1 */}
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(37,99,235,0.18)',
          filter: 'blur(120px)',
          top: -120,
          left: -120,
          zIndex: 0,
        }}
      />

      {/* 🔥 Glow Shape 2 */}
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.18)',
          filter: 'blur(120px)',
          bottom: -140,
          right: -120,
          zIndex: 0,
        }}
      />

      <Card
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          zIndex: 1,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack alignItems="center" spacing={1.75} mb={3}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'background.paper',
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              }}
            >
              <Image
                src="/icon.png"
                alt="JV Microsite"
                width={48}
                height={48}
                style={{ objectFit: 'contain' }}
                priority
              />
            </Box>

            <Box textAlign="center">
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.4,
                }}
              >
                JV Microsite
              </Typography>

              <Typography variant="body2" color="text.secondary" mt={0.25}>
                Sign in to continue
              </Typography>
            </Box>
          </Stack>

          <Box
            component="form"
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                      {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                }
                label={<Typography variant="body2">Remember me</Typography>}
              />

              <Link
                href="/forgot-password"
                underline="hover"
                sx={{
                  fontWeight: 500,
                  color: 'primary.main',
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              size="large"
              disabled={!canSubmit}
              sx={{
                py: 1.3,
                fontWeight: 700,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: '#1E4ED8',
                },
              }}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={18} thickness={5} sx={{ color: '#fff' }} />
                  Signing in…
                </Box>
              ) : (
                <Typography variant="button" color="#fff">
                  Sign In
                </Typography>
              )}
            </Button>

            <Divider sx={{ my: 0.5 }} />

            <Typography variant="caption" textAlign="center" color="text.secondary">
              By continuing, you agree to the company policies and acceptable use.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
