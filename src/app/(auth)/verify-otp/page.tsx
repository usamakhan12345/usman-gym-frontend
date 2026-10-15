'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, TextField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api, errorMessage } from '@/lib/api';
import { otpSchema } from '@/lib/schemas';
import type { SessionUser } from '@/lib/types';

type Form = z.infer<typeof otpSchema>;
const RESET_TOKEN_KEY = 'ug_reset_token';
const COOLDOWN = 60;

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const identifier = params.get('identifier') ?? '';
  const purpose = params.get('purpose') === 'PASSWORD_RESET' ? 'PASSWORD_RESET' : 'SIGNUP';
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const [resending, setResending] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = handleSubmit(async ({ code }) => {
    setError(null);
    try {
      const res = await api.post<{ user?: SessionUser; resetToken?: string }>('/auth/verify-otp', { identifier, purpose, code });
      if (purpose === 'SIGNUP' && res.user) {
        setUser(res.user);
        router.replace('/member/dashboard'); // account / membership status screen
      } else if (res.resetToken) {
        sessionStorage.setItem(RESET_TOKEN_KEY, res.resetToken);
        router.replace('/reset-password');
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  const resend = async () => {
    setResending(true); setError(null); setInfo(null);
    try {
      await api.post('/auth/resend-otp', { identifier, purpose });
      setInfo('If your account is eligible, a new code has been sent.');
      setCooldown(COOLDOWN);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setResending(false);
    }
  };

  if (!identifier) {
    return (
      <AuthShell title="Verification">
        <Alert kind="warning">This page needs an account to verify. <Link href="/signup"><u>Sign up</u></Link> or <Link href="/forgot-password"><u>reset your password</u></Link> to get a code.</Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Enter your code"
      subtitle={`We sent a 6-digit code to ${identifier}. It expires in 10 minutes.`}
      footer={<Link href="/login">Back to login</Link>}
    >
      <form className="form otp-input" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        {info && <Alert kind="success">{info}</Alert>}
        <TextField label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required error={errors.code?.message} {...register('code')} />
        <Button type="submit" size="lg" block loading={isSubmitting}>Verify</Button>
        <Button variant="ghost" block onClick={resend} disabled={cooldown > 0} loading={resending}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return <Suspense><VerifyForm /></Suspense>;
}
