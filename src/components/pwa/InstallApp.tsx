'use client';

import { useEffect, useState } from 'react';
import { Download, EllipsisVertical, Share, SquarePlus } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser fires `beforeinstallprompt` once, early. Keep it at module level so every button can use it.
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

type Platform = 'ios' | 'android' | 'desktop';
const platform = (): Platform => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
};

const Icon = ({ children }: { children: React.ReactNode }) => <span style={{ display: 'inline-block', verticalAlign: '-3px', margin: '0 2px' }}>{children}</span>;

function HelpSteps({ platform: p }: { platform: Platform }) {
  const list = { display: 'grid', gap: 12, paddingLeft: 20, listStyle: 'decimal', margin: 0 } as const;
  if (p === 'ios') {
    return (
      <ol style={list}>
        <li>Open this site in <strong>Safari</strong>, then tap the <strong>Share</strong> button <Icon><Share size={16} /></Icon>.</li>
        <li>Scroll and choose <strong>Add to Home Screen</strong> <Icon><SquarePlus size={16} /></Icon>.</li>
        <li>Tap <strong>Add</strong>. The Usman Gym icon appears on your home screen.</li>
      </ol>
    );
  }
  if (p === 'android') {
    return (
      <ol style={list}>
        <li>Open this site in <strong>Chrome</strong> and tap the menu <Icon><EllipsisVertical size={16} /></Icon> (top right).</li>
        <li>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</li>
        <li>Confirm. The Usman Gym icon appears on your home screen and app drawer.</li>
      </ol>
    );
  }
  return (
    <ol style={list}>
      <li>In <strong>Chrome</strong> or <strong>Edge</strong>, click the <strong>install icon</strong> <Icon><Download size={16} /></Icon> at the right end of the address bar.</li>
      <li>No icon? Open the browser menu <Icon><EllipsisVertical size={16} /></Icon> and choose <strong>Install Usman Gym</strong> (Chrome: <em>Cast, save and share</em> &rarr; <em>Install page as app</em>).</li>
      <li>Firefox desktop does not support installing web apps.</li>
    </ol>
  );
}

/**
 * "Install app" button. Visible whenever the app is not already installed:
 *  - If the browser offered an install prompt (Chrome/Edge/Android), one tap installs.
 *  - Otherwise (iPhone Safari, or a browser that has not offered the prompt yet) it shows the manual steps.
 */
export function InstallApp({ variant = 'outline', size = 'sm', block, label = 'Install app' }: { variant?: 'primary' | 'outline' | 'outline-dark' | 'ghost' | 'dark'; size?: 'sm' | 'md'; block?: boolean; label?: string }) {
  const [mounted, setMounted] = useState(false);
  const [, force] = useState(0);
  const [help, setHelp] = useState<Platform | null>(null);

  useEffect(() => {
    setMounted(true);
    const update = () => force((n) => n + 1);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  if (!mounted || installed || isStandalone()) return null;

  const click = async () => {
    if (deferred) {
      const ev = deferred;
      deferred = null; // a prompt can only be used once
      await ev.prompt();
      await ev.userChoice;
      notify();
    } else {
      setHelp(platform());
    }
  };

  return (
    <>
      <Button variant={variant} size={size} block={block} onClick={click}><Download size={16} /> {label}</Button>
      {help && (
        <Modal title="Install Usman Gym" onClose={() => setHelp(null)} footer={<Button onClick={() => setHelp(null)}>Got it</Button>}>
          <p style={{ margin: 0 }}>Add Usman Gym to your {help === 'desktop' ? 'computer' : 'home screen'} for one-tap access, a full-screen app and offline support:</p>
          <HelpSteps platform={help} />
          <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Installing needs a secure connection (HTTPS, or localhost while developing).</p>
        </Modal>
      )}
    </>
  );
}
