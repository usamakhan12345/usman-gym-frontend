'use client';

import Link from 'next/link';
import { Clock, ShieldCheck } from 'lucide-react';
import { Alert, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAutoRefresh } from '@/lib/hooks';
import type { ReactNode } from 'react';

/** Shown instead of portal data for verified accounts that the admin has not linked to a membership yet. */
export function UnlinkedNotice() {
  const { user, refresh } = useAuth();
  // Pick up the admin linking this account to a membership without needing a manual reload.
  useAutoRefresh(() => { void refresh(); }, 15_000);
  return (
    <div className="card" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <ShieldCheck size={40} color="var(--success-fg)" style={{ flex: 'none' }} />
        <div>
          <h2 style={{ fontSize: '1.6rem' }}>Account verified</h2>
          <p>Welcome, <strong>{user?.fullName}</strong>. Your login is ready, but it is not linked to a gym membership yet.</p>
          <Alert kind="warning">
            <strong>Membership pending.</strong> Please visit the gym or call the admin and share the phone number or email you signed up with. Once the admin registers your membership, your Gym ID and monthly fee status will appear here automatically.
          </Alert>
          <p style={{ marginTop: 'var(--space-4)' }}><Link href="/contact" className="btn btn--dark btn--sm">Contact the gym</Link></p>
        </div>
      </div>
    </div>
  );
}

export function InactiveNotice({ status }: { status: string }) {
  return (
    <Alert kind="warning">
      <Clock size={0} /> Your membership is currently <strong>{status.toLowerCase()}</strong>. New monthly fees are not generated while it is not active. Contact the gym admin to reactivate.
    </Alert>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (<div><dt>{label}</dt><dd>{children}</dd></div>);
}

export { Button };
