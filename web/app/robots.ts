import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://sfiq.app/sitemap.xml',
    host: 'https://sfiq.app',
  };
}
