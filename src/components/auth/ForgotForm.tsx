'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, TextField } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { forgotSchema } from '@/lib/schemas';

type Form = z.infer<typeof forgotSchema>;

/** Used for both "Forgot password" and "Activate account" (admin-invited members set their first password the same way). */
export function ForgotForm({ mode }: { mode: 'forgot' | 'activate' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = handleSubmit(async ({ identifier }) => {
    setError(null);
    try {
      await api.post('/auth/forgot-password', { identifier });
      router.push(`/verify-otp?purpose=PASSWORD_RESET&identifier=${encodeURIComponent(identifier)}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  const activate = mode === 'activate';
  return (
    <AuthShell
      title={activate ? 'Activate your account' : 'Forgot password'}
      subtitle={
        activate
          ? 'The gym has registered you. Enter the email or phone number the gym has on file and we will send a code so you can set your own password.'
          : 'Enter your registered email or phone number and we will send you a verification code.'
      }
      footer={<Link href="/login">Back to login</Link>}
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="Email or phone number" autoComplete="username" required error={errors.identifier?.message} {...register('identifier')} />
        <Button type="submit" size="lg" block loading={isSubmitting}>Send code</Button>
      </form>
    </AuthShell>
  );
}
