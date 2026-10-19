'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Eye, Search, UserPlus, Wallet } from 'lucide-react';
import { PendingSignups } from '@/components/admin/PendingSignups';
import { MarkPaidModal, type FeeTarget } from '@/components/admin/PaymentModals';
import { Avatar, Button, Empty, ErrorState, PageHead, Pagination, PageLoader, StatusBadge, TableSkeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';
import { useDebounced, useFetch } from '@/lib/hooks';
import type { MemberRow } from '@/lib/types';

export default function AdminMembers() {
  const [search, setSearch] = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState<FeeTarget | null>(null);
  const q = useDebounced(search.trim(), 300);

  const { data, error, loading, reload } = useFetch(
    () => api.list<MemberRow>('/admin/members', { search: q || undefined, feeStatus: feeStatus || undefined, status: status || undefined, page, limit: 15 }),
    [q, feeStatus, status, page],
  );

  const closeAndReload = useCallback(() => { setPaying(null); void reload(); }, [reload]);

  return (
    <>
      <PageHead title="Members" subtitle="Search by Gym ID, name or phone number." actions={<Link href="/admin/members/new" className="btn"><UserPlus size={18} /> Add member</Link>} />
      <PendingSignups />
      <div className="card card--flush">
        <div className="toolbar">
          <div className="search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Search Gym ID, name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search members" />
          </div>
          <select value={feeStatus} onChange={(e) => { setFeeStatus(e.target.value); setPage(1); }} aria-label="Filter by fee status">
            <option value="">All fee statuses</option>
            <option value="PAID">Paid this month</option>
            <option value="PENDING">Pending this month</option>
            <option value="OVERDUE">Has overdue fees</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by membership status">
            <option value="">All memberships</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {loading && !data ? <TableSkeleton /> : error || !data ? <ErrorState message={error ?? 'Unknown error'} onRetry={reload} /> : data.items.length === 0 ? (
          <Empty title={q || feeStatus || status ? 'No members match your search' : 'No members yet'}>
            {q || feeStatus || status ? 'Try a different Gym ID, name or phone number.' : 'Add your first member to start tracking monthly fees.'}
          </Empty>
        ) : (
          <>
            <div className="table-wrap" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
              <table className="table">
                <thead><tr><th>Gym ID</th><th>Member</th><th>Phone</th><th>Joined</th><th className="num">Monthly fee</th><th>This month</th><th className="num">Outstanding</th><th /></tr></thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id}>
                      <td><strong>{m.gymId}</strong></td>
                      <td>
                        <div className="member-cell">
                          <Avatar name={m.fullName} src={m.profileImageUrl} />
                          <div><Link href={`/admin/members/${m.id}`} className="member-cell__name">{m.fullName}</Link><div className="member-cell__sub">{m.status !== 'ACTIVE' ? <StatusBadge status={m.status} /> : m.plan?.name ?? 'No plan'}</div></div>
                        </div>
                      </td>
                      <td>{m.phone}</td>
                      <td>{fmtDate(m.joinedOn)}</td>
                      <td className="num">{money(m.monthlyFee)}</td>
                      <td>{m.currentFee ? <StatusBadge status={m.currentFee.status} /> : <span className="text-muted">-</span>}</td>
                      <td className="num">{m.outstanding.count > 0 ? <strong>{money(m.outstanding.amount)}</strong> : <span className="text-muted">-</span>}<div className="member-cell__sub">{m.outstanding.count > 0 ? `${m.outstanding.count} mo.` : ''}</div></td>
                      <td>
                        <div className="actions">
                          <Link href={`/admin/members/${m.id}`} className="btn btn--outline-dark btn--sm"><Eye size={14} /> View</Link>
                          {m.currentFee && m.currentFee.status !== 'PAID' && (
                            <Button size="sm" onClick={() => setPaying({ id: m.currentFee!.id, label: m.currentFee!.label, amount: m.currentFee!.amount, memberName: m.fullName, gymId: m.gymId })}><Wallet size={14} /> Mark paid</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </div>
      {paying && <MarkPaidModal fee={paying} onClose={() => setPaying(null)} onDone={closeAndReload} />}
    </>
  );
}
