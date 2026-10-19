'use client';

import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Info, Inbox, X } from 'lucide-react';
import type { Meta } from '@/lib/types';
import { initials } from '@/lib/format';

// ---------------------------------------------------------------- Button
type Variant = 'primary' | 'dark' | 'outline' | 'outline-dark' | 'ghost' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
}

const btnClass = (variant: Variant, size: string, block?: boolean) =>
  ['btn', variant !== 'primary' && `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block'].filter(Boolean).join(' ');

export function Button({ variant = 'primary', size = 'md', block, loading, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={btnClass(variant, size, block)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  href, variant = 'primary', size = 'md', block, children, ...rest
}: { href: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; block?: boolean; children: ReactNode } & Omit<React.ComponentProps<typeof Link>, 'href'>) {
  return <Link href={href} className={btnClass(variant, size, block)} {...rest}>{children}</Link>;
}

// ---------------------------------------------------------------- Fields
interface FieldShellProps { label: string; error?: string; hint?: string; required?: boolean; id: string; children: ReactNode }
function FieldShell({ label, error, hint, required, id, children }: FieldShellProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span className="field__req" aria-hidden>*</span>}</label>
      {children}
      {hint && !error && <span className="field__hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field__error" id={`${id}-err`} role="alert">{error}</span>}
    </div>
  );
}

type CommonProps = { label: string; error?: string; hint?: string; required?: boolean };

export const TextField = forwardRef<HTMLInputElement, CommonProps & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, error, hint, required, ...rest }, ref) {
    const id = useId();
    return (
      <FieldShell {...{ label, error, hint, required, id }}>
        <input id={id} ref={ref} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...rest} />
      </FieldShell>
    );
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ label, error, hint, required, ...rest }, ref) {
    const id = useId();
    return (
      <FieldShell {...{ label, error, hint, required, id }}>
        <textarea id={id} ref={ref} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest} />
      </FieldShell>
    );
  },
);

export const SelectField = forwardRef<HTMLSelectElement, CommonProps & SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectField({ label, error, hint, required, children, ...rest }, ref) {
    const id = useId();
    return (
      <FieldShell {...{ label, error, hint, required, id }}>
        <select id={id} ref={ref} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...rest}>{children}</select>
      </FieldShell>
    );
  },
);

// ---------------------------------------------------------------- Feedback
export function Alert({ kind = 'info', children }: { kind?: 'error' | 'success' | 'warning' | 'info'; children: ReactNode }) {
  const Icon = kind === 'success' ? CheckCircle2 : kind === 'info' ? Info : AlertCircle;
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export const Spinner = ({ large }: { large?: boolean }) => <span className={`spinner${large ? ' spinner--lg' : ''}`} role="status" aria-label="Loading" />;
export const PageLoader = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="page-loader" role="status" aria-live="polite">
    <Spinner large />
    <span>{label}</span>
  </div>
);

/** Branded full-screen loader for app start-up (session check) and route changes. */
export const FullPageLoader = ({ label = 'Loading' }: { label?: string }) => (
  <div className="splash" role="status" aria-live="polite" aria-label={label}>
    <div className="splash__mark"><Dumbbell size={38} strokeWidth={2.6} /></div>
    <div className="splash__bar" aria-hidden />
    <div className="splash__text">{label}...</div>
  </div>
);

/** Placeholder rows shown while a table loads, so the page keeps its shape. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (<div key={i} className="skeleton" style={{ height: 44, opacity: 1 - i * 0.12 }} />))}
    </div>
  );
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty">
      {icon ?? <Inbox size={44} />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty">
      <AlertCircle size={44} style={{ color: 'var(--danger-fg)' }} />
      <h3>Could not load data</h3>
      <p>{message}</p>
      {onRetry && <Button variant="outline-dark" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = status === 'BANK_TRANSFER' ? 'Bank transfer' : status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
  return <span className={`badge badge--${status.toLowerCase()}`}>{label}</span>;
}

export function Avatar({ name, src, large }: { name: string; src?: string | null; large?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img className={`avatar${large ? ' avatar--lg' : ''}`} src={src} alt={`${name}'s profile`} />;
  return <span className={`avatar${large ? ' avatar--lg' : ''}`} aria-hidden>{initials(name)}</span>;
}

export function Pagination({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>Showing {from}-{to} of {meta.total}</span>
      <div className="pagination__btns">
        <Button variant="outline-dark" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page"><ChevronLeft size={16} /> Prev</Button>
        <Button variant="outline-dark" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label="Next page">Next <ChevronRight size={16} /></Button>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------- Modal
export function Modal({ title, onClose, children, footer, busy }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; busy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Render at <body> level: ancestors with backdrop-filter/transform (e.g. the navbar) would otherwise trap position:fixed.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const list = Array.from(f).filter((el) => !el.hasAttribute('disabled'));
        if (!list.length) return;
        const first = list[0]!, last = list[list.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [onClose, busy, mounted]);

  if (!mounted) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="modal__head">
          <h3 id={titleId}>{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} aria-label="Close"><X size={18} /></Button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
