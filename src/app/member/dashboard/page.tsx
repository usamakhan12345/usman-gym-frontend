'use client';

import Link from 'next/link';
import { CalendarClock, Receipt } from 'lucide-react';
import { InactiveNotice, UnlinkedNotice } from '@/components/member/parts';
import { Alert, ErrorState, PageHead, PageLoader, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { fmtDate, methodLabel, money, monthLabel } from '@/lib/format';
import { useAutoRefresh, useFetch } from '@/lib/hooks';
import type { Fee, Payment } from '@/lib/types';

interface Current {
  period: { year: number; month: number };
  currentFee: Fee | null;
  outstanding: { count: number; amount: string };
  lastPayment: Payment | null;
}
interface Profile { gymId: string; fullName: string; monthlyFee: string; plan: string | null; joinedOn: string; status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' }

function Overview() {
  const { user } = useAuth();
  const current = useFetch(() => api.get<Current>('/member/fees/current'), []);
  const profile = useFetch(() => api.get<Profile>('/member/profile'), []);
  useAutoRefresh(() => { void current.reload(); });

  if (current.loading && !current.data) return <PageLoader />;
  if (current.error || !current.data || !profile.data) return <ErrorState message={current.error ?? profile.error ?? 'Unknown error'} onRetry={() => { void current.reload(); void profile.reload(); }} />;

  const { currentFee, outstanding, lastPayment, period } = current.data;
  const p = profile.data;
  const heading = monthLabel(period.year, period.month);

  return (
    <>
      <PageHead title={`Welcome, ${user?.fullName.split(' ')[0]}`} subtitle="Your membership and fee status at a glance." />
      {p.status !== 'ACTIVE' && <InactiveNotice status={p.status} />}

      <div className="fee-hero">
        <div className="fee-hero__row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="fee-hero__month">{heading}</div>
            <div className="fee-hero__amount">{currentFee ? money(currentFee.amount) : money(p.monthlyFee)}</div>
          </div>
          {currentFee ? <StatusBadge status={currentFee.status} /> : <span className="badge badge--inactive">No fee due</span>}
        </div>
        {currentFee?.status === 'PAID' && currentFee.payment && (
          <p style={{ margin: 0, color: 'var(--gray-300)' }}>Paid on <strong>{fmtDate(currentFee.payment.paidOn)}</strong> via {methodLabel(currentFee.payment.method)}. Thank you!</p>
        )}
        {currentFee && currentFee.status !== 'PAID' && (
          <p style={{ margin: 0, color: 'var(--gray-300)' }}>
            {currentFee.status === 'OVERDUE' ? 'This fee is overdue. ' : ''}Please pay your monthly fee to the gym admin.
          </p>
        )}
        {currentFee && currentFee.status !== 'PAID' && (
          <div><Link href="/member/fees" className="btn">Paid online? Upload screenshot</Link></div>
        )}
        {!currentFee && <p style={{ margin: 0, color: 'var(--gray-300)' }}>No fee has been generated for this month.</p>}
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="stat__label">Gym ID</div><div className="stat__value"><span className="gym-id">{p.gymId}</span></div></div>
        <div className="stat"><div className="stat__label">Monthly fee</div><div className="stat__value">{money(p.monthlyFee)}</div><div className="stat__sub">{p.plan ?? 'No plan assigned'}</div></div>
        <div className="stat"><div className="stat__label">Outstanding</div><div className="stat__value">{money(outstanding.amount)}</div><div className="stat__sub">{outstanding.count} unpaid month{outstanding.count === 1 ? '' : 's'}</div></div>
        <div className="stat"><div className="stat__label">Joined</div><div className="stat__value" style={{ fontSize: '1.6rem' }}>{fmtDate(p.joinedOn)}</div></div>
      </div>

      {outstanding.count > 1 && (
        <Alert kind="warning">You have <strong>{outstanding.count} unpaid months</strong> totalling <strong>{money(outstanding.amount)}</strong>. <Link href="/member/fees"><u>See details</u></Link></Alert>
      )}

      <div className="card">
        <h2 className="card__title" style={{ fontSize: '1.2rem' }}><span><Receipt size={18} style={{ verticalAlign: '-3px' }} /> Last payment</span><Link href="/member/payments" className="btn btn--ghost btn--sm">History</Link></h2>
        {lastPayment ? (
          <dl className="kv" style={{ margin: 0 }}>
            <div><dt>For month</dt><dd>{monthLabel(lastPayment.billingYear!, lastPayment.billingMonth!)}</dd></div>
            <div><dt>Amount</dt><dd>{money(lastPayment.amount)}</dd></div>
            <div><dt>Paid on</dt><dd>{fmtDate(lastPayment.paidOn)}</dd></div>
            <div><dt>Method</dt><dd>{methodLabel(lastPayment.method)}</dd></div>
          </dl>
        ) : (
          <p className="text-muted" style={{ margin: 0 }}><CalendarClock size={16} style={{ verticalAlign: '-3px' }} /> No payments recorded yet.</p>
        )}
      </div>
    </>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.accountState === 'MEMBER_UNLINKED') return <><PageHead title="Account Status" /><UnlinkedNotice /></>;
  return <Overview />;
}
