/**
 * West Bengal has 23 districts (Alipurduar, Kalimpong, Jhargram and Paschim
 * Bardhaman are the four newest). Sulekha Engineering files only in this state,
 * so the site step offers this list instead of a free-text district that could
 * be spelled three different ways across records.
 *
 * Block and village lists come from the Local Government Directory; they are not
 * bundled here because the state has ~340 blocks and ~40,000 villages, and a
 * stale copy is worse than a lookup. The fields stay free text until that lookup
 * is wired.
 */
export const WEST_BENGAL_STATE = 'West Bengal';

export const WEST_BENGAL_DISTRICTS = [
  'Alipurduar',
  'Bankura',
  'Birbhum',
  'Cooch Behar',
  'Dakshin Dinajpur',
  'Darjeeling',
  'Hooghly',
  'Howrah',
  'Jalpaiguri',
  'Jhargram',
  'Kalimpong',
  'Kolkata',
  'Malda',
  'Murshidabad',
  'Nadia',
  'North 24 Parganas',
  'Paschim Bardhaman',
  'Paschim Medinipur',
  'Purba Bardhaman',
  'Purba Medinipur',
  'Purulia',
  'South 24 Parganas',
  'Uttar Dinajpur',
] as const;

export type WestBengalDistrict = (typeof WEST_BENGAL_DISTRICTS)[number];
