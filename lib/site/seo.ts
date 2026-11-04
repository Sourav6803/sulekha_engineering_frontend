import { BUSINESS, SITE_URL } from './business';

/**
 * JSON-LD builders.
 *
 * One `@graph` per page rather than several loose scripts: the business node is
 * declared once with a stable `@id`, and the service / breadcrumb nodes point at
 * it by reference, so Google reads one connected entity instead of three
 * unrelated fragments.
 */

const ORG_ID = `${SITE_URL}/#business`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function localBusinessSchema() {
  return {
    '@type': 'LocalBusiness',
    '@id': ORG_ID,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: SITE_URL,
    telephone: BUSINESS.phoneE164,
    email: BUSINESS.email,
    foundingDate: BUSINESS.founded,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: 'INR',
    slogan: BUSINESS.tagline,
    address: {
      '@type': 'PostalAddress',
      ...BUSINESS.address,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: BUSINESS.openingHours.days.map((day) => `https://schema.org/${day}`),
        opens: BUSINESS.openingHours.opens,
        closes: BUSINESS.openingHours.closes,
      },
    ],
    areaServed: BUSINESS.areasServed.map((area) => ({
      '@type': 'AdministrativeArea',
      name: area,
    })),
    knowsAbout: [
      'Rooftop solar installation',
      'PM Surya Ghar: Muft Bijli Yojana',
      'Net metering',
      'Solar subsidy in West Bengal',
    ],
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: BUSINESS.name,
    publisher: { '@id': ORG_ID },
    inLanguage: ['en-IN', 'bn-IN'],
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  areaServed: string[];
  slug: string;
}) {
  return {
    '@type': 'Service',
    '@id': `${SITE_URL}${input.slug}#service`,
    name: input.name,
    description: input.description,
    serviceType: 'Rooftop solar installation',
    provider: { '@id': ORG_ID },
    areaServed: input.areaServed.map((area) => ({
      '@type': 'AdministrativeArea',
      name: area,
    })),
    url: `${SITE_URL}${input.slug}`,
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Wrap any of the above into a single graph script. */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
