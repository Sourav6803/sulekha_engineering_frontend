import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site/business';

/**
 * The staff app lives on the same domain. It is behind auth, but a crawler that
 * finds a link to it will still queue the URLs, so they are excluded here rather
 * than left to rely on the login redirect.
 */
const PRIVATE_ROUTES = [
  '/api/',
  '/login',
  '/dashboard',
  '/applications',
  '/customers',
  '/quotations',
  '/agreements',
  '/installations',
  '/inventory',
  '/materials',
  '/purchases',
  '/suppliers',
  '/leads',
  '/agents',
  '/banners',
  '/bom-templates',
  '/notifications',
  '/showcase',
  '/settings',
  '/change-password',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_ROUTES,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
