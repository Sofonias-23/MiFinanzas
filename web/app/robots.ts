import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/calculadoras',
        '/guias',
        '/guias/',
        '/privacidad',
        '/cookies',
        '/terminos',
      ],
      disallow: [
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
      ],
    },
    sitemap: 'https://sfiq.app/sitemap.xml',
    host: 'https://sfiq.app',
  };
}
