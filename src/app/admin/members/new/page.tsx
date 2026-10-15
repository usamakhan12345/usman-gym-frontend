'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, UserPlus } from 'lucide-react';
import type { z } from 'zod';
import { Alert, Button, PageHead, SelectField, TextField } from '@/components/ui';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { fmtDate, money, todayISO } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { memberSchema } from '@/lib/schemas';
import type { Plan } from '@/lib/types';

type Form = z.infer<typeof memberSchema>;
interface Created { id: string; gymId: string; fullName: string; monthlyFee: string; joinedOn: string; feesCreated: number; inviteSent: boolean }
interface Unlinked { id: string; fullName: string; email: string | null; phone: string; status: string }

function AddMemberForm() {
  const signupId = useSearchParams().get('signup');
  const plans = useFetch(() => api.get<Plan[]>('/admin/plans'), []);
  const unlinked = useFetch(() => api.get<Unlinked[]>('/admin/members/unlinked-users'), []);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ member: Created; imageError?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, setValue, reset, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(memberSchema),
    defaultValues: { fullName: '', phone: '', email: '', joinedOn: todayISO(), planId: '', monthlyFee: '', status: 'ACTIVE' },
  });

  // Arriving from "Create membership" on a pending sign-up: prefill their details.
  useEffect(() => {
    const u = unlinked.data?.find((x) => x.id === signupId);
    if (u) { setValue('fullName', u.fullName); setValue('phone', u.phone); setValue('email', u.email ?? ''); }
  }, [unlinked.data, signupId, setValue]);

  const activePlans = (plans.data ?? []).filter((p) => p.isActive);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const member = await api.post<Created>('/admin/members', {
        fullName: v.fullName, phone: v.phone, joinedOn: v.joinedOn, monthlyFee: v.monthlyFee, status: v.status,
        ...(v.email ? { email: v.email } : {}), ...(v.planId ? { planId: v.planId } : {}),
      });
      let imageError: string | undefined;
      const file = fileRef.current?.files?.[0];
      if (file) {
        try { await api.upload(`/admin/members/${member.id}/profile-image`, file); } catch (e) { imageError = errorMessage(e); }
      }
      setCreated({ member, imageError });
    } catch (e) {
      if (!applyFieldErrors(e, setFieldError)) setError(errorMessage(e));
    }
  });

  if (created) {
    const m = created.member;
    return (
      <>
        <PageHead title="Member added" />
        <div className="card" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <CheckCircle2 size={40} color="var(--success-fg)" style={{ flex: 'none' }} />
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{m.fullName}</h2>
              <div><span className="gym-id">{m.gymId}</span></div>
              <p style={{ margin: 0 }}>Monthly fee <strong>{money(m.monthlyFee)}</strong> &middot; Joined {fmtDate(m.joinedOn)} &middot; {m.feesCreated} fee record{m.feesCreated === 1 ? '' : 's'} created.</p>
              {m.inviteSent
                ? <Alert kind="success">An invitation was sent. The member can set their own password at <strong>/activate</strong>.</Alert>
                : <Alert kind="warning">The invitation message could not be delivered (or the member has no deliverable contact). Ask the member to open <strong>/activate</strong> and enter their phone or email to set a password.</Alert>}
              {created.imageError && <Alert kind="warning">Member created, but the photo was not saved: {created.imageError}</Alert>}
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Link href={`/admin/members/${m.id}`} className="btn">Open member</Link>
                <Button variant="outline-dark" onClick={() => { setCreated(null); reset(); }}>Add another</Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title="Add Member" subtitle="A unique Gym ID is generated automatically. The member sets their own password." />

      {unlinked.data && unlinked.data.length > 0 && (
        <div className="card">
          <h2 className="card__title" style={{ fontSize: '1.05rem' }}>Self-registered accounts waiting for a membership</h2>
          <p className="text-muted" style={{ marginTop: 0, fontSize: '0.9rem' }}>Pick one to prefill the form. Creating the membership links it to that login.</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {unlinked.data.map((u) => (
              <Button key={u.id} size="sm" variant="outline-dark" onClick={() => { setValue('fullName', u.fullName); setValue('phone', u.phone); setValue('email', u.email ?? ''); }}>
                {u.fullName} &middot; {u.phone}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: 860 }}>
        <form className="form" onSubmit={onSubmit} noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <div className="form-row">
            <TextField label="Full name" required error={errors.fullName?.message} {...register('fullName')} />
            <TextField label="Phone number" type="tel" required hint="e.g. +923001234567" error={errors.phone?.message} {...register('phone')} />
          </div>
          <div className="form-row">
            <TextField label="Email" type="email" hint="Optional. Needed to send the activation code by email." error={errors.email?.message} {...register('email')} />
            <TextField label="Date of joining" type="date" required error={errors.joinedOn?.message} {...register('joinedOn')} />
          </div>
          <div className="form-row">
            <SelectField
              label="Membership plan"
              error={errors.planId?.message}
              {...register('planId', {
                onChange: (e) => {
                  const plan = activePlans.find((p) => p.id === e.target.value);
                  if (plan) setValue('monthlyFee', String(Number(plan.monthlyFee)), { shouldValidate: true });
                },
              })}
            >
              <option value="">No plan</option>
              {activePlans.map((p) => <option key={p.id} value={p.id}>{p.name} - {money(p.monthlyFee)}</option>)}
            </SelectField>
            <TextField label="Monthly membership fee (Rs.)" inputMode="decimal" required error={errors.monthlyFee?.message} {...register('monthlyFee')} />
          </div>
          <div className="form-row">
            <SelectField label="Initial membership status" {...register('status')}>
              <option value="ACTIVE">Active - start monthly billing</option>
              <option value="INACTIVE">Inactive - no fees generated</option>
            </SelectField>
            <div className="field">
              <label htmlFor="photo">Profile image (optional)</label>
              <input id="photo" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" />
              <span className="field__hint">JPEG, PNG or WebP, max 2 MB</span>
            </div>
          </div>
          <Alert kind="info">Billing starts in the month of joining (full month, no proration). A fee record is created for each month up to the current one.</Alert>
          <div><Button type="submit" size="lg" loading={isSubmitting}><UserPlus size={18} /> Create member</Button></div>
        </form>
      </div>
    </>
  );
}

export default function AddMemberPage() {
  return <Suspense><AddMemberForm /></Suspense>;
}
