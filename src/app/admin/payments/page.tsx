'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Empty, ErrorState, PageHead, Pagination, PageLoader, StatusBadge, TableSkeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, methodLabel, money, monthLabel } from '@/lib/format';
import { useDebounced, useFetch } from '@/lib/hooks';
import type { Payment } from '@/lib/types';

export default function AdminPayments() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim(), 300);
  const { data, error, loading, reload } = useFetch(() => api.list<Payment>('/admin/payments', { search: q || undefined, page, limit: 20 }), [q, page]);

  return (
    <>
      <PageHead title="Payment History" subtitle="Every recorded payment, including corrected (voided) entries." />
      <div className="card card--flush">
        <div className="toolbar">
          <div className="search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Search Gym ID, name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search payments by member" />
          </div>
        </div>
        {loading && !data ? <TableSkeleton /> : error || !data ? <ErrorState message={error ?? 'Unknown error'} onRetry={reload} /> : data.items.length === 0 ? <Empty title="No payments found" /> : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Member</th><th>For month</th><th>Paid on</th><th className="num">Amount</th><th>Method / ref.</th><th>Recorded by</th><th>Status</th></tr></thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} style={p.status === 'VOIDED' ? { opacity: 0.65 } : undefined}>
                      <td><Link href={`/admin/members/${p.member!.id}`} className="member-cell__name">{p.member!.fullName}</Link><div className="member-cell__sub">{p.member!.gymId}</div></td>
                      <td>{monthLabel(p.billingYear!, p.billingMonth!)}</td>
                      <td>{fmtDate(p.paidOn)}</td>
                      <td className="num">{money(p.amount)}</td>
                      <td>{methodLabel(p.method)}{p.reference ? ` / ${p.reference}` : ''}</td>
                      <td>{p.recordedBy}<div className="member-cell__sub">{fmtDate(p.createdAt)}</div></td>
                      <td><StatusBadge status={p.status} />{p.voidReason && <div className="member-cell__sub">{p.voidReason}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
