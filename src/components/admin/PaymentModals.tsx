'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Modal, SelectField, TextArea, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, ApiError, errorMessage } from '@/lib/api';
import { methodLabel, money, todayISO, fmtDate } from '@/lib/format';
import { markPaidSchema } from '@/lib/schemas';

export interface FeeTarget {
  id: string;
  label: string; // "October 2026"
  amount: string;
  memberName: string;
  gymId: string;
  payment?: { paidOn: string; method: string; reference: string | null } | null;
}

type Form = z.infer<typeof markPaidSchema>;
const defaults = (): Form => ({ paymentDate: todayISO(), method: 'CASH', reference: '', note: '' });

const MethodSelect = ({ error, ...reg }: { error?: string } & Record<string, unknown>) => (
  <SelectField label="Payment method" required error={error} {...reg}>
    <option value="CASH">Cash</option>
    <option value="BANK_TRANSFER">Bank transfer</option>
    <option value="OTHER">Other</option>
  </SelectField>
);

function Summary({ fee }: { fee: FeeTarget }) {
  return (
    <div className="summary">
      <div><span>Member</span><span>{fee.memberName}</span></div>
      <div><span>Gym ID</span><span>{fee.gymId}</span></div>
      <div><span>Billing month</span><span>{fee.label}</span></div>
      <div><span>Fee amount</span><span>{money(fee.amount)}</span></div>
    </div>
  );
}

/** Confirmation dialog that names the member and month so the wrong record is never paid by accident. */
export function MarkPaidModal({ fee, onClose, onDone }: { fee: FeeTarget; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  // One key per opened dialog: a double click or retry can never record two payments.
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(markPaidSchema), defaultValues: defaults() });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await api.patch(`/admin/fees/${fee.id}/mark-paid`, {
        paymentDate: v.paymentDate, method: v.method, idempotencyKey,
        ...(v.reference ? { reference: v.reference } : {}), ...(v.note ? { note: v.note } : {}),
      });
      toast(`${fee.label} marked as paid for ${fee.memberName}`, 'success');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError && e.code === 'ALREADY_PAID') onDone(); // refresh stale list behind the dialog
    }
  });

  return (
    <Modal title="Mark fee as paid" onClose={onClose} busy={isSubmitting}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="mark-paid-form" loading={isSubmitting}>Confirm payment</Button>
      </>}>
      <Summary fee={fee} />
      <form id="mark-paid-form" className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <div className="form-row">
          <TextField label="Payment date" type="date" max={todayISO()} required error={errors.paymentDate?.message} {...register('paymentDate')} />
          <MethodSelect error={errors.method?.message} {...register('method')} />
        </div>
        <TextField label="Reference / transaction no. (optional)" error={errors.reference?.message} {...register('reference')} />
        <TextArea label="Note (optional)" style={{ minHeight: 70 }} error={errors.note?.message} {...register('note')} />
        <Alert kind="info">Only <strong>{fee.label}</strong> will be marked as paid. Other months are not affected.</Alert>
      </form>
    </Modal>
  );
}

const correctSchema = z.object({
  reason: z.string().trim().min(3, 'Please give a reason'),
  mode: z.enum(['VOID', 'REPLACE']),
  paymentDate: z.string(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'OTHER']),
  reference: z.string().optional(),
});
type CorrectForm = z.infer<typeof correctSchema>;

/** Corrects a mistaken payment. History is kept: the old payment is voided, never deleted. */
export function CorrectPaymentModal({ fee, onClose, onDone }: { fee: FeeTarget; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CorrectForm>({
    resolver: zodResolver(correctSchema),
    defaultValues: { mode: 'VOID', reason: '', paymentDate: fee.payment?.paidOn ?? todayISO(), method: (fee.payment?.method as CorrectForm['method']) ?? 'CASH', reference: fee.payment?.reference ?? '' },
  });
  const mode = watch('mode');

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await api.patch(`/admin/fees/${fee.id}/correct-payment`, {
        reason: v.reason,
        ...(v.mode === 'REPLACE' ? { replacement: { paymentDate: v.paymentDate, method: v.method, ...(v.reference ? { reference: v.reference } : {}) } } : {}),
      });
      toast(v.mode === 'VOID' ? `Payment voided; ${fee.label} is unpaid again` : 'Payment corrected', 'success');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <Modal title="Correct payment" onClose={onClose} busy={isSubmitting}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" form="correct-form" variant="danger" loading={isSubmitting}>{mode === 'VOID' ? 'Void payment' : 'Save correction'}</Button>
      </>}>
      <Summary fee={fee} />
      {fee.payment && <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Current record: paid {fmtDate(fee.payment.paidOn)} via {methodLabel(fee.payment.method)}{fee.payment.reference ? ` (${fee.payment.reference})` : ''}.</p>}
      <form id="correct-form" className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <SelectField label="What do you want to do?" {...register('mode')}>
          <option value="VOID">Void this payment (mark the month unpaid again)</option>
          <option value="REPLACE">Replace with corrected payment details</option>
        </SelectField>
        {mode === 'REPLACE' && (
          <div className="form-row">
            <TextField label="Payment date" type="date" max={todayISO()} {...register('paymentDate')} />
            <SelectField label="Method" {...register('method')}><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option></SelectField>
          </div>
        )}
        {mode === 'REPLACE' && <TextField label="Reference (optional)" {...register('reference')} />}
        <TextArea label="Reason for correction" required style={{ minHeight: 70 }} error={errors.reason?.message} {...register('reason')} />
        <Alert kind="warning">The original payment stays in the audit history, marked as voided, with your name and the reason.</Alert>
      </form>
    </Modal>
  );
}
