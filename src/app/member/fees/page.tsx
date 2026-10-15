'use client';

import { useState } from 'react';
import { ImageUp } from 'lucide-react';
import { UnlinkedNotice } from '@/components/member/parts';
import { ProofModal, type ProofFeeTarget } from '@/components/member/ProofModal';
import { Alert, Button, Empty, ErrorState, PageHead, PageLoader, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { fmtDate, methodLabel, money } from '@/lib/format';
import { useAutoRefresh, useFetch } from '@/lib/hooks';
import type { Fee } from '@/lib/types';

interface FeesRes { fees: Fee[]; outstanding: { count: number; amount: string } }

function ProofCell({ fee, onUpload }: { fee: Fee; onUpload: (f: Fee) => void }) {
  if (fee.status === 'PAID') return <span className="text-muted">-</span>;
  const proof = fee.proof;
  if (proof?.status === 'PENDING') return <span className="badge badge--pending">Under review</span>;
  return (
    <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
      {proof?.status === 'REJECTED' && (
        <span className="member-cell__sub" style={{ color: 'var(--danger-fg)' }}>Not accepted: {proof.rejectReason}</span>
      )}
      <Button size="sm" variant={proof?.status === 'REJECTED' ? 'danger' : 'primary'} onClick={() => onUpload(fee)}>
        <ImageUp size={14} /> {proof?.status === 'REJECTED' ? 'Upload again' : 'Upload screenshot'}
      </Button>
    </div>
  );
}

export default function MemberFees() {
  const { user } = useAuth();
  const unlinked = user?.accountState === 'MEMBER_UNLINKED';
  const { data, error, loading, reload } = useFetch(() => (unlinked ? Promise.resolve(null) : api.get<FeesRes>('/member/fees')), [unlinked]);
  useAutoRefresh(() => { if (!unlinked) void reload(); });
  const [uploading, setUploading] = useState<ProofFeeTarget | null>(null);

  if (unlinked) return <><PageHead title="Monthly Fees" /><UnlinkedNotice /></>;
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const waiting = data.fees.filter((f) => f.proof?.status === 'PENDING').length;

  return (
    <>
      <PageHead title="Monthly Fees" subtitle="Every billing month is tracked separately. Paid online? Upload your screenshot below." />
      {data.outstanding.count > 0
        ? <Alert kind="warning">Outstanding: <strong>{money(data.outstanding.amount)}</strong> across {data.outstanding.count} month{data.outstanding.count === 1 ? '' : 's'}. Pay the gym, or pay online and upload the screenshot.</Alert>
        : <Alert kind="success">You are all caught up. No outstanding fees.</Alert>}
      {waiting > 0 && <Alert kind="info">{waiting} screenshot{waiting === 1 ? ' is' : 's are'} waiting for the gym to review. Your status updates as soon as it is confirmed.</Alert>}
      <div className="card card--flush">
        {data.fees.length === 0 ? <Empty title="No fee records yet">Fees appear here once billing starts for your membership.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Month</th><th className="num">Amount</th><th>Status</th><th>Paid on</th><th>Method</th><th>Online payment</th></tr></thead>
              <tbody>
                {data.fees.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.label}</strong></td>
                    <td className="num">{money(f.amount)}</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td>{f.payment ? fmtDate(f.payment.paidOn) : '-'}</td>
                    <td>{f.payment ? methodLabel(f.payment.method) : '-'}</td>
                    <td><ProofCell fee={f} onUpload={(x) => setUploading({ id: x.id, label: x.label, amount: x.amount })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {uploading && <ProofModal fee={uploading} onClose={() => setUploading(null)} onDone={() => { setUploading(null); void reload(); }} />}
    </>
  );
}
