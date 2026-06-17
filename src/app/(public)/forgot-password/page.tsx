// ForgotPassword.tsx (refactored to MATCH your login design + proper validation)
'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hasMinLength, isNonEmpty, isValidEmail, isWithinMaxLength } from '@/lib/validation';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttemptedStep, setSubmitAttemptedStep] = useState<Step | null>(null);

  const getEmailError = (value: string) => {
    if (!isNonEmpty(value)) return 'Email is required.';
    if (!isWithinMaxLength(value, 255)) return 'Email must be 255 characters or fewer.';
    if (!isValidEmail(value)) return 'Enter a valid email address.';
    return null;
  };

  const getOtpError = (value: string) => {
    if (!isNonEmpty(value)) return 'OTP is required.';
    if (!isWithinMaxLength(value, 20)) return 'OTP must be 20 characters or fewer.';
    if (!/^\d+$/.test(value.trim())) return 'OTP must contain numbers only.';
    return null;
  };

  const getNewPasswordError = (value: string) => {
    if (!isNonEmpty(value)) return 'New password is required.';
    if (!hasMinLength(value, 8)) return 'Password must be at least 8 characters.';
    if (!isWithinMaxLength(value, 128)) return 'Password must be 128 characters or fewer.';
    return null;
  };

  const emailError = submitAttemptedStep === 'email' ? getEmailError(email) : null;
  const otpError = submitAttemptedStep === 'otp' ? getOtpError(otp) : null;
  const newPasswordError = submitAttemptedStep === 'reset' ? getNewPasswordError(newPassword) : null;

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
    setSubmitAttemptedStep('email');

    const validationError = getEmailError(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    await submit('/auth/forgot-password', { email: email.trim() });
    setStep('otp');
    setSubmitAttemptedStep(null);
  };

  const handleOtp = async () => {
    setSubmitAttemptedStep('otp');

    const validationError = getOtpError(otp);
    if (validationError) {
      setError(validationError);
      return;
    }

    await submit('/auth/verify-otp', { email: email.trim(), otp: otp.trim() });
    setStep('reset');
    setSubmitAttemptedStep(null);
  };

  const handleReset = async () => {
    setSubmitAttemptedStep('reset');

    const validationError = getNewPasswordError(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    await submit('/auth/reset-password', {
      email: email.trim(),
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
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                aria-invalid={!!emailError}
                className="h-11 rounded-xl"
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-2">
              <label htmlFor="forgot-otp" className="text-sm font-medium">
                OTP <span className="text-destructive">*</span>
              </label>
              <Input
                id="forgot-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={20}
                aria-invalid={!!otpError}
                className="h-11 rounded-xl"
              />
              {otpError && <p className="text-sm text-destructive">{otpError}</p>}
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-2">
              <label htmlFor="forgot-new-password" className="text-sm font-medium">
                New Password <span className="text-destructive">*</span>
              </label>
              <Input
                id="forgot-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                maxLength={128}
                aria-invalid={!!newPasswordError}
                className="h-11 rounded-xl"
              />
              {newPasswordError && <p className="text-sm text-destructive">{newPasswordError}</p>}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

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
