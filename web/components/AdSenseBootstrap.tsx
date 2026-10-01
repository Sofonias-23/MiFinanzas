'use client';

import { useEffect } from 'react';

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-2118685293203157';

const SCRIPT_ID = 'sfiq-adsense-script';

const PRIVATE_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/espacio',
  '/dashboard',
  '/pareja',
  '/nuevo-gasto',
  '/nuevo-ingreso',
  '/movimientos',
  '/presupuestos',
  '/estadisticas',
  '/categorias',
  '/metodos-pago',
  '/deudas',
  '/saldar-deuda',
  '/detalle-gasto',
  '/chat-gasto',
  '/perfil',
  '/ajustes',
  '/datos',
];

function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

export default function AdSenseBootstrap() {
  useEffect(() => {
    if (isPrivateRoute(window.location.pathname)) return;
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
      encodeURIComponent(ADSENSE_CLIENT);

    document.head.appendChild(script);
  }, []);

  return null;
}
