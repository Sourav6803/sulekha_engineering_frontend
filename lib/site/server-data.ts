import { cache } from 'react';
import { getHomeOnServer, getProjectOnServer } from '@/lib/api/site.api';

/**
 * Per-request memoisation for the public site's server reads.
 *
 * The site layout needs the company block for the header and footer, and the
 * page needs the whole payload. Without this they would each issue their own
 * `/public/home` call — two round trips per visit for identical bytes.
 *
 * `cache()` is scoped to a single render pass, so nothing is held between
 * requests and a freshly published project still appears on the next load.
 * Server components only: this module must never be imported from a client one.
 */

export const getHomeCached = cache(getHomeOnServer);

export const getProjectCached = cache((slug: string) => getProjectOnServer(slug));
