'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hasMinLength, isNonEmpty, isValidEmail, isWithinMaxLength } from '@/lib/validation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const getEmailError = (value: string) => {
    if (!isNonEmpty(value)) return 'Email is required.';
    if (!isWithinMaxLength(value, 255)) return 'Email must be 255 characters or fewer.';
    if (!isValidEmail(value)) return 'Enter a valid email address.';
    return null;
  };

  const getPasswordError = (value: string) => {
    if (!isNonEmpty(value)) return 'Password is required.';
    if (!hasMinLength(value, 8)) return 'Password must be at least 8 characters.';
    if (!isWithinMaxLength(value, 128)) return 'Password must be 128 characters or fewer.';
    return null;
  };

  const emailError = submitAttempted ? getEmailError(email) : null;
  const passwordError = submitAttempted ? getPasswordError(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setMessage(null);
    setMessageType(null);

    if (getEmailError(email) || getPasswordError(password)) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMessage('Registered successfully');
      setMessageType('success');
      setEmail('');
      setPassword('');
      setSubmitAttempted(false);
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage('Something went wrong');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">JV Microsite</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="register-email"
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

          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </label>
            <Input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={128}
              aria-invalid={!!passwordError}
              className="h-11 rounded-xl"
            />
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>

          <Button type="submit" size="lg" disabled={loading} className="h-11 w-full rounded-xl">
            {loading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Register'
            )}
          </Button>
        </form>

        {message && <p className={`mt-4 text-center text-sm ${messageType === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>{message}</p>}
      </div>
    </div>
  );
}
