'use client';

import { useEffect, useState } from 'react';

type Props = {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
};

const STORAGE_KEY = 'mifinanzas-cookie-consent';

export default function AdSenseSlot({ slot, format = 'auto', className = '' }: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!client || !slot) return;

    const refreshConsent = () => {
      setAllowed(window.localStorage.getItem(STORAGE_KEY) === 'accepted');
    };

    refreshConsent();
    window.addEventListener('mifinanzas-consent-changed', refreshConsent);
    return () => window.removeEventListener('mifinanzas-consent-changed', refreshConsent);
  }, [client, slot]);

  useEffect(() => {
    if (!allowed || !client || !slot) return;

    const renderAd = () => {
      try {
        const adsWindow = window as unknown as { adsbygoogle?: Record<string, unknown>[] };
        adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
        adsWindow.adsbygoogle.push({});
      } catch {
        // AdSense puede tardar en estar disponible durante el primer render.
      }
    };

    const timer = window.setTimeout(renderAd, 150);
    window.addEventListener('mifinanzas-adsense-ready', renderAd);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mifinanzas-adsense-ready', renderAd);
    };
  }, [allowed, client, slot]);

  if (!allowed || !client || !slot) return null;

  return (
    <aside className={'adSenseWrap ' + className} aria-label="Publicidad">
      <span>Publicidad</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
