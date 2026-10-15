'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, TextField } from '@/components/ui';
import { homeFor, useAuth } from '@/context/AuthContext';
import { api, ApiError, errorMessage } from '@/lib/api';
import { loginSchema } from '@/lib/schemas';
import type { SessionUser } from '@/lib/types';

type Form = z.infer<typeof loginSchema>;

/** Only follow ?next= when it stays inside the area this role may use. */
function safeNext(next: string | null, user: SessionUser): string {
  const home = homeFor(user);
  if (!next || !next.startsWith('/') || next.startsWith('//')) return home;
  const area = user.role === 'ADMIN' ? '/admin' : '/member';
  return next.startsWith(area) ? next : home;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await api.post<SessionUser>('/auth/login', values);
      setUser(user);
      router.replace(safeNext(params.get('next'), user)); // destination is decided by the server-verified role
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_VERIFIED') {
        router.push(`/verify-otp?purpose=SIGNUP&identifier=${encodeURIComponent(values.identifier)}`);
        return;
      }
      setError(errorMessage(e));
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your membership and monthly fee status."
      footer={<>New here? <Link href="/signup">Create an account</Link></>}
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        {params.get('reset') && <Alert kind="success">Password updated. Please log in with your new password.</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="Email or phone number" autoComplete="username" required error={errors.identifier?.message} {...register('identifier')} />
        <TextField label="Password" type="password" autoComplete="current-password" required error={errors.password?.message} {...register('password')} />
        <div className="auth-card__links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/activate">Activate member account</Link>
        </div>
        <Button type="submit" size="lg" block loading={isSubmitting}>Log in</Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
