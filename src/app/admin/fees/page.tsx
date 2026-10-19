'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Undo2, Wallet } from 'lucide-react';
import { CorrectPaymentModal, MarkPaidModal, type FeeTarget } from '@/components/admin/PaymentModals';
import { Button, Empty, ErrorState, PageHead, Pagination, PageLoader, StatusBadge, TableSkeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, methodLabel, money } from '@/lib/format';
import { useDebounced, useFetch } from '@/lib/hooks';
import type { Fee } from '@/lib/types';

const TABS = [
  { key: '', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'PAID', label: 'Paid' },
];

export default function AdminFees() {
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState<FeeTarget | null>(null);
  const [correcting, setCorrecting] = useState<FeeTarget | null>(null);
  const q = useDebounced(search.trim(), 300);

  const { data, error, loading, reload } = useFetch(
    () => api.list<Fee>('/admin/fees', { status: status || undefined, search: q || undefined, page, limit: 20 }),
    [status, q, page],
  );
  const done = () => { setPaying(null); setCorrecting(null); void reload(); };
  const target = (f: Fee): FeeTarget => ({
    id: f.id, label: f.label, amount: f.amount, memberName: f.member!.fullName, gymId: f.member!.gymId,
    payment: f.payment ? { paidOn: f.payment.paidOn, method: f.payment.method, reference: f.payment.reference } : null,
  });

  return (
    <>
      <PageHead title="Monthly Fees" subtitle="Every member has a separate record for each billing month." />
      <div className="card card--flush">
        <div className="tabs" role="tablist" style={{ padding: '0 var(--space-4)' }}>
          {TABS.map((t) => (<button key={t.key} role="tab" aria-selected={status === t.key} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</button>))}
        </div>
        <div className="toolbar">
          <div className="search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Search Gym ID, name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search fees by member" />
          </div>
        </div>
        {loading && !data ? <TableSkeleton /> : error || !data ? <ErrorState message={error ?? 'Unknown error'} onRetry={reload} /> : data.items.length === 0 ? (
          <Empty title="No fee records found">{status === 'PENDING' ? 'Nothing is pending right now.' : 'Try another filter or search.'}</Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Month</th><th>Member</th><th className="num">Amount</th><th>Status</th><th>Paid on</th><th>Method</th><th /></tr></thead>
                <tbody>
                  {data.items.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.label}</strong></td>
                      <td><Link href={`/admin/members/${f.member!.id}`} className="member-cell__name">{f.member!.fullName}</Link><div className="member-cell__sub">{f.member!.gymId} &middot; {f.member!.phone}</div></td>
                      <td className="num">{money(f.amount)}</td>
                      <td><StatusBadge status={f.status} /></td>
                      <td>{f.payment ? fmtDate(f.payment.paidOn) : '-'}</td>
                      <td>{f.payment ? methodLabel(f.payment.method) : '-'}</td>
                      <td><div className="actions">
                        {f.status === 'PAID'
                          ? <Button size="sm" variant="outline-dark" onClick={() => setCorrecting(target(f))}><Undo2 size={14} /> Correct</Button>
                          : <Button size="sm" onClick={() => setPaying(target(f))}><Wallet size={14} /> Mark paid</Button>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </div>
      {paying && <MarkPaidModal fee={paying} onClose={() => setPaying(null)} onDone={done} />}
      {correcting && <CorrectPaymentModal fee={correcting} onClose={() => setCorrecting(null)} onDone={done} />}
    </>
  );
}
