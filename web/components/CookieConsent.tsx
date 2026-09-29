'use client';

import { useEffect, useState } from 'react';

type Consent = 'unknown' | 'accepted' | 'rejected';

const STORAGE_KEY = 'mifinanzas-cookie-consent';

export default function CookieConsent() {
  const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
  const [consent, setConsent] = useState<Consent>('unknown');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!adsenseEnabled) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'accepted' || saved === 'rejected') {
      setConsent(saved);
      return;
    }
    setOpen(true);
  }, [adsenseEnabled]);

  if (!adsenseEnabled) return null;

  const save = (value: Exclude<Consent, 'unknown'>) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
    setOpen(false);
    window.dispatchEvent(new CustomEvent('mifinanzas-consent-changed', { detail: value }));
  };

  if (!open && consent !== 'unknown') {
    return (
      <button type="button" className="cookieMiniButton" onClick={() => setOpen(true)}>
        Cookies
      </button>
    );
  }

  if (!open) return null;

  return (
    <aside className="cookieBanner" aria-label="Preferencias de cookies">
      <div>
        <small>PRIVACIDAD Y PUBLICIDAD</small>
        <strong>Tu elección sobre cookies</strong>
        <p>
          MiFinanzas usa almacenamiento esencial para el funcionamiento del sitio. Cuando la publicidad esté
          habilitada, Google AdSense puede usar cookies u otras tecnologías si das tu consentimiento.
        </p>
        <div className="cookieLinks">
          <a href="/cookies">Política de cookies</a>
          <a href="/privacidad">Privacidad</a>
        </div>
      </div>
      <div className="cookieActions">
        <button type="button" className="ghostButton" onClick={() => save('rejected')}>Rechazar publicidad</button>
        <button type="button" className="primaryButton" onClick={() => save('accepted')}>Aceptar</button>
      </div>
    </aside>
  );
}
