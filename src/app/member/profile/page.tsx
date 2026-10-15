'use client';

import { useRef, useState } from 'react';
import { Camera, Lock } from 'lucide-react';
import { UnlinkedNotice } from '@/components/member/parts';
import { Alert, Avatar, Button, ErrorState, PageHead, PageLoader, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, errorMessage } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';

interface Profile {
  gymId: string; fullName: string; phone: string; email: string | null; joinedOn: string;
  monthlyFee: string; plan: string | null; status: string; profileImageUrl: string | null;
}

const MAX_MB = 2;

export default function MemberProfile() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const unlinked = user?.accountState === 'MEMBER_UNLINKED';
  const { data, error, loading, reload } = useFetch(() => (unlinked ? Promise.resolve(null) : api.get<Profile>('/member/profile')), [unlinked]);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (unlinked) return <><PageHead title="My Profile" /><UnlinkedNotice /></>;
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setFormError('Please choose a JPEG, PNG or WebP image.');
    if (file.size > MAX_MB * 1024 * 1024) return setFormError(`Image must be smaller than ${MAX_MB} MB.`);
    setUploading(true);
    try {
      await api.upload('/member/profile-image', file);
      await Promise.all([reload(), refresh()]);
      toast('Profile picture updated', 'success');
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <>
      <PageHead title="My Profile" subtitle="Your membership details." />
      <div className="card" style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar large name={data.fullName} src={data.profileImageUrl} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{data.fullName}</h2>
            <span className="gym-id">{data.gymId}</span>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} aria-label="Choose profile picture" />
              <Button variant="dark" size="sm" loading={uploading} onClick={() => input.current?.click()}><Camera size={16} /> Change picture</Button>
              <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: 'var(--space-3)' }}>JPEG, PNG or WebP, max {MAX_MB} MB</span>
            </div>
          </div>
        </div>
        {formError && <Alert kind="error">{formError}</Alert>}
      </div>

      <div className="card">
        <h2 className="card__title" style={{ fontSize: '1.2rem' }}>Membership details <span className="text-muted" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', textTransform: 'none', fontWeight: 500 }}><Lock size={14} style={{ verticalAlign: '-2px' }} /> read-only</span></h2>
        <dl className="kv" style={{ margin: 0 }}>
          <div><dt>Gym ID</dt><dd>{data.gymId}</dd></div>
          <div><dt>Full name</dt><dd>{data.fullName}</dd></div>
          <div><dt>Phone</dt><dd>{data.phone}</dd></div>
          <div><dt>Email</dt><dd>{data.email ?? '-'}</dd></div>
          <div><dt>Date of joining</dt><dd>{fmtDate(data.joinedOn)}</dd></div>
          <div><dt>Membership plan</dt><dd>{data.plan ?? '-'}</dd></div>
          <div><dt>Monthly fee</dt><dd>{money(data.monthlyFee)}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={data.status} /></dd></div>
        </dl>
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Alert kind="info">These details are managed by the gym. To correct anything, please contact the admin.</Alert>
        </div>
      </div>
    </>
  );
}
