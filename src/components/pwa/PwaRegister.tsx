'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker. Under `next dev` it runs in pass-through mode (no caching) so the app is still installable.
 * When an updated worker takes control, reload once so the page runs the new code.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const swUrl = process.env.NODE_ENV === 'production' ? '/sw.js' : '/sw.js?mode=dev';

    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onChange = () => {
      if (!hadController || reloaded) return; // first install: nothing to refresh
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);

    const register = () => navigator.serviceWorker.register(swUrl, { scope: '/' }).catch((e) => console.warn('Service worker registration failed', e));
    if (document.readyState === 'complete') void register();
    else window.addEventListener('load', register, { once: true });

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, []);
  return null;
}
