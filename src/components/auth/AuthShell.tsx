import { Navbar } from '@/components/layout/Navbar';
import { authImage } from '@/lib/static-content';

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="auth-page" style={{ ['--auth-bg' as string]: `url(${authImage})` }}>
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="auth-card__sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-card__foot">{footer}</div>}
        </div>
      </main>
    </>
  );
}
