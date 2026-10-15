'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone, Plus, X } from 'lucide-react';
import { Alert, Button, TextArea, TextField } from '@/components/ui';
import { api, applyFieldErrors, errorMessage } from '@/lib/api';
import { contactSchema } from '@/lib/schemas';
import type { SiteData, SiteSettings } from '@/lib/types';
import type { z } from 'zod';

// ---------------------------------------------------------------- FAQ accordion
export function FaqList({ faqs }: { faqs: SiteData['faqs'] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  if (faqs.length === 0) return <p className="text-center text-muted">FAQs will appear here soon.</p>;
  return (
    <div className="faq">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className="faq__item" data-open={isOpen}>
            <h3 style={{ margin: 0, textTransform: 'none', fontSize: 'inherit' }}>
              <button className="faq__q" aria-expanded={isOpen} aria-controls={`faq-${f.id}`} id={`faq-q-${f.id}`} onClick={() => setOpen(isOpen ? null : f.id)}>
                {f.question}<Plus size={22} aria-hidden />
              </button>
            </h3>
            <div className="faq__a" data-open={isOpen} id={`faq-${f.id}`} role="region" aria-labelledby={`faq-q-${f.id}`}>
              <div><p>{f.answer}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Gallery + lightbox
export function Gallery({ images }: { images: SiteData['gallery'] }) {
  const categories = useMemo(() => ['All', ...Array.from(new Set(images.map((i) => i.category)))], [images]);
  const [cat, setCat] = useState('All');
  const [current, setCurrent] = useState<number | null>(null);
  const shown = useMemo(() => (cat === 'All' ? images : images.filter((i) => i.category === cat)), [images, cat]);

  const step = useCallback((d: number) => setCurrent((c) => (c === null ? c : (c + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (current === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCurrent(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [current, step]);

  if (images.length === 0) return <p className="text-center text-muted">Gallery photos are coming soon.</p>;
  const active = current !== null ? shown[current] : null;

  return (
    <>
      {categories.length > 2 && (
        <div className="gallery-filters" role="group" aria-label="Filter photos by category">
          {categories.map((c) => (<button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>))}
        </div>
      )}
      <div className="gallery">
        {shown.map((img, i) => (
          <button key={img.id} className="gallery__item" onClick={() => setCurrent(i)} aria-label={`Open photo: ${img.caption || img.category}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption || `${img.category} photo`} loading="lazy" />
            {img.caption && <span>{img.caption}</span>}
          </button>
        ))}
      </div>
      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={(e) => e.target === e.currentTarget && setCurrent(null)}>
          <button className="close" onClick={() => setCurrent(null)} aria-label="Close preview" autoFocus><X /></button>
          {shown.length > 1 && <button className="prev" onClick={() => step(-1)} aria-label="Previous photo"><ChevronLeft /></button>}
          <figure style={{ margin: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.url} alt={active.caption || `${active.category} photo`} />
            {active.caption && <figcaption>{active.caption}</figcaption>}
          </figure>
          {shown.length > 1 && <button className="next" onClick={() => step(1)} aria-label="Next photo"><ChevronRight /></button>}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Contact
type ContactForm = z.infer<typeof contactSchema>;

export function ContactSection({ settings }: { settings: SiteSettings }) {
  const { contact } = settings;
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ContactForm>({ resolver: zodResolver(contactSchema), defaultValues: { phone: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const res = await api.post<{ message: string }>('/public/contact', values);
      setStatus({ kind: 'success', text: res.message });
      reset();
    } catch (e) {
      if (!applyFieldErrors(e, setError)) setStatus({ kind: 'error', text: errorMessage(e) });
    }
  });

  return (
    <section className="section">
      <div className="container contact-grid">
        <div>
          <span className="eyebrow">Get in touch</span>
          <h2>Visit or message us</h2>
          <ul className="contact-info">
            <li><span className="contact-info__icon"><MapPin /></span><div><h4>Address</h4><p>{contact.address}</p></div></li>
            <li><span className="contact-info__icon"><Phone /></span><div><h4>Phone</h4><a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a></div></li>
            <li><span className="contact-info__icon"><Mail /></span><div><h4>Email</h4><a href={`mailto:${contact.email}`}>{contact.email}</a></div></li>
            <li><span className="contact-info__icon"><Clock /></span><div><h4>Opening hours</h4>{contact.hours.map((h) => (<p key={h.label}>{h.label}: {h.time}</p>))}</div></li>
          </ul>
          {contact.mapUrl && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <iframe className="map-frame" src={contact.mapUrl} title="Map showing gym location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="card__title">Send us a message</h3>
          <form className="form" onSubmit={onSubmit} noValidate>
            {status && <Alert kind={status.kind}>{status.text}</Alert>}
            <div className="form-row">
              <TextField label="Your name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
              <TextField label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register('email')} />
            </div>
            <TextField label="Phone (optional)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
            <TextArea label="Message" required error={errors.message?.message} {...register('message')} />
            <Button type="submit" loading={isSubmitting}>Send message</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
