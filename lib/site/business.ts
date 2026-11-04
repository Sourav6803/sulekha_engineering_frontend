/**
 * The business facts that appear in structured data and on the landing pages.
 *
 * Kept in one place on purpose: a phone number or a postcode that differs
 * between the footer, the JSON-LD and the contact page is exactly what makes
 * Google distrust a local listing. Everything here is the client's own
 * statement, not something derived from the API.
 */
export const SITE_URL = 'https://sulekhaengineering.com';

export const BUSINESS = {
  name: 'Sulekha Engineering',
  legalName: 'Sulekha Engineering',
  tagline: 'Solar today. Better tomorrow.',
  founded: '2026',
  /**
   * The figure the client gives for completed rooftops. It is a stated number,
   * not a count from the database, so it is used in prose only — never in the
   * counters, which stay derived from real records.
   */
  installations: '100+',
  phone: '9832117393',
  phoneE164: '+919832117393',
  whatsapp: '9832117393',
  email: 'sulekhaengineering@gmail.com',
  address: {
    streetAddress: 'Uttarsura, Surekalna',
    addressLocality: 'Jamalpur, Purba Bardhaman',
    addressRegion: 'West Bengal',
    postalCode: '713404',
    addressCountry: 'IN',
  },
  /** One line for prose and the footer. */
  addressLine: 'Uttarsura, Surekalna, Jamalpur, Purba Bardhaman, West Bengal 713404',
  openingHours: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '10:00',
    closes: '19:00',
    label: 'Mon–Sat, 10am–7pm',
  },
  areasServed: ['Purba Bardhaman', 'Hooghly', 'Bankura', 'Purba Medinipur', 'Birbhum'],
  priceRange: '₹₹',
} as const;

/** `tel:` link with the country code, for tap-to-call on a phone. */
export const TEL_HREF = `tel:${BUSINESS.phoneE164}`;

/** wa.me needs the number without the plus. */
export const WHATSAPP_HREF = `https://wa.me/91${BUSINESS.whatsapp}`;
