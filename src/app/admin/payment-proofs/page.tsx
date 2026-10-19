'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Eye, Search, X } from 'lucide-react';
import { Alert, Button, Empty, ErrorState, Modal, PageHead, Pagination, PageLoader, SelectField, StatusBadge, TextArea, TextField, TableSkeleton } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, ApiError, errorMessage } from '@/lib/api';
import { fmtDate, methodLabel, money, todayISO } from '@/lib/format';
import { useAutoRefresh, useDebounced, useFetch } from '@/lib/hooks';
import type { PaymentMethod, ProofItem } from '@/lib/types';

const TABS = [
  { key: 'PENDING', label: 'Waiting for review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

function ReviewModal({ proof, onClose, onDone }: { proof: ProofItem; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const pending = proof.status === 'PENDING';
  const [mode, setMode] = useState<'view' | 'reject'>('view');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>(proof.method);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = async () => {
    setBusy(true); setError(null);
    try {
      await api.patch(`/admin/proofs/${proof.id}/approve`, { paymentDate, method });
      toast(`${proof.label} marked as paid for ${proof.member?.fullName}`, 'success');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError && (e.code === 'ALREADY_PAID' || e.code === 'ALREADY_REVIEWED')) onDone();
    } finally { setBusy(false); }
  };

  const reject = async () => {
    if (reason.trim().length < 3) return setError('Please tell the member why it was not accepted.');
    setBusy(true); setError(null);
    try {
      await api.patch(`/admin/proofs/${proof.id}/reject`, { reason: reason.trim() });
      toast('Screenshot rejected. The member was told why.', 'success');
      onDone();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title="Review payment screenshot" onClose={onClose} busy={busy}
      footer={pending ? (
        mode === 'view'
          ? <><Button variant="outline-dark" onClick={() => { setMode('reject'); setError(null); }} disabled={busy}><X size={16} /> Reject</Button><Button onClick={approve} loading={busy}><Check size={16} /> Approve &amp; mark paid</Button></>
          : <><Button variant="ghost" onClick={() => { setMode('view'); setError(null); }} disabled={busy}>Back</Button><Button variant="danger" onClick={reject} loading={busy}>Reject screenshot</Button></>
      ) : <Button variant="dark" onClick={onClose}>Close</Button>}>
      <a href={proof.imageUrl} target="_blank" rel="noopener noreferrer" className="proof-image" title="Open full size">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={proof.imageUrl} alt={`Payment screenshot from ${proof.member?.fullName}`} />
      </a>
      <div className="summary">
        <div><span>Member</span><span>{proof.member?.fullName}</span></div>
        <div><span>Gym ID</span><span>{proof.member?.gymId}</span></div>
        <div><span>Month</span><span>{proof.label}</span></div>
        <div><span>Fee amount</span><span>{money(proof.amount)}</span></div>
        <div><span>Member says they paid by</span><span>{methodLabel(proof.method)}</span></div>
        {proof.reference && <div><span>Reference</span><span>{proof.reference}</span></div>}
        <div><span>Sent</span><span>{fmtDate(proof.createdAt)}</span></div>
      </div>
      {proof.note && <Alert kind="info">Member note: {proof.note}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {!pending && (
        <Alert kind={proof.status === 'APPROVED' ? 'success' : 'error'}>
          {proof.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {proof.reviewedBy ?? 'admin'} on {fmtDate(proof.reviewedAt)}.
          {proof.rejectReason && <> Reason: {proof.rejectReason}</>}
        </Alert>
      )}

      {pending && mode === 'view' && (
        <>
          <div className="form-row">
            <TextField label="Payment date" type="date" max={todayISO()} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            <SelectField label="Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="OTHER">Other / wallet</option>
            </SelectField>
          </div>
          <Alert kind="warning">Check the amount and account on the screenshot first. Approving marks <strong>only {proof.label}</strong> as paid for {proof.member?.fullName}.</Alert>
        </>
      )}
      {pending && mode === 'reject' && (
        <TextArea label="Reason (shown to the member)" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Amount does not match / screenshot is unclear" style={{ minHeight: 80 }} />
      )}
    </Modal>
  );
}

export default function PaymentProofsPage() {
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<ProofItem | null>(null);
  const q = useDebounced(search.trim(), 300);
  const { data, error, loading, reload } = useFetch(
    () => api.list<ProofItem>('/admin/proofs', { status, search: q || undefined, page, limit: 15 }),
    [status, q, page],
  );
  useAutoRefresh(() => { void reload(); }, 30_000);

  return (
    <>
      <PageHead title="Payment Screenshots" subtitle="Members who paid online upload a screenshot here. Check it, then approve or reject." />
      <div className="card card--flush">
        <div className="tabs" role="tablist" style={{ padding: '0 var(--space-4)' }}>
          {TABS.map((t) => (<button key={t.key} role="tab" aria-selected={status === t.key} onClick={() => { setStatus(t.key); setPage(1); }}>{t.label}</button>))}
        </div>
        <div className="toolbar">
          <div className="search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Search Gym ID, name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search screenshots by member" />
          </div>
        </div>
        {loading && !data ? <TableSkeleton /> : error || !data ? <ErrorState message={error ?? 'Unknown error'} onRetry={reload} /> : data.items.length === 0 ? (
          <Empty title={status === 'PENDING' ? 'Nothing waiting for review' : 'No screenshots here'}>{status === 'PENDING' ? 'New screenshots from members will appear here and in your sidebar.' : ''}</Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Screenshot</th><th>Member</th><th>Month</th><th className="num">Amount</th><th>Method / ref.</th><th>Sent</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <button className="thumb" onClick={() => setOpen(p)} aria-label={`Open screenshot from ${p.member?.fullName}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt="" loading="lazy" />
                        </button>
                      </td>
                      <td><Link href={`/admin/members/${p.member!.id}`} className="member-cell__name">{p.member!.fullName}</Link><div className="member-cell__sub">{p.member!.gymId}</div></td>
                      <td><strong>{p.label}</strong></td>
                      <td className="num">{money(p.amount)}</td>
                      <td>{methodLabel(p.method)}{p.reference ? ` / ${p.reference}` : ''}</td>
                      <td>{fmtDate(p.createdAt)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td><div className="actions"><Button size="sm" variant={p.status === 'PENDING' ? 'primary' : 'outline-dark'} onClick={() => setOpen(p)}><Eye size={14} /> {p.status === 'PENDING' ? 'Review' : 'View'}</Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </div>
      {open && <ReviewModal proof={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); void reload(); }} />}
    </>
  );
}
