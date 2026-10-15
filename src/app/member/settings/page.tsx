'use client';

import { ChangePasswordCard } from '@/components/ChangePasswordCard';
import { PageHead } from '@/components/ui';

export default function MemberSettings() {
  return (
    <>
      <PageHead title="Settings" subtitle="Account security." />
      <ChangePasswordCard />
    </>
  );
}
