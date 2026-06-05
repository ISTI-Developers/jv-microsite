'use client';

import { useEffect, useMemo, useState, type SubmitEventHandler } from 'react';
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
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-24 -bottom-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <Card className="relative z-10 w-full max-w-[460px] rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl backdrop-blur sm:p-8">
        <CardHeader className="mb-6 flex flex-col items-center gap-4 space-y-0 p-0 text-center">
          <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-white shadow-lg shadow-slate-900/10">
            <Image src="/icon.png" alt="JV Microsite" width={48} height={48} style={{ objectFit: 'contain' }} priority />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">JV Microsite</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 bg-white px-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-slate-200 bg-white px-3 pr-11"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-transparent hover:text-slate-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal text-slate-600">
                  Remember me
                </Label>
              </div>

              <Button asChild variant="link" className="h-auto p-0 text-sm font-medium text-blue-600 hover:text-blue-700">
                <Link href="/forgot-password">Forgot password?</Link>
              </Button>
            </div>

            <Button type="submit" size="lg" disabled={!canSubmit} className="h-11 w-full rounded-xl">
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

        <CardFooter className="mt-4 border-t border-slate-200 p-0 pt-4">
          <p className="w-full text-center text-xs text-slate-500">By continuing, you agree to the company policies and acceptable use.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
