'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock, Table2, BarChart3 } from 'lucide-react';
import { ErrorState, PageLoader } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { MonthPoint } from '@/lib/types';

// The SVG is drawn in real pixels (width follows the card), so text stays readable on small phones.
const M_BASE = { top: 28, right: 12, bottom: 44, left: 40 };

const shortMonth = (p: MonthPoint) => new Date(Date.UTC(p.year, p.month - 1, 1)).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

/** Axis maximum as 4 equal whole-number steps (member counts are integers). */
function niceMax(v: number) {
  const raw = Math.max(1, Math.ceil(v / 4));
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((c) => c >= raw && Number.isInteger(c)) ?? Math.ceil(raw / mag) * mag;
  return step * 4;
}

/**
 * Paid vs unpaid members per month (stacked). Two series: paid = blue, unpaid = orange. Both validated for
 * colour-blind separation; identity is never colour-alone (legend with icons, labels, tooltip, and a table view).
 */
export function MonthlyChart() {
  const [months, setMonths] = useState(12);
  const card = useRef<HTMLElement>(null);
  const [W, setW] = useState(760);

  // Follow the container width; start with fewer months on phones.
  useEffect(() => {
    if (window.innerWidth < 520) setMonths(6);
    const el = card.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = W < 480;
  const H = narrow ? 250 : 300;
  const M = narrow ? { ...M_BASE, left: 30, right: 6 } : M_BASE;
  const PLOT_W = W - M.left - M.right;
  const PLOT_H = H - M.top - M.bottom;
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const { data, error, loading, reload } = useFetch(() => api.get<MonthPoint[]>('/admin/dashboard/monthly', { months }), [months]);

  const view_ = useMemo(() => {
    if (!data) return null;
    const max = niceMax(Math.max(1, ...data.map((d) => d.total)));
    const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
    return { max, ticks };
  }, [data]);

  if (loading && !data) return <PageLoader />;
  if (error || !data || !view_) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const slot = PLOT_W / data.length;
  // Skip every other month label when bars are too tight to fit them (the latest month is always labelled).
  const labelEvery = slot < 30 ? 2 : 1;
  const barW = Math.min(44, slot * 0.62);
  const y = (v: number) => M.top + PLOT_H - (v / view_.max) * PLOT_H;
  const activeIdx = selected ?? data.length - 1; // default to the current month
  const active = data[activeIdx]!;
  const hovered = hover !== null ? data[hover]! : null;
  const pct = (p: MonthPoint) => (p.total === 0 ? 0 : Math.round((p.paid / p.total) * 100));
  const GAP = 2; // surface gap between stacked fills
  const hasData = data.some((d) => d.total > 0);

  return (
    <section className="card viz" aria-labelledby="viz-title" ref={card}>
      <div className="viz__head">
        <div>
          <h2 id="viz-title" className="viz__title">Members paid vs unpaid, by month</h2>
          <p className="viz__sub">Each bar is every member billed that month. Click a bar for details.</p>
        </div>
        <div className="viz__controls">
          <select value={months} onChange={(e) => { setMonths(Number(e.target.value)); setSelected(null); }} aria-label="Months to show">
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
          <div className="seg" role="group" aria-label="View">
            <button aria-pressed={view === 'chart'} onClick={() => setView('chart')}><BarChart3 size={14} /> Chart</button>
            <button aria-pressed={view === 'table'} onClick={() => setView('table')}><Table2 size={14} /> Table</button>
          </div>
        </div>
      </div>

      <ul className="viz__legend" aria-label="Legend">
        <li><span className="swatch swatch--paid" aria-hidden /><CheckCircle2 size={14} aria-hidden /> Paid</li>
        <li><span className="swatch swatch--unpaid" aria-hidden /><Clock size={14} aria-hidden /> Unpaid</li>
      </ul>

      {!hasData ? (
        <p className="text-muted" style={{ padding: 'var(--space-6) 0', textAlign: 'center' }}>No fee records in this period yet.</p>
      ) : view === 'table' ? (
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 520 }}>
            <thead><tr><th>Month</th><th className="num">Total members</th><th className="num">Paid</th><th className="num">Unpaid</th><th className="num">% paid</th><th className="num">Collected</th></tr></thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={`${d.year}-${d.month}`}>
                  <td><strong>{d.label}</strong></td><td className="num">{d.total}</td><td className="num">{d.paid}</td><td className="num">{d.unpaid}</td><td className="num">{pct(d)}%</td><td className="num">{money(d.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="viz__plot">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Stacked bar chart of paid and unpaid members for the last ${months} months`} onMouseLeave={() => setHover(null)}>
            {/* gridlines + y axis */}
            {view_.ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className={t === 0 ? 'viz__axis' : 'viz__grid'} />
                <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="viz__tick">{Math.round(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = M.left + slot * i + slot / 2;
              const x = cx - barW / 2;
              const unpaidH = (d.unpaid / view_.max) * PLOT_H;
              const paidH = (d.paid / view_.max) * PLOT_H;
              const isActive = i === activeIdx;
              const dim = hover !== null && hover !== i;
              return (
                <g key={`${d.year}-${d.month}`} className={`viz__bar${isActive ? ' is-active' : ''}${dim ? ' is-dim' : ''}`}>
                  {/* paid at the bottom (anchored to the baseline), unpaid stacked above with a surface gap */}
                  {d.paid > 0 && <rect x={x} y={y(0) - paidH} width={barW} height={paidH} rx={d.unpaid > 0 ? 0 : 4} className="fill-paid" />}
                  {d.unpaid > 0 && <rect x={x} y={y(0) - paidH - unpaidH + (d.paid > 0 ? 0 : 0)} width={barW} height={Math.max(0, unpaidH - (d.paid > 0 ? GAP : 0))} rx={4} className="fill-unpaid" />}
                  {isActive && d.total > 0 && <text x={cx} y={y(d.total) - 8} textAnchor="middle" className="viz__value">{d.total}</text>}
                  {(data.length - 1 - i) % labelEvery === 0 && <text x={cx} y={H - M.bottom + 18} textAnchor="middle" className={`viz__tick${isActive ? ' viz__tick--active' : ''}`}>{shortMonth(d)}</text>}
                  {(d.month === 1 || i === 0) && (data.length - 1 - i) % labelEvery === 0 && <text x={cx} y={H - M.bottom + 33} textAnchor="middle" className="viz__tick">{d.year}</text>}
                  {/* generous hit target, bigger than the mark */}
                  <rect x={cx - slot / 2} y={M.top} width={slot} height={PLOT_H + M.bottom} fill="transparent" style={{ cursor: 'pointer' }}
                    tabIndex={0} role="button" aria-label={`${d.label}: ${d.total} members, ${d.paid} paid, ${d.unpaid} unpaid`} aria-pressed={isActive}
                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onClick={() => setSelected(i)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i); } }} />
                </g>
              );
            })}
          </svg>
          {hovered && hover !== null && (
            <div className="viz__tip" style={{ left: Math.min(Math.max(M.left + slot * hover + slot / 2, 88), W - 88) }} role="status">
              <strong>{hovered.label}</strong>
              <span>Total members: {hovered.total}</span>
              <span><i className="swatch swatch--paid" /> Paid: {hovered.paid}</span>
              <span><i className="swatch swatch--unpaid" /> Unpaid: {hovered.unpaid}</span>
            </div>
          )}
        </div>
      )}

      <div className="viz__summary" aria-live="polite">
        <div><span>{active.label}</span><strong>{active.total}</strong><small>total members billed</small></div>
        <div><span>Paid</span><strong>{active.paid}</strong><small>{pct(active)}% of members</small></div>
        <div><span>Unpaid</span><strong>{active.unpaid}</strong><small>{money(active.unpaidAmount)} outstanding</small></div>
        <div><span>Collected</span><strong>{money(active.paidAmount)}</strong><small>for this month&apos;s fees</small></div>
      </div>
    </section>
  );
}
