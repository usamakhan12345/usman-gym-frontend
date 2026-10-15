'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { Alert, Button, TextField } from '@/components/ui';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { signupSchema } from '@/lib/schemas';

type Form = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(signupSchema) });

  const onSubmit = handleSubmit(async ({ confirmPassword: _c, ...values }) => {
    setError(null);
    try {
      await api.post('/auth/register', values);
      router.push(`/verify-otp?purpose=SIGNUP&identifier=${encodeURIComponent(values.email)}`);
    } catch (e) {
      if (!applyFieldErrors(e, setFieldError)) setError(errorMessage(e));
    }
  });

  return (
    <AuthShell
      title="Join Usman Gym"
      subtitle="Create your account. We will email you a code to verify it."
      footer={<>Already have an account? <Link href="/login">Log in</Link></>}
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="Full name" autoComplete="name" required error={errors.fullName?.message} {...register('fullName')} />
        <TextField label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <TextField label="Phone number" type="tel" autoComplete="tel" required hint="Use the number the gym has on file, e.g. +923001234567" error={errors.phone?.message} {...register('phone')} />
        <TextField label="Password" type="password" autoComplete="new-password" required hint="8+ characters with letters and numbers" error={errors.password?.message} {...register('password')} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Alert kind="info">Signing up creates a login only. Your membership is activated by the gym admin; it is not created by signing up.</Alert>
        <Button type="submit" size="lg" block loading={isSubmitting}>Create account</Button>
      </form>
    </AuthShell>
  );
}
