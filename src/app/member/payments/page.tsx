'use client';

import { UnlinkedNotice } from '@/components/member/parts';
import { Empty, ErrorState, PageHead, PageLoader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { fmtDate, methodLabel, money, monthLabel } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { Payment } from '@/lib/types';

export default function MemberPayments() {
  const { user } = useAuth();
  const unlinked = user?.accountState === 'MEMBER_UNLINKED';
  const { data, error, loading, reload } = useFetch(() => (unlinked ? Promise.resolve(null) : api.get<Payment[]>('/member/payments')), [unlinked]);

  if (unlinked) return <><PageHead title="Payment History" /><UnlinkedNotice /></>;
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  return (
    <>
      <PageHead title="Payment History" subtitle="Payments recorded by the gym admin." />
      <div className="card card--flush">
        {data.length === 0 ? <Empty title="No payments yet">Payments you make to the gym will be listed here once the admin records them.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>For month</th><th>Paid on</th><th className="num">Amount</th><th>Method</th><th>Reference</th></tr></thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{monthLabel(p.billingYear!, p.billingMonth!)}</strong></td>
                    <td>{fmtDate(p.paidOn)}</td>
                    <td className="num">{money(p.amount)}</td>
                    <td>{methodLabel(p.method)}</td>
                    <td>{p.reference ?? '-'}</td>
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
