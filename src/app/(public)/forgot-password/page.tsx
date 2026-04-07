// ForgotPassword.tsx (refactored to MATCH your login design + proper validation)
'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string') {
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
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-3xl font-semibold tracking-tight">
          {step === 'email' && 'Forgot Password'}
          {step === 'otp' && 'Verify OTP'}
          {step === 'reset' && 'Set New Password'}
        </h1>

        <p className="mb-6 mt-2 text-center text-sm text-muted-foreground">
          {step === 'email' && 'Enter your email to receive an OTP'}
          {step === 'otp' && 'Enter the OTP sent to your email'}
          {step === 'reset' && 'Choose a new password'}
        </p>

        <div className="space-y-4">
          {step === 'email' && (
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium">
                Email
              </label>
              <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-2">
              <label htmlFor="forgot-otp" className="text-sm font-medium">
                OTP
              </label>
              <Input
                id="forgot-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                required
                className="h-11 rounded-xl"
              />
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-2">
              <label htmlFor="forgot-new-password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="forgot-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            size="lg"
            className="h-11 w-full rounded-xl"
            disabled={loading}
            onClick={step === 'email' ? handleEmail : step === 'otp' ? handleOtp : handleReset}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Please wait...
              </span>
            ) : step === 'email' ? (
              'Send OTP'
            ) : step === 'otp' ? (
              'Verify OTP'
            ) : (
              'Reset Password'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
