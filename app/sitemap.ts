import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site/business';
import { AREA_PAGES, SUBSIDY_PAGE } from '@/lib/site/landing';
import { listProjectsOnServer } from '@/lib/api/site.api';

/**
 * Public pages only. The staff app is excluded in robots.ts and has no business
 * in a sitemap, so it is not listed here even as a low-priority entry.
 *
 * Project pages are read from the showcase, which is the content most likely to
 * earn a long-tail search ("3 kW rooftop installation Hooghly"). If that call
 * fails the sitemap still resolves with the static pages — a 500 here would tell
 * Google the whole sitemap is broken.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${SITE_URL}${SUBSIDY_PAGE.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...AREA_PAGES.map((page) => ({
      url: `${SITE_URL}/solar/${page.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/enquiry`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
  ];

  try {
    const { items } = await listProjectsOnServer({ limit: 100 });
    const projectRoutes: MetadataRoute.Sitemap = items
      .filter((project) => Boolean(project.slug))
      .map((project) => ({
        url: `${SITE_URL}/projects/${project.slug}`,
        lastModified: now,
        changeFrequency: 'yearly' as const,
        priority: 0.7,
      }));

    return [...staticRoutes, ...projectRoutes];
  } catch {
    return staticRoutes;
  }
}
