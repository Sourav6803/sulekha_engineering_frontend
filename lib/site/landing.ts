/**
 * Landing-page copy, one entry per search term we actually want to rank for.
 *
 * These pages exist because a single homepage cannot answer "solar in Bankura"
 * or "PM Surya Ghar subsidy" with enough specific text. Every entry below is
 * written around a real intent — where the customer is, or what they are trying
 * to claim — and repeats no city copy verbatim, which is what makes thin
 * location pages get filtered out of the index.
 */

export type LandingFaq = { question: string; answer: string };

export type AreaPage = {
  slug: string;
  /** Shown in the H1 and the breadcrumb. */
  area: string;
  /** Nearby towns named in the copy — real coverage, not keyword stuffing. */
  towns: string[];
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** Why solar makes sense in this particular district. */
  local: string;
  faqs: LandingFaq[];
};

export const AREA_PAGES: AreaPage[] = [
  {
    slug: 'bardhaman',
    area: 'Purba Bardhaman',
    towns: ['Memari', 'Jamalpur', 'Kalna', 'Katwa', 'Bardhaman town'],
    metaTitle: 'Rooftop solar in Purba Bardhaman | Sulekha Engineering',
    metaDescription:
      'Rooftop solar installation in Purba Bardhaman — free site survey, PM Surya Ghar subsidy paperwork, net metering and installation by our own team. Call 9832117393.',
    intro:
      'Sulekha Engineering is based in Jamalpur, Purba Bardhaman, and installs rooftop solar across the district — from a 1 kW system on a single-storey house to 10 kW on a commercial terrace. We do the survey, the structural design, the PM Surya Ghar application and the net-metering follow-up ourselves.',
    local:
      'Most roofs here are flat RCC with a water tank in one corner, so the array usually goes on an elevated structure that keeps the panels above the slab and leaves room to walk and clean. Sloped tin roofs on older houses get clamped rails instead, with no drilling through the sheet.',
    faqs: [
      {
        question: 'Do you cover Memari and Jamalpur?',
        answer:
          'Yes. Both are within our regular route — survey is usually possible within two to three days of the enquiry, and the same team does the installation.',
      },
      {
        question: 'How long does the subsidy take in Purba Bardhaman?',
        answer:
          'The application goes in after the survey. Approval and disbursal time is decided by the portal and the discom, not by us, so we quote the current typical range during the survey rather than promising a date.',
      },
      {
        question: 'Can you handle the net meter for my connection?',
        answer:
          'We file the net-metering request with your discom after installation and follow it until the bidirectional meter is fitted. Export is only credited once that meter is in place.',
      },
    ],
  },
  {
    slug: 'hooghly',
    area: 'Hooghly',
    towns: ['Chinsurah', 'Serampore', 'Chandannagar', 'Arambagh', 'Tarakeswar'],
    metaTitle: 'Rooftop solar in Hooghly | Sulekha Engineering',
    metaDescription:
      'Solar panel installation in Hooghly district — subsidy support under PM Surya Ghar, net metering and after-sales service. Free rooftop survey, written quotation.',
    intro:
      'We install grid-tied rooftop solar across Hooghly, working from Serampore and Chinsurah through to Arambagh. Systems are sized from your last twelve months of bills, not from a template — the quotation shows the slab, the subsidy and the expected units side by side.',
    local:
      'Hooghly has a mix of narrow urban terraces and larger peri-urban roofs. On a cramped terrace we use high-wattage modules in a single row to keep walkway clear; on larger roofs the array is laid out in two rows with a service gap for cleaning and inverter access.',
    faqs: [
      {
        question: 'Do you install in rented houses in Hooghly?',
        answer:
          'Yes, with the owner\'s written consent and the electricity connection in the applicant\'s name. The subsidy application needs the property document, so we check that before the survey.',
      },
      {
        question: 'What roof area does a 3 kW system need?',
        answer:
          'Roughly 300 square feet of shadow-free area for 3 kW with current module sizes. The exact figure depends on the module you choose and how the array is arranged, which the survey fixes.',
      },
      {
        question: 'Is a battery needed?',
        answer:
          'Not for a grid-tied system. A standard on-grid inverter shuts down during a power cut for line safety; if you need backup, that is a separate hybrid design and a separate cost.',
      },
    ],
  },
  {
    slug: 'bankura',
    area: 'Bankura',
    towns: ['Bankura town', 'Bishnupur', 'Khatra', 'Raipur', 'Indas'],
    metaTitle: 'Rooftop solar in Bankura | Sulekha Engineering',
    metaDescription:
      'Rooftop solar installation in Bankura district with PM Surya Ghar subsidy paperwork and net metering. Free survey, itemised quotation, local service.',
    intro:
      'Sulekha Engineering serves Bankura district for residential and small commercial rooftop systems, including Bishnupur, Khatra and Indas. Every installation includes the ACDB, earthing and the discom inspection — the parts that decide whether the system actually gets commissioned.',
    local:
      'Loads in Bankura are often smaller and roofs larger, so a 2 kW or 3 kW system usually covers the bill without export. Where the connection is single-phase and the sanctioned load is low, we size the inverter to stay within it and avoid a load-enhancement application.',
    faqs: [
      {
        question: 'How far do you travel for a survey in Bankura?',
        answer:
          'Bankura is inside our service area. Travel for the survey is included; we confirm the day and time on the call before visiting.',
      },
      {
        question: 'Can the subsidy be credited to a bank account in another district?',
        answer:
          'The account must be in the applicant\'s name and linked to Aadhaar. The branch location is not the issue — the name match across Aadhaar, bank and electricity bill is what gets checked.',
      },
      {
        question: 'What maintenance does a rooftop system need?',
        answer:
          'Cleaning the modules every few weeks in this dust, and a look at the inverter display for faults. We hand over the cleaning routine at commissioning and attend service calls after that.',
      },
    ],
  },
  {
    slug: 'purba-medinipur',
    area: 'Purba Medinipur',
    towns: ['Tamluk', 'Haldia', 'Contai', 'Egra', 'Mecheda'],
    metaTitle: 'Rooftop solar in Purba Medinipur | Sulekha Engineering',
    metaDescription:
      'Solar rooftop installation in Purba Medinipur — coastal-grade mounting, PM Surya Ghar subsidy support and net metering. Free site survey.',
    intro:
      'We install rooftop solar in Purba Medinipur, including Tamluk, Haldia and Contai. The coastal belt changes the specification: salt air and monsoon wind decide the structure grade and the fasteners, not just the panel count.',
    local:
      'For roofs within reach of the coast we specify hot-dip galvanised structure and stainless fasteners rather than the standard painted MS, and we raise the array further off the slab so water and salt spray do not sit against the frame.',
    faqs: [
      {
        question: 'Does salt air damage solar panels?',
        answer:
          'The glass and frame handle it; the parts that suffer are untreated fasteners and cable trays. That is why the structure and clamps are specified differently near the coast.',
      },
      {
        question: 'Is a rooftop system safe in a cyclone-prone district?',
        answer:
          'The structure is designed for the local wind load and anchored into the slab or purlin. We show the anchoring detail in the quotation so the load path is not a guess.',
      },
      {
        question: 'Do you service systems you did not install?',
        answer:
          'We take service calls for our own installations first. For others we can inspect and quote a repair, but we do not take over the warranty of another installer\'s work.',
      },
    ],
  },
  {
    slug: 'birbhum',
    area: 'Birbhum',
    towns: ['Suri', 'Bolpur', 'Santiniketan', 'Rampurhat', 'Sainthia'],
    metaTitle: 'Rooftop solar in Birbhum | Sulekha Engineering',
    metaDescription:
      'Rooftop solar installation in Birbhum district — residential and institutional systems with PM Surya Ghar subsidy paperwork and net metering support.',
    intro:
      'Sulekha Engineering installs rooftop solar in Birbhum, from homes in Bolpur and Santiniketan to small institutions around Suri and Rampurhat. We size the system from your consumption, and the quotation lists every item on the bill of material rather than a single lump sum.',
    local:
      'Birbhum roofs vary from heritage tiled structures, where we mount on a separate frame to avoid loading the tiles, to modern RCC slabs that take an elevated array. Both are surveyed the same way: shadow path, slab condition, and the cable route to the meter room.',
    faqs: [
      {
        question: 'Can you install on a tiled or asbestos roof?',
        answer:
          'Yes, using a frame that transfers load to the walls or purlins rather than the tiles. It costs more than a slab installation because of the structure, and the survey confirms whether it is feasible.',
      },
      {
        question: 'Do you work with housing societies?',
        answer:
          'We do, but a shared roof needs a written agreement from the society before the application can be filed. We help with the document list and the layout that keeps common-area access clear.',
      },
      {
        question: 'How do I compare two quotations?',
        answer:
          'Compare the module wattage and make, the inverter model, the structure and the earthing — not just the total. A cheaper quote usually differs in the cable size, the structure or the protection box.',
      },
    ],
  },
];

export const SUBSIDY_SLUG = 'pm-surya-ghar-subsidy';

export const SUBSIDY_PAGE = {
  slug: `/${SUBSIDY_SLUG}`,
  metaTitle: 'PM Surya Ghar subsidy in West Bengal: ₹78,000 explained | Sulekha Engineering',
  metaDescription:
    'Central subsidy under PM Surya Ghar: Muft Bijli Yojana — ₹30,000 for 1 kW, ₹60,000 for 2 kW and ₹78,000 for 3 kW and above. What the application needs and what we handle.',
  h1: 'PM Surya Ghar subsidy, explained without the runaround',
  intro:
    'The central subsidy for a residential rooftop system is fixed by system size: ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW and above, where it is capped. The money is credited to the applicant\'s bank account after installation and net metering — not deducted at the time of purchase.',
  slabs: [
    { size: '1 kW', central: '₹30,000', note: '₹30,000 per kW for the first two kW' },
    { size: '2 kW', central: '₹60,000', note: 'the most common home size' },
    { size: '3 kW and above', central: '₹78,000', note: 'capped, however large the system' },
  ],
  faqs: [
    {
      question: 'Who can apply for the subsidy?',
      answer:
        'Residential households with their own roof and an electricity connection in the applicant\'s name. The name must match across Aadhaar, the bank account and the electricity bill.',
    },
    {
      question: 'Is there extra support for SC/ST households?',
      answer:
        'The state top-up for SC/ST households is additional to the central amount — currently ₹5,000 per kW up to 3 kW, capped at ₹15,000. Current scheme rules apply, and we confirm the applicable figure at the survey.',
    },
    {
      question: 'When is the subsidy paid?',
      answer:
        'After the system is installed, inspected and the net meter is fitted. The portal releases it to the bank account; the timeline is set by the portal and the discom.',
    },
    {
      question: 'What documents are needed?',
      answer:
        'Aadhaar, PAN, the latest electricity bill, a cancelled cheque or passbook page, proof of roof ownership, and photographs of the installation. We collect them once and file the application.',
    },
  ],
};
