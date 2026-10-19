'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { homeFor, useAuth } from '@/context/AuthContext';
import { Avatar, FullPageLoader } from '@/components/ui';
import { InstallApp } from '@/components/pwa/InstallApp';
import type { Role } from '@/lib/types';
import { Brand } from './shared';

export interface NavItem { href: string; label: string; icon: React.ReactNode; group?: string; badge?: number }

/**
 * Client-side route guard + responsive sidebar layout. This only improves UX:
 * every API call is independently authorised by the backend.
 */
export function DashboardShell({ role, nav, children }: { role: Role; nav: NavItem[]; children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  // On phones tables render as stacked cards (see _responsive.scss). Each cell needs its column title as a label,
  // so copy the <th> text onto the matching <td> now and whenever the content changes.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const label = () => {
      root.querySelectorAll('table.table').forEach((table) => {
        const heads = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');
        table.querySelectorAll('tbody tr').forEach((tr) => {
          Array.from(tr.children).forEach((td, i) => {
            const text = heads[i] ?? '';
            if (td.getAttribute('data-label') !== text) td.setAttribute('data-label', text);
          });
        });
      });
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
    // The content area only exists once the session has loaded, so re-run then.
  }, [loading, user]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (user.role !== role) router.replace(homeFor(user));
  }, [user, loading, role, router, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user || user.role !== role) return <FullPageLoader label={loading ? 'Loading' : 'Redirecting'} />;

  // The most specific matching nav entry wins (so /admin/members/new does not also highlight /admin/members).
  const best = nav
    .filter((n) => pathname === n.href || pathname.startsWith(n.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (href: string) => href === best;
  let lastGroup: string | undefined;

  return (
    <div className="shell">
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`} aria-label="Sidebar">
        <div className="sidebar__brand">
          <Brand href="/" />
          <button className="sidebar__close" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav aria-label={role === 'ADMIN' ? 'Admin' : 'Member'}>
          {nav.map((item) => {
            const header = item.group && item.group !== lastGroup ? <div className="sidebar__group">{item.group}</div> : null;
            lastGroup = item.group;
            return (
              <div key={item.href}>
                {header}
                <Link href={item.href} className={`sidebar__link${isActive(item.href) ? ' sidebar__link--active' : ''}`} aria-current={isActive(item.href) ? 'page' : undefined}>
                  {item.icon}{item.label}
                  {item.badge ? <span className="sidebar__badge" aria-label={`${item.badge} waiting`}>{item.badge}</span> : null}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="sidebar__foot">
          <InstallApp variant="primary" size="md" block label="Install app" />
          <Link href="/" className="sidebar__link">Back to website</Link>
          <button className="sidebar__link" style={{ background: 'none', border: 0, width: '100%', color: 'inherit', textAlign: 'left' }} onClick={async () => { await logout(); router.replace('/login'); }}>
            <LogOut size={18} />Log out
          </button>
        </div>
      </aside>
      <div className="shell__main">
        <header className="shell__topbar">
          <button className="shell__menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>{role === 'ADMIN' ? 'Admin Portal' : 'Member Portal'}</span>
          <div className="shell__user">
            <div style={{ textAlign: 'right' }}><strong>{user.fullName}</strong><small>{user.role === 'ADMIN' ? 'Administrator' : user.membership?.gymId ?? 'Member'}</small></div>
            <Avatar name={user.fullName} src={user.profileImageUrl} />
          </div>
        </header>
        <main id="main" className="shell__content" ref={contentRef}>{children}</main>
      </div>
    </div>
  );
}
