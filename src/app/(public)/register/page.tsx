'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setMessage('Registered successfully');
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage('Something went wrong');
      }
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium">
              Email
            </label>
            <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
          </div>

          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
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

        {message && <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
