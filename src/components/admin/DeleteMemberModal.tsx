'use client';

import { useState } from 'react';
import { Trash2, UserX } from 'lucide-react';
import { Alert, Button, Modal, PageLoader, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, errorMessage } from '@/lib/api';
import { money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { MemberDetail } from '@/lib/types';

export interface DeleteTarget { id: string; gymId: string; fullName: string; status: string }

/**
 * Permanent member deletion.
 *  - No payments on record: a simple confirmation.
 *  - Has payment history: deletion is a deliberate act (type the Gym ID), and "Terminate instead" is offered
 *    because terminating keeps the history.
 */
export function DeleteMemberModal({ member, onClose, onDone }: { member: DeleteTarget; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const detail = useFetch(() => api.get<MemberDetail>(`/admin/members/${member.id}`), [member.id]);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState<'delete' | 'terminate' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPayments = (detail.data?.summary.paidCount ?? 0) > 0;
  const gymIdOk = confirm.trim().toUpperCase() === member.gymId.toUpperCase();

  const remove = async () => {
    setBusy('delete'); setError(null);
    try {
      const params = hasPayments ? `?force=true&confirmGymId=${encodeURIComponent(confirm.trim())}` : '';
      await api.delete(`/admin/members/${member.id}${params}`);
      toast(`${member.fullName} (${member.gymId}) was deleted`, 'success');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally { setBusy(null); }
  };

  const terminate = async () => {
    setBusy('terminate'); setError(null);
    try {
      await api.patch(`/admin/members/${member.id}`, { status: 'TERMINATED' });
      toast(`${member.fullName}'s membership was terminated. History is kept.`, 'success');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally { setBusy(null); }
  };

  const d = detail.data;
  return (
    <Modal title="Delete member" onClose={onClose} busy={busy !== null}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy !== null}>Cancel</Button>
          {hasPayments && member.status !== 'TERMINATED' && (
            <Button variant="outline-dark" onClick={terminate} loading={busy === 'terminate'} disabled={busy !== null}><UserX size={16} /> Terminate instead</Button>
          )}
          <Button variant="danger" onClick={remove} loading={busy === 'delete'} disabled={!d || busy !== null || (hasPayments && !gymIdOk)}>
            <Trash2 size={16} /> Delete permanently
          </Button>
        </>
      }>
      <div className="summary">
        <div><span>Member</span><span>{member.fullName}</span></div>
        <div><span>Gym ID</span><span>{member.gymId}</span></div>
        {d && <div><span>Paid months</span><span>{d.summary.paidCount}</span></div>}
        {d && <div><span>Unpaid months</span><span>{d.summary.pendingCount} ({money(d.summary.outstandingAmount)})</span></div>}
      </div>

      {detail.loading && !d ? <PageLoader /> : detail.error ? <Alert kind="error">{detail.error}</Alert> : (
        <>
          <Alert kind="warning">
            This permanently removes the member, their fee records, any payment screenshots and their login. <strong>It cannot be undone.</strong> The Gym ID is never reused.
          </Alert>
          {hasPayments && (
            <>
              <Alert kind="error">
                This member has <strong>{d?.summary.paidCount} paid month{d?.summary.paidCount === 1 ? '' : 's'}</strong> on record. Deleting also erases that payment history.
                To retire the member but keep the history, use <strong>Terminate instead</strong>.
              </Alert>
              <TextField label={`Type ${member.gymId} to confirm`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder={member.gymId} />
            </>
          )}
        </>
      )}
      {error && <Alert kind="error">{error}</Alert>}
    </Modal>
  );
}
