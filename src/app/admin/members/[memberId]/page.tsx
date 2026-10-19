'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Pencil, Phone, Trash2, Undo2, Wallet } from 'lucide-react';
import { z } from 'zod';
import { DeleteMemberModal } from '@/components/admin/DeleteMemberModal';
import { EditMemberModal } from '@/components/admin/EditMemberModal';
import { CorrectPaymentModal, MarkPaidModal, type FeeTarget } from '@/components/admin/PaymentModals';
import { Alert, Avatar, Button, Empty, ErrorState, Modal, PageLoader, SelectField, StatusBadge, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { fmtDate, methodLabel, money, monthLabel } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { moneyField, phoneField } from '@/lib/schemas';
import type { Fee, MemberDetail, Payment, Plan } from '@/lib/types';

export default function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { toast } = useToast();
  const member = useFetch(() => api.get<MemberDetail>(`/admin/members/${memberId}`), [memberId]);
  const fees = useFetch(() => api.get<Fee[]>(`/admin/members/${memberId}/fees`), [memberId]);
  const payments = useFetch(() => api.get<Payment[]>(`/admin/members/${memberId}/payments`), [memberId]);
  const plans = useFetch(() => api.get<Plan[]>('/admin/plans'), []);
  const [tab, setTab] = useState<'fees' | 'payments'>('fees');
  const [paying, setPaying] = useState<FeeTarget | null>(null);
  const [correcting, setCorrecting] = useState<FeeTarget | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const [inviting, setInviting] = useState(false);

  const refreshAll = () => { setPaying(null); setCorrecting(null); setEditing(false); void member.reload(); void fees.reload(); void payments.reload(); };

  if (member.loading && !member.data) return <PageLoader />;
  if (member.error || !member.data) return <ErrorState message={member.error ?? 'Member not found'} onRetry={member.reload} />;
  const m = member.data;

  const target = (f: Fee): FeeTarget => ({
    id: f.id, label: f.label, amount: f.amount, memberName: m.fullName, gymId: m.gymId,
    payment: f.payment ? { paidOn: f.payment.paidOn, method: f.payment.method, reference: f.payment.reference } : null,
  });

  const resendInvite = async () => {
    setInviting(true);
    try {
      const r = await api.post<{ inviteSent: boolean }>(`/admin/members/${m.id}/resend-invite`);
      toast(r.inviteSent ? 'Invitation sent' : 'Could not deliver the invitation', r.inviteSent ? 'success' : 'error');
    } catch (e) { toast(errorMessage(e), 'error'); } finally { setInviting(false); }
  };

  return (
    <>
      <div><Link href="/admin/members" className="btn btn--ghost btn--sm"><ArrowLeft size={16} /> All members</Link></div>

      <div className="card" style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Avatar large name={m.fullName} src={m.profileImageUrl} />
        <div style={{ flex: '1 1 260px' }}>
          <h1 style={{ fontSize: '2rem', margin: '0 0 var(--space-2)' }}>{m.fullName}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="gym-id">{m.gymId}</span><StatusBadge status={m.status} />
            {m.accountStatus === 'INVITED' && <StatusBadge status="INVITED" />}
          </div>
          <p className="text-muted" style={{ margin: 'var(--space-3) 0 0', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Phone size={14} /> {m.phone}</span>
            {m.email && <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Mail size={14} /> {m.email}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {m.accountStatus === 'INVITED' && <Button variant="outline-dark" size="sm" loading={inviting} onClick={resendInvite}>Resend invite</Button>}
          <Button variant="dark" size="sm" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleting(true)}><Trash2 size={14} /> Delete</Button>
        </div>
      </div>

      {m.accountStatus === 'INVITED' && <Alert kind="info">This member has not activated their account yet. They can do so at <strong>/activate</strong>.</Alert>}

      <div className="stat-grid">
        <div className="stat"><div className="stat__label">Monthly fee</div><div className="stat__value">{money(m.monthlyFee)}</div><div className="stat__sub">{m.plan?.name ?? 'No plan'}</div></div>
        <div className="stat"><div className="stat__label">Outstanding</div><div className="stat__value">{money(m.summary.outstandingAmount)}</div><div className="stat__sub">{m.summary.pendingCount} unpaid month{m.summary.pendingCount === 1 ? '' : 's'}</div></div>
        <div className="stat"><div className="stat__label">Paid months</div><div className="stat__value">{m.summary.paidCount}</div></div>
        <div className="stat"><div className="stat__label">Joined</div><div className="stat__value" style={{ fontSize: '1.5rem' }}>{fmtDate(m.joinedOn)}</div><div className="stat__sub">Billing from {fmtDate(m.billingStartsOn)}</div></div>
      </div>

      <div className="card card--flush">
        <div className="tabs" role="tablist" style={{ padding: '0 var(--space-4)' }}>
          <button role="tab" aria-selected={tab === 'fees'} onClick={() => setTab('fees')}>Monthly fees</button>
          <button role="tab" aria-selected={tab === 'payments'} onClick={() => setTab('payments')}>Payment history</button>
        </div>

        {tab === 'fees' ? (
          fees.loading && !fees.data ? <PageLoader /> : fees.error || !fees.data ? <ErrorState message={fees.error ?? ''} onRetry={fees.reload} /> :
          fees.data.length === 0 ? <Empty title="No fee records">No fees have been generated (inactive membership or billing has not started).</Empty> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Month</th><th className="num">Amount</th><th>Status</th><th>Paid on</th><th>Method / ref.</th><th /></tr></thead>
                <tbody>
                  {fees.data.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.label}</strong></td>
                      <td className="num">{money(f.amount)}</td>
                      <td><StatusBadge status={f.status} /></td>
                      <td>{f.payment ? fmtDate(f.payment.paidOn) : '-'}</td>
                      <td>{f.payment ? <>{methodLabel(f.payment.method)}{f.payment.reference ? ` / ${f.payment.reference}` : ''}</> : '-'}</td>
                      <td>
                        <div className="actions">
                          {f.status === 'PAID'
                            ? <Button size="sm" variant="outline-dark" onClick={() => setCorrecting(target(f))}><Undo2 size={14} /> Correct</Button>
                            : <Button size="sm" onClick={() => setPaying(target(f))}><Wallet size={14} /> Mark paid</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : payments.loading && !payments.data ? <PageLoader /> : payments.error || !payments.data ? <ErrorState message={payments.error ?? ''} onRetry={payments.reload} /> :
          payments.data.length === 0 ? <Empty title="No payments recorded" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>For month</th><th>Paid on</th><th className="num">Amount</th><th>Method / ref.</th><th>Recorded by</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.data.map((p) => (
                    <tr key={p.id} style={p.status === 'VOIDED' ? { opacity: 0.65 } : undefined}>
                      <td><strong>{monthLabel(p.billingYear!, p.billingMonth!)}</strong></td>
                      <td>{fmtDate(p.paidOn)}</td>
                      <td className="num">{money(p.amount)}</td>
                      <td>{methodLabel(p.method)}{p.reference ? ` / ${p.reference}` : ''}{p.note && <div className="member-cell__sub">{p.note}</div>}</td>
                      <td>{p.recordedBy}<div className="member-cell__sub">{fmtDate(p.createdAt)}</div></td>
                      <td><StatusBadge status={p.status} />{p.voidReason && <div className="member-cell__sub">{p.voidReason}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {paying && <MarkPaidModal fee={paying} onClose={() => setPaying(null)} onDone={refreshAll} />}
      {correcting && <CorrectPaymentModal fee={correcting} onClose={() => setCorrecting(null)} onDone={refreshAll} />}
      {deleting && <DeleteMemberModal member={{ id: m.id, gymId: m.gymId, fullName: m.fullName, status: m.status }} onClose={() => setDeleting(false)} onDone={() => router.replace('/admin/manage-members')} />}
      {editing && <EditMemberModal member={m} plans={(plans.data ?? []).filter((p) => p.isActive || p.id === m.plan?.id)} onClose={() => setEditing(false)} onDone={refreshAll} />}
    </>
  );
}
