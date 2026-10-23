// types/site.ts
/**
 * Shapes returned by the public marketing endpoints.
 *
 * These mirror `backend/src/services/site.service.js` and the `toPublic()`
 * allow-lists on `ProjectShowcase` / `SiteBanner`. Nothing here is a guess: the
 * backend is the source of truth and only publishes these fields.
 */

export type SiteBanner = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
  placement: BannerPlacement;
  campaign: string | null;
  order: number;
};

export type BannerPlacement = 'home_hero' | 'scheme_strip' | 'home_popup' | 'footer' | 'other';

/**
 * One row of the savings table.
 *
 * Generation is a range, not a number: a rooftop here makes 4–5 units per kW a
 * day depending on the season, so `unitsPerDay` is the conservative floor and
 * `unitsPerDayMax` the sunny figure. The plain fields are kept as the floor so
 * anything that only wants one number still gets an honest (cautious) one.
 */
export type SavingsRow = {
  sizeKW: number;
  unitsPerDay: number;
  unitsPerDayMax: number;
  unitsPerMonth: number;
  unitsPerMonthMax: number;
  monthlySaving: number;
  monthlySavingMax: number;
  yearlySaving: number;
  yearlySavingMax: number;
  subsidy: number;
  /** Central subsidy plus the West Bengal SC/ST top-up, capped. */
  subsidyScSt: number;
};

export type SiteBrand = {
  slug: string;
  name: string;
  blurb: string;
  panelTypes: string[];
  badge: string | null;
  installedProjects: number;
  installedKW: number;
};

export type SiteMaterialGroup = {
  group: string;
  items: { name: string; role: string; note: string }[];
};

export type ProcessStep = {
  step: number;
  title: string;
  duration: string;
  detail: string;
};

export type DistrictStat = {
  district: string;
  projects: number;
  capacityKW: number;
};

export type ProjectMedia = {
  id: string;
  kind: 'image' | 'video';
  url: string;
  provider: 'cloudinary' | 'youtube' | 'vimeo' | 'drive' | 'other';
  thumbnailUrl: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  order: number;
};

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  story: string | null;
  customerName: string | null;
  location: { district: string | null; state: string | null; area: string | null };
  capacityKW: number;
  panelBrand: string | null;
  panelModel: string | null;
  panelCount: number | null;
  inverterBrand: string | null;
  systemType: 'on-grid' | 'off-grid' | 'hybrid';
  structureType: string | null;
  scheme: string | null;
  commissionedAt: string | null;
  coverImage: string | null;
  media: ProjectMedia[];
  tags: string[];
  highlight: boolean;
  publishedAt: string | null;
  views: number;
};

export type HomePayload = {
  company: {
    name: string;
    phone: string | null;
    altPhone: string | null;
    email: string | null;
    addressLines: string[];
    gstn: string | null;
    logoUrl: string | null;
  };
  banners: Partial<Record<BannerPlacement, SiteBanner[]>>;
  stats: { projects: number; capacityKW: number; districts: number; brandsInstalled: number };
  districts: DistrictStat[];
  brands: SiteBrand[];
  otherBrands: { name: string; installedProjects: number; installedKW: number }[];
  materials: SiteMaterialGroup[];
  process: ProcessStep[];
  savings: {
    assumptions: {
      unitsPerKWPerDay: number;
      unitsPerKWPerDayMax: number;
      billableDaysPerMonth: number;
      tariffPerUnit: number;
      panelWp: number;
    };
    table: SavingsRow[];
    panel: { wp: number; unitsPerDay: number; unitsPerMonth: number };
    subsidy: {
      perKwFirstTwo: number;
      perKwThird: number;
      cap: number;
      /** West Bengal SC/ST top-up: ₹5,000 per kW up to 3 kW, capped separately. */
      scStPerKw: number;
      scStMaxKW: number;
      scStCap: number;
      note: string;
    };
    disclaimer: string;
  };
  faqs: { question: string; answer: string }[];
  recentProjects: PublicProject[];
  generatedAt: string;
};

export type LeadInput = {
  name: string;
  phone: string;
  email?: string;
  district?: string;
  systemSizeKW?: number | null;
  message?: string;
  source?: 'website' | 'banner_qr' | 'whatsapp' | 'phone' | 'referral' | 'other';
  utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'content' | 'term', string>>;
  pagePath?: string;
  website?: string;
};

/** The office's view of a story — includes the fields the public never sees. */
export type AdminProject = PublicProject & {
  location: PublicProject['location'] & { pincode: string | null };
  customerConsent: boolean;
  seo: { title?: string; description?: string };
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminBanner = SiteBanner & {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  district: string | null;
  state: string | null;
  systemSizeKW: number | null;
  message: string | null;
  source: string;
  utm: Record<string, string>;
  pagePath: string | null;
  status: LeadStatus;
  assignedTo: string | null;
  notes: { text: string; byName?: string; at: string }[];
  customerId: string | null;
  contactedAt: string | null;
  convertedAt: string | null;
  createdAt: string;
};
