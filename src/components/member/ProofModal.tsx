'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageUp } from 'lucide-react';
import { Alert, Button, Modal, SelectField, TextArea, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, errorMessage } from '@/lib/api';
import { money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';

const MAX_MB = 5;

export interface ProofFeeTarget { id: string; label: string; amount: string }

/** Member uploads a screenshot of an online/bank payment. It does not mark anything paid: the admin reviews it first. */
export function ProofModal({ fee, onClose, onDone }: { fee: ProofFeeTarget; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const info = useFetch(() => api.get<{ instructions: string }>('/member/payment-info'), []);
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'OTHER'>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setError('Please choose a JPEG, PNG or WebP screenshot.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`The screenshot must be smaller than ${MAX_MB} MB.`);
    setFile(f);
  };

  const submit = async () => {
    if (!file) return setError('Please attach a screenshot of your payment.');
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      form.append('method', method);
      if (reference.trim()) form.append('reference', reference.trim());
      if (note.trim()) form.append('note', note.trim());
      form.append('image', file);
      await api.postForm(`/member/fees/${fee.id}/proof`, form);
      toast('Screenshot sent. The gym will review it soon.', 'success');
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Upload payment screenshot" onClose={onClose} busy={busy}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} loading={busy}>Send to gym</Button></>}>
      <div className="summary">
        <div><span>Month</span><span>{fee.label}</span></div>
        <div><span>Amount to pay</span><span>{money(fee.amount)}</span></div>
      </div>
      {info.data?.instructions && <Alert kind="info"><strong>How to pay:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{info.data.instructions}</span></Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      <div className="field">
        <label htmlFor="proof-file">Screenshot of your payment<span className="field__req" aria-hidden>*</span></label>
        <input id="proof-file" ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="dropzone" onClick={() => input.current?.click()} aria-label="Choose screenshot">
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="Screenshot preview" />
            : <><ImageUp size={32} /><span>Tap to choose a screenshot</span><small>JPEG, PNG or WebP, up to {MAX_MB} MB</small></>}
        </button>
        {file && <span className="field__hint">{file.name} &middot; <button type="button" className="link-btn" onClick={() => input.current?.click()}>change</button></span>}
      </div>

      <SelectField label="How did you pay?" value={method} onChange={(e) => setMethod(e.target.value as 'BANK_TRANSFER' | 'OTHER')}>
        <option value="BANK_TRANSFER">Bank transfer</option>
        <option value="OTHER">Mobile wallet / other</option>
      </SelectField>
      <TextField label="Transaction / reference no. (optional)" value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} />
      <TextArea label="Note (optional)" style={{ minHeight: 70 }} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      <Alert kind="warning">Your fee stays <strong>unpaid</strong> until the gym admin checks the screenshot and confirms it.</Alert>
    </Modal>
  );
}
