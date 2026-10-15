'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Alert, Button, TextField } from '@/components/ui';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { changePasswordSchema } from '@/lib/schemas';

type Form = z.infer<typeof changePasswordSchema>;

export function ChangePasswordCard() {
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setStatus(null);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setStatus({ kind: 'success', text: 'Password changed. Other devices have been signed out.' });
      reset();
    } catch (e) {
      if (!applyFieldErrors(e, setError)) setStatus({ kind: 'error', text: errorMessage(e) });
    }
  });

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2 className="card__title" style={{ fontSize: '1.2rem' }}>Change password</h2>
      <form className="form" onSubmit={onSubmit} noValidate>
        {status && <Alert kind={status.kind}>{status.text}</Alert>}
        <TextField label="Current password" type="password" autoComplete="current-password" required error={errors.currentPassword?.message} {...register('currentPassword')} />
        <TextField label="New password" type="password" autoComplete="new-password" required hint="8+ characters with letters and numbers" error={errors.newPassword?.message} {...register('newPassword')} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div><Button type="submit" loading={isSubmitting}>Update password</Button></div>
      </form>
    </div>
  );
}
