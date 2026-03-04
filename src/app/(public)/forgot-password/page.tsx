// ForgotPassword.tsx (refactored to MATCH your login design + proper validation)
'use client';

import { Box, Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material';
import { useState } from 'react';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (url: string, body: object) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        if (
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error: string }).error === 'string'
        ) {
          throw new Error((data as { error: string }).error);
        }
        throw new Error('Something went wrong');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    await submit('/auth/forgot-password', { email });
    setStep('otp');
  };

  const handleOtp = async () => {
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    await submit('/auth/verify-otp', { email, otp });
    setStep('reset');
  };

  const handleReset = async () => {
    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    await submit('/auth/reset-password', {
      email,
      new_password: newPassword,
    });
    window.location.href = '/login';
  };

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
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h4" textAlign="center" mb={1}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'reset' && 'Set New Password'}
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && 'Enter the OTP sent to your email'}
            {step === 'reset' && 'Choose a new password'}
          </Typography>

          <Stack spacing={2.5}>
            {step === 'email' && (
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
            )}

            {step === 'otp' && (
              <TextField
                label="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                required
                fullWidth
              />
            )}

            {step === 'reset' && (
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                fullWidth
              />
            )}

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              sx={{ py: 1.4 }}
              disabled={loading}
              onClick={step === 'email' ? handleEmail : step === 'otp' ? handleOtp : handleReset}
            >
              {loading
                ? 'Please wait…'
                : step === 'email'
                  ? 'Send OTP'
                  : step === 'otp'
                    ? 'Verify OTP'
                    : 'Reset Password'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
