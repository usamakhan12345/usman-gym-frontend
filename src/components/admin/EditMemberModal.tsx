'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Modal, SelectField, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { moneyField, phoneField } from '@/lib/schemas';
import type { MemberDetail, Plan } from '@/lib/types';

const editSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name'),
  phone: phoneField,
  email: z.string().trim().refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email address'),
  monthlyFee: moneyField,
  applyToCurrentPending: z.boolean(),
  planId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']),
});
type EditForm = z.infer<typeof editSchema>;

/** Admin edit dialog for a member (contact details, plan, fee, status). Locked fields stay admin-only on the server. */
export function EditMemberModal({ member, plans, onClose, onDone }: { member: MemberDetail; plans: Plan[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { fullName: member.fullName, phone: member.phone, email: member.email ?? '', monthlyFee: String(Number(member.monthlyFee)), applyToCurrentPending: false, planId: member.plan?.id ?? '', status: member.status },
  });
  const feeChanged = Number(watch('monthlyFee')) !== Number(member.monthlyFee);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await api.patch(`/admin/members/${member.id}`, {
        fullName: v.fullName, phone: v.phone, email: v.email === '' ? null : v.email,
        planId: v.planId || null, status: v.status,
        ...(feeChanged ? { monthlyFee: v.monthlyFee, applyToCurrentPending: v.applyToCurrentPending } : {}),
      });
      toast('Member updated', 'success');
      onDone();
    } catch (e) {
      if (!applyFieldErrors(e, setFieldError)) setError(errorMessage(e));
    }
  });

  return (
    <Modal title={`Edit ${member.gymId}`} onClose={onClose} busy={isSubmitting}
      footer={<><Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" form="edit-form" loading={isSubmitting}>Save changes</Button></>}>
      <form id="edit-form" className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="Full name" required error={errors.fullName?.message} {...register('fullName')} />
        <div className="form-row">
          <TextField label="Phone" type="tel" required error={errors.phone?.message} {...register('phone')} />
          <TextField label="Email" type="email" error={errors.email?.message} {...register('email')} />
        </div>
        <div className="form-row">
          <SelectField label="Plan" {...register('planId')}><option value="">No plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField>
          <SelectField label="Membership status" {...register('status')} disabled={member.status === 'TERMINATED'}>
            <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="TERMINATED">Terminated</option>
          </SelectField>
        </div>
        <TextField label="Monthly fee (Rs.)" inputMode="decimal" required error={errors.monthlyFee?.message} {...register('monthlyFee')} />
        {feeChanged && (
          <>
            <Alert kind="info">The new fee applies to months generated <strong>from now on</strong>. Past and paid months keep the amount they were billed at.</Alert>
            <label className="check"><input type="checkbox" {...register('applyToCurrentPending')} /> Also re-price this month if it is still unpaid</label>
          </>
        )}
      </form>
    </Modal>
  );
}
