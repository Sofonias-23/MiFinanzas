'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'mifinanzas-cookie-consent';
const SCRIPT_ID = 'mifinanzas-adsense-script';

export default function AdSenseBootstrap() {
  useEffect(() => {
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    if (!client) return;

    const load = () => {
      const consent = window.localStorage.getItem(STORAGE_KEY);
      if (consent !== 'accepted') return;
      if (document.getElementById(SCRIPT_ID)) return;

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
      script.onload = () => window.dispatchEvent(new Event('mifinanzas-adsense-ready'));
      document.head.appendChild(script);
    };

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === 'accepted') load();
    };

    load();
    window.addEventListener('mifinanzas-consent-changed', onConsent);
    return () => window.removeEventListener('mifinanzas-consent-changed', onConsent);
  }, []);

  return null;
}
