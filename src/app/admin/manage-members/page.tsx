'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import { DeleteMemberModal, type DeleteTarget } from '@/components/admin/DeleteMemberModal';
import { EditMemberModal } from '@/components/admin/EditMemberModal';
import { Avatar, Button, Empty, ErrorState, PageHead, Pagination, PageLoader, StatusBadge, TableSkeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useDebounced, useFetch } from '@/lib/hooks';
import type { MemberDetail, MemberRow, Plan } from '@/lib/types';

/** One place to edit, change the status of, or delete members. */
export default function ManageMembersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<MemberDetail | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const q = useDebounced(search.trim(), 300);

  const { data, error, loading, reload } = useFetch(
    () => api.list<MemberRow>('/admin/members', { search: q || undefined, status: status || undefined, page, limit: 15 }),
    [q, status, page],
  );
  const plans = useFetch(() => api.get<Plan[]>('/admin/plans'), []);

  // The edit dialog needs the full member record (billing start, summary); load it when "Edit" is clicked.
  const openEdit = async (id: string) => {
    setOpening(id);
    try { setEditing(await api.get<MemberDetail>(`/admin/members/${id}`)); } finally { setOpening(null); }
  };
  const refresh = useCallback(() => { setEditing(null); setDeleting(null); void reload(); }, [reload]);

  return (
    <>
      <PageHead title="Manage Members" subtitle="Edit member details, change membership status, or delete a member." actions={<Link href="/admin/members/new" className="btn"><UserPlus size={18} /> Add member</Link>} />
      <div className="card card--flush">
        <div className="toolbar">
          <div className="search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Search Gym ID, name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search members" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by membership status">
            <option value="">All memberships</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {loading && !data ? <TableSkeleton /> : error || !data ? <ErrorState message={error ?? 'Unknown error'} onRetry={reload} /> : data.items.length === 0 ? (
          <Empty title={q || status ? 'No members match your search' : 'No members yet'}>{q || status ? 'Try a different Gym ID, name or phone number.' : 'Add your first member to get started.'}</Empty>
        ) : (
          <>
            <div className="table-wrap" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
              <table className="table">
                <thead><tr><th>Gym ID</th><th>Member</th><th className="num">Monthly fee</th><th>Membership</th><th>Login</th><th /></tr></thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: "nowrap" }}><strong>{m.gymId}</strong></td>
                      <td>
                        <div className="member-cell">
                          <Avatar name={m.fullName} src={m.profileImageUrl} />
                          <div><Link href={`/admin/members/${m.id}`} className="member-cell__name">{m.fullName}</Link><div className="member-cell__sub">{m.phone}{m.outstanding.count > 0 ? ` · owes ${money(m.outstanding.amount)}` : ""}</div></div>
                        </div>
                      </td>
                      <td className="num">{money(m.monthlyFee)}</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td>{m.accountStatus ? <StatusBadge status={m.accountStatus} /> : <span className="text-muted">-</span>}</td>
                      <td>
                        <div className="actions">
                          <Link href={`/admin/members/${m.id}`} className="btn btn--outline-dark btn--sm" aria-label={`View ${m.fullName}`}><Eye size={14} /> View</Link>
                          <Button size="sm" variant="dark" loading={opening === m.id} onClick={() => openEdit(m.id)} aria-label={`Edit ${m.fullName}`}><Pencil size={14} /> Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleting({ id: m.id, gymId: m.gymId, fullName: m.fullName, status: m.status })} aria-label={`Delete ${m.fullName}`}><Trash2 size={14} /> Delete</Button>
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

      {editing && <EditMemberModal member={editing} plans={(plans.data ?? []).filter((p) => p.isActive || p.id === editing.plan?.id)} onClose={() => setEditing(null)} onDone={refresh} />}
      {deleting && <DeleteMemberModal member={deleting} onClose={() => setDeleting(null)} onDone={refresh} />}
    </>
  );
}
