'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert, Button, Empty, ErrorState, Modal, PageHead, PageLoader, TextArea, TextField } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api, errorMessage } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import type { SiteSettings } from '@/lib/types';

// ---------------------------------------------------------------- general / contact / social
interface SettingsForm {
  gymName: string; tagline: string; description: string;
  address: string; phone: string; email: string; mapUrl: string;
  h1l: string; h1t: string; h2l: string; h2t: string; h3l: string; h3t: string;
  facebook: string; instagram: string; youtube: string; twitter: string;
  note: string; paymentInstructions: string;
}

function SettingsTab() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useFetch(() => api.get<Partial<SiteSettings>>('/admin/settings'), []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SettingsForm>({
    values: data ? {
      gymName: data.general?.gymName ?? '', tagline: data.general?.tagline ?? '', description: data.general?.description ?? '',
      address: data.contact?.address ?? '', phone: data.contact?.phone ?? '', email: data.contact?.email ?? '', mapUrl: data.contact?.mapUrl ?? '',
      h1l: data.contact?.hours?.[0]?.label ?? '', h1t: data.contact?.hours?.[0]?.time ?? '',
      h2l: data.contact?.hours?.[1]?.label ?? '', h2t: data.contact?.hours?.[1]?.time ?? '',
      h3l: data.contact?.hours?.[2]?.label ?? '', h3t: data.contact?.hours?.[2]?.time ?? '',
      facebook: data.social?.facebook ?? '', instagram: data.social?.instagram ?? '', youtube: data.social?.youtube ?? '', twitter: data.social?.twitter ?? '',
      note: data.membership?.note ?? '', paymentInstructions: (data as { payment?: { instructions?: string } }).payment?.instructions ?? '',
    } : undefined,
  });

  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const onSubmit = handleSubmit(async (v) => {
    setSaveError(null);
    const hours = [[v.h1l, v.h1t], [v.h2l, v.h2t], [v.h3l, v.h3t]].filter(([l, t]) => l.trim() && t.trim()).map(([label, time]) => ({ label: label.trim(), time: time.trim() }));
    try {
      await api.put('/admin/settings', {
        general: { gymName: v.gymName, tagline: v.tagline, description: v.description },
        contact: { address: v.address, phone: v.phone, email: v.email, mapUrl: v.mapUrl, hours },
        social: { facebook: v.facebook, instagram: v.instagram, youtube: v.youtube, twitter: v.twitter },
        membership: { note: v.note },
        payment: { instructions: v.paymentInstructions },
      });
      toast('Website content saved', 'success');
      void reload();
    } catch (e) { setSaveError(errorMessage(e)); }
  });

  return (
    <form className="form" onSubmit={onSubmit} noValidate style={{ padding: 'var(--space-5)' }}>
      {saveError && <Alert kind="error">{saveError}</Alert>}
      <h3>General</h3>
      <div className="form-row"><TextField label="Gym name" {...register('gymName')} /><TextField label="Tagline (hero heading)" hint="Tip: two sentences, e.g. “Build Strength. Build Discipline.”" {...register('tagline')} /></div>
      <TextArea label="Short description" style={{ minHeight: 80 }} {...register('description')} />
      <h3 style={{ marginTop: 'var(--space-4)' }}>Contact</h3>
      <TextField label="Address" {...register('address')} />
      <div className="form-row"><TextField label="Phone" {...register('phone')} /><TextField label="Email" type="email" {...register('email')} /></div>
      <TextField label="Google Maps embed URL (optional)" hint="Use the src of the iframe from Google Maps > Share > Embed a map" {...register('mapUrl')} />
      <h3 style={{ marginTop: 'var(--space-4)' }}>Opening hours</h3>
      {[['h1l', 'h1t'], ['h2l', 'h2t'], ['h3l', 'h3t']].map(([l, t], i) => (
        <div key={l} className="form-row"><TextField label={`Days ${i + 1}`} placeholder="Mon - Sat" {...register(l as keyof SettingsForm)} /><TextField label={`Hours ${i + 1}`} placeholder="5:00 AM - 11:00 PM" {...register(t as keyof SettingsForm)} /></div>
      ))}
      <h3 style={{ marginTop: 'var(--space-4)' }}>Social links</h3>
      <div className="form-row"><TextField label="Facebook URL" {...register('facebook')} /><TextField label="Instagram URL" {...register('instagram')} /></div>
      <div className="form-row"><TextField label="YouTube URL" {...register('youtube')} /><TextField label="Twitter / X URL" {...register('twitter')} /></div>
      <h3 style={{ marginTop: 'var(--space-4)' }}>Membership page note</h3>
      <TextArea label="Disclaimer shown under the plans" style={{ minHeight: 80 }} {...register('note')} />
      <h3 style={{ marginTop: 'var(--space-4)' }}>Online payment instructions</h3>
      <TextArea label="Bank / wallet details shown to members when they upload a screenshot" hint="Visible to logged-in members only, never on the public website. Example: Bank, account title, account number / IBAN, Easypaisa/JazzCash number." style={{ minHeight: 110 }} {...register('paymentInstructions')} />
      <div><Button type="submit" size="lg" loading={isSubmitting}>Save changes</Button></div>
    </form>
  );
}

// ---------------------------------------------------------------- FAQs
interface Faq { id: string; question: string; answer: string; sortOrder: number; isActive: boolean }

function FaqModal({ faq, onClose, onDone }: { faq: Faq | null; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ question: string; answer: string; sortOrder: number; isActive: boolean }>({
    defaultValues: faq ?? { question: '', answer: '', sortOrder: 0, isActive: true },
  });
  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const body = { question: v.question, answer: v.answer, sortOrder: Number(v.sortOrder) || 0, isActive: v.isActive };
    try { if (faq) await api.patch(`/admin/faqs/${faq.id}`, body); else await api.post('/admin/faqs', body); onDone(); } catch (e) { setError(errorMessage(e)); }
  });
  return (
    <Modal title={faq ? 'Edit FAQ' : 'New FAQ'} onClose={onClose} busy={isSubmitting} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="faq-form" loading={isSubmitting}>Save</Button></>}>
      <form id="faq-form" className="form" onSubmit={onSubmit}>
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="Question" required {...register('question')} />
        <TextArea label="Answer" required {...register('answer')} />
        <TextField label="Display order" type="number" min={0} {...register('sortOrder')} />
        <label className="check"><input type="checkbox" {...register('isActive')} /> Visible on website</label>
      </form>
    </Modal>
  );
}

function FaqTab() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useFetch(() => api.get<Faq[]>('/admin/faqs'), []);
  const [editing, setEditing] = useState<Faq | 'new' | null>(null);
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const remove = async (f: Faq) => { if (!confirm('Delete this FAQ?')) return; try { await api.delete(`/admin/faqs/${f.id}`); toast('FAQ deleted', 'success'); void reload(); } catch (e) { toast(errorMessage(e), 'error'); } };
  return (
    <div>
      <div style={{ padding: 'var(--space-4)' }}><Button size="sm" onClick={() => setEditing('new')}><Plus size={16} /> Add FAQ</Button></div>
      {data.length === 0 ? <Empty title="No FAQs" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>Question</th><th>Visible</th><th /></tr></thead><tbody>
          {data.map((f) => (<tr key={f.id}><td>{f.sortOrder}</td><td><strong>{f.question}</strong><div className="member-cell__sub">{f.answer.slice(0, 90)}{f.answer.length > 90 ? '…' : ''}</div></td><td>{f.isActive ? 'Yes' : 'No'}</td>
            <td><div className="actions"><Button size="sm" variant="outline-dark" onClick={() => setEditing(f)}><Pencil size={14} /></Button><Button size="sm" variant="ghost" onClick={() => remove(f)} aria-label="Delete FAQ"><Trash2 size={14} /></Button></div></td></tr>))}
        </tbody></table></div>
      )}
      {editing && <FaqModal faq={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void reload(); }} />}
    </div>
  );
}

// ---------------------------------------------------------------- Gallery
interface Img { id: string; url: string; caption: string; category: string; sortOrder: number; isActive: boolean }

function ImageModal({ img, onClose, onDone }: { img: Img | null; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ url: string; caption: string; category: string; sortOrder: number; isActive: boolean }>({
    defaultValues: img ?? { url: '', caption: '', category: 'Gym', sortOrder: 0, isActive: true },
  });
  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const body = { url: v.url, caption: v.caption, category: v.category, sortOrder: Number(v.sortOrder) || 0, isActive: v.isActive };
    try { if (img) await api.patch(`/admin/gallery/${img.id}`, body); else await api.post('/admin/gallery', body); onDone(); } catch (e) { setError(errorMessage(e)); }
  });
  return (
    <Modal title={img ? 'Edit image' : 'Add image'} onClose={onClose} busy={isSubmitting} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="img-form" loading={isSubmitting}>Save</Button></>}>
      <form id="img-form" className="form" onSubmit={onSubmit}>
        {error && <Alert kind="error">{error}</Alert>}
        <TextField label="Image URL" required hint="Link to a hosted image (https://…)" {...register('url')} />
        <TextField label="Caption" {...register('caption')} />
        <div className="form-row"><TextField label="Category" {...register('category')} /><TextField label="Display order" type="number" min={0} {...register('sortOrder')} /></div>
        <label className="check"><input type="checkbox" {...register('isActive')} /> Visible on website</label>
      </form>
    </Modal>
  );
}

function GalleryTab() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useFetch(() => api.get<Img[]>('/admin/gallery'), []);
  const [editing, setEditing] = useState<Img | 'new' | null>(null);
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const remove = async (i: Img) => { if (!confirm('Remove this image from the gallery?')) return; try { await api.delete(`/admin/gallery/${i.id}`); toast('Image removed', 'success'); void reload(); } catch (e) { toast(errorMessage(e), 'error'); } };
  return (
    <div>
      <div style={{ padding: 'var(--space-4)' }}><Button size="sm" onClick={() => setEditing('new')}><Plus size={16} /> Add image</Button></div>
      {data.length === 0 ? <Empty title="No images" /> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Image</th><th>Caption</th><th>Category</th><th>Visible</th><th /></tr></thead><tbody>
          {data.map((i) => (<tr key={i.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <td><img src={i.url} alt="" width={72} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} /></td><td>{i.caption || '-'}</td><td>{i.category}</td><td>{i.isActive ? 'Yes' : 'No'}</td>
            <td><div className="actions"><Button size="sm" variant="outline-dark" onClick={() => setEditing(i)}><Pencil size={14} /></Button><Button size="sm" variant="ghost" onClick={() => remove(i)} aria-label="Remove image"><Trash2 size={14} /></Button></div></td></tr>))}
        </tbody></table></div>
      )}
      {editing && <ImageModal img={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void reload(); }} />}
    </div>
  );
}

// ---------------------------------------------------------------- Messages
interface Msg { id: string; name: string; email: string; phone: string | null; message: string; createdAt: string }
function MessagesTab() {
  const { data, error, loading, reload } = useFetch(() => api.list<Msg>('/admin/messages', { limit: 50 }), []);
  if (loading && !data) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  if (data.items.length === 0) return <Empty title="No messages yet">Messages sent from the website contact form appear here.</Empty>;
  return (
    <div style={{ display: 'grid' }}>
      {data.items.map((m) => (
        <article key={m.id} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}><strong>{m.name}</strong><span className="text-muted" style={{ fontSize: '0.85rem' }}>{fmtDate(m.createdAt)}</span></div>
          <div className="member-cell__sub"><a href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''}</div>
          <p style={{ margin: 'var(--space-2) 0 0', whiteSpace: 'pre-wrap' }}>{m.message}</p>
        </article>
      ))}
    </div>
  );
}

const TABS = [['settings', 'Contact & info'], ['faqs', 'FAQs'], ['gallery', 'Gallery'], ['messages', 'Messages']] as const;

export default function WebsiteContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('settings');
  return (
    <>
      <PageHead title="Website Content" subtitle="Edit what visitors see on the public website." />
      <div className="card card--flush">
        <div className="tabs" role="tablist" style={{ padding: '0 var(--space-4)' }}>
          {TABS.map(([k, label]) => (<button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>))}
        </div>
        {tab === 'settings' && <SettingsTab />}
        {tab === 'faqs' && <FaqTab />}
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </>
  );
}
