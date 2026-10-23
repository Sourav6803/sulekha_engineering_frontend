import fs from 'node:fs';
import path from 'node:path';

/**
 * Official brand logos are the one thing this repo cannot ship for the brands it
 * fits: they are the manufacturers' trademarks, and a redrawn or scraped copy is
 * either wrong or unlicensed. So the site looks for the office's own copies at
 * `public/brands/<slug>.png` and falls back to a typographic mark when the file
 * is not there.
 *
 * Dropping a logo in is therefore a file copy, with no code change:
 *
 *   public/brands/tata.png
 *   public/brands/waaree.png
 *   public/brands/adani.png
 *   public/brands/vikram.png
 *
 * Transparent PNG or SVG, roughly 3:1, at least 240 px wide.
 */
const BRAND_DIR = path.join(process.cwd(), 'public', 'brands');

export const brandLogoPath = (slug: string): string | null => {
  if (!slug) return null;

  // The slug comes from the backend's own content file, but it still reaches a
  // filesystem path, so anything that is not a plain word is refused rather than
  // joined.
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;

  for (const ext of ['png', 'svg', 'webp']) {
    if (fs.existsSync(path.join(BRAND_DIR, `${slug}.${ext}`))) {
      return `/brands/${slug}.${ext}`;
    }
  }

  return null;
};
