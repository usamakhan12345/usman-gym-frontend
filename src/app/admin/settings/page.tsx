'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ChangePasswordCard } from '@/components/ChangePasswordCard';
import { Alert, Button, PageHead } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';

export default function AdminSettings() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const generate = async () => {
    setBusy(true); setResult(null);
    try {
      const r = await api.post<{ membershipsChecked: number; feesCreated: number }>('/admin/billing/generate');
      setResult({ kind: 'success', text: `Checked ${r.membershipsChecked} active memberships. Created ${r.feesCreated} missing fee record${r.feesCreated === 1 ? '' : 's'}.` });
    } catch (e) { setResult({ kind: 'error', text: errorMessage(e) }); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Settings" subtitle="Account security and billing tools." />
      <ChangePasswordCard />
      <div className="card" style={{ maxWidth: 560 }}>
        <h2 className="card__title" style={{ fontSize: '1.2rem' }}>Monthly billing</h2>
        <p>New monthly fees are generated automatically every day (and at server start). If the server was offline, use this to create any missing months right now. It is safe to run any number of times and never creates duplicates.</p>
        {result && <div style={{ marginBottom: 'var(--space-4)' }}><Alert kind={result.kind}>{result.text}</Alert></div>}
        <Button variant="dark" loading={busy} onClick={generate}><RefreshCw size={16} /> Generate missing fees</Button>
      </div>
    </>
  );
}
