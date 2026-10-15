'use client';

import Link from 'next/link';
import { CircleDollarSign, Clock, UserCheck, UserPlus, Users, Wallet, CheckCircle2 } from 'lucide-react';
import { MonthlyChart } from '@/components/admin/MonthlyChart';
import { PendingSignups } from '@/components/admin/PendingSignups';
import { Alert, Empty, ErrorState, PageHead, PageLoader } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, methodLabel, money, monthLabel } from '@/lib/format';
import { useAutoRefresh, useFetch } from '@/lib/hooks';
import type { Payment } from '@/lib/types';

interface Stats {
  period: { year: number; month: number };
  totalMembers: number; activeMembers: number; newMembersThisMonth: number;
  pendingFeeCount: number; currentMonthPendingCount: number; paidFeeCountThisMonth: number;
  feesCollectedThisMonth: string; totalOutstanding: string;
  pendingSignups: number;
  pendingProofs: number;
  recentPayments: Payment[];
}

export default function AdminDashboard() {
  const { data, error, loading, reload } = useFetch(() => api.get<Stats>('/admin/dashboard/stats'), []);
  useAutoRefresh(() => { void reload(); }, 60_000);

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  const month = monthLabel(data.period.year, data.period.month);

  const cards = [
    { label: 'Total members', value: data.totalMembers, icon: <Users size={20} /> },
    { label: 'Active members', value: data.activeMembers, icon: <UserCheck size={20} /> },
    { label: 'New this month', value: data.newMembersThisMonth, icon: <UserPlus size={20} />, sub: month },
    { label: 'Pending fees', value: data.pendingFeeCount, icon: <Clock size={20} />, sub: `${data.currentMonthPendingCount} for ${month}` },
    { label: 'Sign-ups waiting', value: data.pendingSignups, icon: <UserPlus size={20} />, sub: 'Verified, no membership yet' },
    { label: 'Paid this month', value: data.paidFeeCountThisMonth, icon: <CheckCircle2 size={20} />, sub: `${month} fees` },
  ];

  return (
    <>
      <PageHead title="Dashboard" subtitle={`Overview for ${month}`} actions={<Link href="/admin/members/new" className="btn btn--sm"><UserPlus size={16} /> Add member</Link>} />
      {data.pendingProofs > 0 && (
        <Alert kind="warning">
          <strong>{data.pendingProofs} payment screenshot{data.pendingProofs === 1 ? '' : 's'}</strong> waiting for your review.{' '}
          <Link href="/admin/payment-proofs"><u>Review now</u></Link>
        </Alert>
      )}
      <PendingSignups />
      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat">
            <div className="stat__label">{c.label}{c.icon}</div>
            <div className="stat__value">{c.value}</div>
            {c.sub && <div className="stat__sub">{c.sub}</div>}
          </div>
        ))}
        <div className="stat stat--dark">
          <div className="stat__label">Collected this month<CircleDollarSign size={20} /></div>
          <div className="stat__value">{money(data.feesCollectedThisMonth)}</div>
          <div className="stat__sub">Payments recorded in {month}</div>
        </div>
        <div className="stat stat--dark">
          <div className="stat__label">Total outstanding<Wallet size={20} /></div>
          <div className="stat__value">{money(data.totalOutstanding)}</div>
          <div className="stat__sub">All unpaid months</div>
        </div>
      </div>

      <MonthlyChart />

      <div className="card card--flush">
        <h2 className="card__title" style={{ padding: 'var(--space-5) var(--space-5) 0', fontSize: '1.2rem' }}>Recent payments <Link href="/admin/payments" className="btn btn--ghost btn--sm">View all</Link></h2>
        {data.recentPayments.length === 0 ? <Empty title="No payments yet">Recorded payments will appear here.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Member</th><th>Month</th><th>Paid on</th><th>Method</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {data.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/members/${p.member!.id}`} className="member-cell__name">{p.member!.fullName}</Link><div className="member-cell__sub">{p.member!.gymId}</div></td>
                    <td>{monthLabel(p.billingYear!, p.billingMonth!)}</td>
                    <td>{fmtDate(p.paidOn)}</td>
                    <td>{methodLabel(p.method)}</td>
                    <td className="num">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
