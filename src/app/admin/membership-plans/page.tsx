'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Alert, Button, Empty, ErrorState, Modal, PageHead, PageLoader, StatusBadge, TextArea, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { moneyField } from '@/lib/schemas';
import type { Plan } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a plan name'),
  description: z.string().trim().max(500),
  monthlyFee: moneyField,
  features: z.string(),
  sortOrder: z.coerce.number().int().min(0),
  isPublic: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

function PlanModal({ plan, onClose, onDone }: { plan: Plan | null; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setFieldError, formState: { errors, isSubmitting } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: plan
      ? { name: plan.name, description: plan.description, monthlyFee: String(Number(plan.monthlyFee)), features: plan.features.join('\n'), sortOrder: plan.sortOrder, isPublic: plan.isPublic, isActive: plan.isActive, isFeatured: plan.isFeatured }
      : { name: '', description: '', monthlyFee: '', features: '', sortOrder: 0, isPublic: true, isActive: true, isFeatured: false },
  });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const body = { ...v, features: v.features.split('\n').map((s) => s.trim()).filter(Boolean) };
    try {
      if (plan) await api.patch(`/admin/plans/${plan.id}`, body); else await api.post('/admin/plans', body);
      toast(plan ? 'Plan updated' : 'Plan created', 'success');
      onDone();
    } catch (e) {
      if (!applyFieldErrors(e, setFieldError)) setError(errorMessage(e));
    }
  });

  return (
    <Modal title={plan ? 'Edit plan' : 'New plan'} onClose={onClose} busy={isSubmitting}
      footer={<><Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" form="plan-form" loading={isSubmitting}>Save plan</Button></>}>
      <form id="plan-form" className="form" onSubmit={onSubmit} noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <div className="form-row">
          <TextField label="Plan name" required error={errors.name?.message} {...register('name')} />
          <TextField label="Monthly fee (Rs.)" inputMode="decimal" required error={errors.monthlyFee?.message} {...register('monthlyFee')} />
        </div>
        <TextArea label="Short description" style={{ minHeight: 70 }} error={errors.description?.message} {...register('description')} />
        <TextArea label="Features (one per line)" style={{ minHeight: 110 }} {...register('features')} />
        <TextField label="Display order" type="number" min={0} {...register('sortOrder')} />
        <label className="check"><input type="checkbox" {...register('isPublic')} /> Show on the public Membership page</label>
        <label className="check"><input type="checkbox" {...register('isFeatured')} /> Highlight as &ldquo;Most popular&rdquo;</label>
        <label className="check"><input type="checkbox" {...register('isActive')} /> Active (can be assigned to members)</label>
        <Alert kind="info">Changing a plan&apos;s price here only changes what is displayed and prefilled for new members. It never changes any member&apos;s fee or past fee records.</Alert>
      </form>
    </Modal>
  );
}

export default function AdminPlans() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useFetch(() => api.get<Plan[]>('/admin/plans'), []);
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);

  const remove = async (p: Plan) => {
    if (!confirm(`Delete "${p.name}"? Plans assigned to members are archived instead.`)) return;
    try {
      const r = await api.delete<{ archived: boolean }>(`/admin/plans/${p.id}`);
      toast(r.archived ? 'Plan is in use, so it was archived' : 'Plan deleted', 'success');
      void reload();
    } catch (e) { toast(errorMessage(e), 'error'); }
  };

  return (
    <>
      <PageHead title="Membership Plans" subtitle="Plans shown on the public website and offered when adding members." actions={<Button onClick={() => setEditing('new')}><Plus size={18} /> New plan</Button>} />
      <div className="card card--flush">
        {loading && !data ? <PageLoader /> : error || !data ? <ErrorState message={error ?? ''} onRetry={reload} /> : data.length === 0 ? <Empty title="No plans yet">Create a plan to show pricing on the website.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Plan</th><th className="num">Monthly fee</th><th>Visibility</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong>{p.isFeatured && ' ★'}<div className="member-cell__sub">{p.features.length} feature{p.features.length === 1 ? '' : 's'}</div></td>
                    <td className="num">{money(p.monthlyFee)}</td>
                    <td>{p.isPublic ? 'Public' : 'Hidden'}</td>
                    <td><StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td><div className="actions">
                      <Button size="sm" variant="outline-dark" onClick={() => setEditing(p)}><Pencil size={14} /> Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && <PlanModal plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void reload(); }} />}
    </>
  );
}
