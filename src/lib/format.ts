const nf = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 });
export const money = (v: string | number | null | undefined) => `Rs. ${nf.format(Number(v ?? 0))}`;

/** Date-only strings ("2026-10-14") are formatted without timezone shifts. */
export function fmtDate(v: string | null | undefined) {
  if (!v) return '-';
  const dateOnly = v.length === 10;
  const d = new Date(dateOnly ? `${v}T00:00:00Z` : v);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: dateOnly ? 'UTC' : undefined });
}

export const monthLabel = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export const methodLabel = (m: string) => ({ CASH: 'Cash', BANK_TRANSFER: 'Bank transfer', OTHER: 'Other' })[m] ?? m;

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
