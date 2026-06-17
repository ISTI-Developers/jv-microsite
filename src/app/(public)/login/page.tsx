'use client';

import { useEffect, useState, type SubmitEventHandler } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isNonEmpty, isValidEmail, isWithinMaxLength } from '@/lib/validation';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const getEmailError = (value: string) => {
    if (!isNonEmpty(value)) return 'Email is required.';
    if (!isWithinMaxLength(value, 255)) return 'Email must be 255 characters or fewer.';
    if (!isValidEmail(value)) return 'Enter a valid email address.';
    return null;
  };

  const getPasswordError = (value: string) => {
    if (!isNonEmpty(value)) return 'Password is required.';
    if (!isWithinMaxLength(value, 128)) return 'Password must be 128 characters or fewer.';
    return null;
  };

  const emailError = submitAttempted ? getEmailError(email) : null;
  const passwordError = submitAttempted ? getPasswordError(password) : null;

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (getEmailError(email) || getPasswordError(password) || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, remember_me: rememberMe }),
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

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="size-4 animate-spin" />
          Preparing sign in...
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center overflow-y-auto bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted))_100%)] px-4 py-10">
      <Card className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
        <CardHeader className="mb-6 flex flex-col items-center gap-4 space-y-0 p-0 text-center">
          <div className="grid h-[68px] w-[68px] place-items-center rounded-2xl border border-border bg-background shadow-sm">
            <Image src="/icon.png" alt="JV Microsite" width={48} height={48} style={{ objectFit: 'contain' }} priority />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">JV Microsite</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                aria-invalid={!!emailError}
                className="h-11 rounded-xl bg-background px-3"
              />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password <span className="text-destructive">*</span>
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={128}
                  aria-invalid={!!passwordError}
                  className="h-11 rounded-xl bg-background px-3 pr-11"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-transparent hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal text-muted-foreground">
                  Remember me
                </Label>
              </div>

              <Button asChild variant="link" className="h-auto p-0 text-sm font-medium">
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="h-11 w-full rounded-xl">
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="mt-4 border-t border-border bg-transparent p-0 pt-4">
          <p className="w-full text-center text-xs text-muted-foreground">By continuing, you agree to the company policies and acceptable use.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
