'use client';

import { CreditCard, History, LayoutDashboard, Settings, UserRound } from 'lucide-react';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';

const NAV: NavItem[] = [
  { href: '/member/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { href: '/member/profile', label: 'My Profile', icon: <UserRound size={18} /> },
  { href: '/member/fees', label: 'Monthly Fees', icon: <CreditCard size={18} /> },
  { href: '/member/payments', label: 'Payment History', icon: <History size={18} /> },
  { href: '/member/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="MEMBER" nav={NAV}>{children}</DashboardShell>;
}
