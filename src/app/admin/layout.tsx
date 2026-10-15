'use client';

import { CreditCard, Globe, History, ImageUp, LayoutDashboard, Settings, Tag, UserPlus, Users } from 'lucide-react';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useAutoRefresh, useFetch } from '@/lib/hooks';

interface Notifications { pendingProofs: number; pendingSignups: number }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  // Sidebar counters: screenshots waiting for review and sign-ups waiting for a membership.
  const { data, reload } = useFetch(() => (isAdmin ? api.get<Notifications>('/admin/notifications') : Promise.resolve(null)), [isAdmin]);
  useAutoRefresh(() => { if (isAdmin) void reload(); }, 30_000);

  const nav: NavItem[] = [
    { href: '/admin/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/members', label: 'All Members', icon: <Users size={18} />, group: 'Members', badge: data?.pendingSignups },
    { href: '/admin/members/new', label: 'Add Member', icon: <UserPlus size={18} />, group: 'Members' },
    { href: '/admin/fees', label: 'Monthly Fees', icon: <CreditCard size={18} />, group: 'Monthly Fees' },
    { href: '/admin/payment-proofs', label: 'Payment Screenshots', icon: <ImageUp size={18} />, group: 'Monthly Fees', badge: data?.pendingProofs },
    { href: '/admin/payments', label: 'Payment History', icon: <History size={18} />, group: 'Monthly Fees' },
    { href: '/admin/membership-plans', label: 'Membership Plans', icon: <Tag size={18} />, group: 'Website' },
    { href: '/admin/website-content', label: 'Website Content', icon: <Globe size={18} />, group: 'Website' },
    { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} />, group: 'System' },
  ];

  return <DashboardShell role="ADMIN" nav={nav}>{children}</DashboardShell>;
}
