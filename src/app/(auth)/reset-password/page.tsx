'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, TextField } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { resetSchema } from '@/lib/schemas';

type Form = z.infer<typeof resetSchema>;
const RESET_TOKEN_KEY = 'ug_reset_token';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(resetSchema) });

  useEffect(() => setToken(sessionStorage.getItem(RESET_TOKEN_KEY)), []);

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setError(null);
    try {
      await api.post('/auth/reset-password', { resetToken: token, newPassword });
      sessionStorage.removeItem(RESET_TOKEN_KEY);
      router.replace('/login?reset=1');
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  if (token === undefined) return <AuthShell title="Set new password"><span /></AuthShell>;
  if (!token) {
    return (
      <AuthShell title="Link expired" footer={<Link href="/forgot-password">Start again</Link>}>
        <Alert kind="warning">We could not find a verified reset session. Please request a new code.</Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password you have not used elsewhere.">
      <form className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="New password" type="password" autoComplete="new-password" required hint="8+ characters with letters and numbers" error={errors.newPassword?.message} {...register('newPassword')} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" size="lg" block loading={isSubmitting}>Update password</Button>
      </form>
    </AuthShell>
  );
}
