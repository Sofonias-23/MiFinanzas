'use client';

import { useEffect, useState } from 'react';

type Props = {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
};

function getAdSenseClient() {
  return document
    .querySelector('meta[name="google-adsense-account"]')
    ?.getAttribute('content')
    ?.trim();
}

export default function AdSenseSlot({
  slot,
  format = 'auto',
  className = '',
}: Props) {
  const [client, setClient] = useState<string | null>(null);

  useEffect(() => {
    const account = getAdSenseClient();
    if (account?.startsWith('ca-pub-')) {
      setClient(account);
    }
  }, []);

  useEffect(() => {
    if (!client || !slot) return;

    const timer = window.setTimeout(() => {
      try {
        const adsWindow = window as unknown as {
          adsbygoogle?: Record<string, unknown>[];
        };
        adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
        adsWindow.adsbygoogle.push({});
      } catch {
        // AdSense completará el render cuando su script esté disponible.
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [client, slot]);

  if (!client || !slot) return null;

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
