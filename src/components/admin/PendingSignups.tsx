'use client';

import Link from 'next/link';
import { UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { useFetch } from '@/lib/hooks';

export interface Unlinked { id: string; fullName: string; email: string | null; phone: string; status: string; createdAt: string }

/**
 * Verified website sign-ups that have a login but no gym membership yet.
 * Creating the membership (Add Member) is what links the login and approves the person.
 */
export function PendingSignups() {
  const { data } = useFetch(() => api.get<Unlinked[]>('/admin/members/unlinked-users'), []);
  const waiting = (data ?? []).filter((u) => u.status === 'ACTIVE');
  if (waiting.length === 0) return null;

  return (
    <div className="card card--flush" style={{ borderColor: 'var(--yellow-500)', borderWidth: 2 }}>
      <h2 className="card__title" style={{ padding: 'var(--space-4) var(--space-5) 0', fontSize: '1.15rem' }}>
        <span><UserCheck size={18} style={{ verticalAlign: '-3px' }} /> Sign-ups waiting for a membership ({waiting.length})</span>
      </h2>
      <p className="text-muted" style={{ margin: '0 var(--space-5) var(--space-3)', fontSize: '0.9rem' }}>
        These people verified their account on the website but are not linked to a membership, so they see a &ldquo;membership pending&rdquo; screen. Create their membership to activate them.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Signed up</th><th /></tr></thead>
          <tbody>
            {waiting.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.fullName}</strong></td>
                <td>{u.phone}</td>
                <td>{u.email ?? '-'}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td><div className="actions"><Link href={`/admin/members/new?signup=${u.id}`} className="btn btn--sm">Create membership</Link></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
