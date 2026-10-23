import { CheckCircle2, Layers, MinusCircle, Sun, Zap } from 'lucide-react';
import SectionHeading from './SectionHeading';

/**
 * The question the office answers on the phone every day, written down once.
 *
 * A visitor is usually choosing between three module technologies they have
 * never heard of, on the basis of a WhatsApp forward. This section keeps the
 * answer in Bengali — the language the counter and most of the district
 * customers actually read — and states the trade-off plainly instead of
 * claiming one technology is best.
 *
 * No efficiency percentages or warranty numbers per brand live in this file on
 * purpose: those move between series and datasheets, and a marketing page that
 * quotes a number goes stale without anyone noticing. The checklist says what to
 * compare; the written quotation carries the figures for the exact model quoted.
 */

const TECHNOLOGIES = [
  {
    id: 'mono-perc',
    name: 'Mono PERC',
    tagline: 'সবচেয়ে পরিচিত, বাজেট-বান্ধব',
    body: 'এক দিক থেকেই আলো নেয়; পিছনের সাদা স্তর আলো ফিরিয়ে দিয়ে কার্যদক্ষতা বাড়ায়। বাজারে সবচেয়ে বেশি পাওয়া যায়, এবং DCR (ভারতীয় সেল) সংস্করণও সহজে মেলে — সরকারি ভর্তুকির জন্য এটাই দরকার।',
    good: ['দাম প্রতি ওয়াটে সবচেয়ে কম', 'DCR মডিউল পাওয়া যায়, তাই ভর্তুকি মেলে', 'যেকোনো ব্র্যান্ডে সহজে রিপ্লেসমেন্ট'],
    trade: ['একই ছাদে কম বিদ্যুৎ — প্রতি প্যানেলে Wp কম', 'গরমে উৎপাদন একটু বেশি পড়ে'],
    fit: 'বাজেট বাঁধা থাকলে, ৩ কিলোওয়াট পর্যন্ত সাধারণ টালির ছাদে।',
  },
  {
    id: 'topcon',
    name: 'TOPCon (N-Type)',
    tagline: 'নতুন প্রজন্ম, ছোট ছাদে বেশি বিদ্যুৎ',
    body: 'N-টাইপ সেলের উপরে টানেল অক্সাইড স্তর — একই মাপের প্যানেলে বেশি ওয়াট, আর গরমে কার্যদক্ষতা কম পড়ে। বছরের পর বছর ক্ষয়ও (degradation) কম।',
    good: ['একই জায়গায় বেশি ইউনিট — ছাদ ছোট হলে বড় সুবিধা', 'গরমে কম ক্ষতি, তাই পশ্চিমবঙ্গের গ্রীষ্মে ভালো', 'দীর্ঘমেয়াদে উৎপাদন বেশি থাকে'],
    trade: ['প্রতি ওয়াটে দাম কিছুটা বেশি', 'সব ডিসকম-এ এখনও সব ব্র্যান্ডের স্টক থাকে না'],
    fit: 'ছাদ ছোট কিন্তু বিল বড়; টিনের ছাদ যেটা দুপুরে গরম হয়।',
  },
  {
    id: 'bifacial',
    name: 'Bifacial',
    tagline: 'দুই দিক থেকে আলো',
    body: 'সামনের মতো পিছনের দিক থেকেও আলো নেয়। ছাদ সাদা হলে বা প্যানেল উঁচু স্ট্রাকচারে বসলে পিছনের প্রতিফলিত আলো বাড়তি বিদ্যুৎ দেয়। সাধারণত গ্লাস-টু-গ্লাস, তাই টেকসই।',
    good: ['সাদা ছাদ বা উঁচু স্ট্রাকচারে বাড়তি উৎপাদন', 'গ্লাস-টু-গ্লাস — বেশি টেকসই', 'বড় ছাদে সবচেয়ে ভালো ফল'],
    trade: ['উঁচু মাউন্টিং দরকার, সমতল ছাদে পুরো সুবিধা মেলে না', 'স্ট্রাকচার ও জায়গা বেশি লাগে, খরচ বাড়ে'],
    fit: 'উঁচু/এলিভেটেড স্ট্রাকচার, সাদা রঙের ছাদ, কমার্শিয়াল বা বড় বাড়ি।',
  },
];

const DECISION = [
  { q: 'ছাদ ছোট, কিন্তু বিল বেশি?', a: 'TOPCon — একই জায়গায় বেশি ওয়াট।' },
  { q: 'খরচ কম রাখতে চান?', a: 'Mono PERC (DCR) — ভর্তুকিও মিলবে।' },
  { q: 'ছাদ দুপুরে খুব গরম হয়?', a: 'TOPCon — গরমে কম পড়ে।' },
  { q: 'উঁচু স্ট্রাকচার বা সাদা ছাদ?', a: 'Bifacial — পিছনের আলো কাজে লাগবে।' },
  { q: 'সরকারি ভর্তুকি চান?', a: 'DCR মডিউল লাগবে — quotation-এ সেটি লেখা থাকবে।' },
];

const COMPARE = [
  { label: 'কার্যদক্ষতা (efficiency)', note: 'একই ছাদে কত ওয়াট বসবে, সেটাই ঠিক করে।' },
  { label: 'তাপমাত্রা গুণাঙ্ক', note: 'গরমে কত কমে — সংখ্যাটা শূন্যের যত কাছে, তত ভালো।' },
  { label: 'প্রোডাক্ট ওয়ারেন্টি', note: 'মডিউল নিজের জন্য; সাধারণত ১০–১২ বছর।' },
  { label: 'পারফরম্যান্স ওয়ারেন্টি', note: '২৫–৩০ বছরে কত % উৎপাদন থাকবে।' },
  { label: 'DCR / non-DCR', note: 'ভর্তুকি নিলে DCR বাধ্যতামূলক — দামও আলাদা।' },
  { label: 'সার্ভিস ও স্টক', note: 'রিপ্লেসমেন্ট কত দিনে মিলবে, স্থানীয় ডিলার আছে কি না।' },
];

export default function PanelGuide() {
  return (
    <section id="panel-guide" className="scroll-mt-24 bg-[var(--surface-muted)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="প্যানেল গাইড"
          title="কোন প্যানেল, কেন — বাংলায় বুঝে নিন"
          description="তিন ধরনের মডিউল বাজারে আছে। কোনটা আপনার ছাদের জন্য, সেটা ছাদের মাপ আর বাজেটেই ঠিক হয় — দামি মানেই ভালো নয়।"
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {TECHNOLOGIES.map((tech) => (
            <article
              key={tech.id}
              className="flex flex-col rounded-[1.75rem] border border-[var(--border-soft)] bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                  {tech.id === 'bifacial' ? <Layers className="h-5 w-5" /> : tech.id === 'topcon' ? <Zap className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {tech.name}
                  </h3>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-soft)]">
                    {tech.tagline}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{tech.body}</p>

              <ul className="mt-4 space-y-2">
                {tech.good.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm leading-6 text-[var(--foreground)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    {line}
                  </li>
                ))}
              </ul>

              <ul className="mt-3 space-y-2">
                {tech.trade.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm leading-6 text-[var(--muted)]">
                    <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-soft)]" />
                    {line}
                  </li>
                ))}
              </ul>

              <p className="mt-5 rounded-xl bg-[var(--primary-tint)] px-4 py-3 text-sm leading-6 text-[var(--primary-active)]">
                <span className="font-semibold">কার জন্য: </span>
                {tech.fit}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-[var(--border-soft)] bg-white p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
              গ্রাহক যা জিজ্ঞেস করেন: আমার জন্য কোনটা ভালো?
            </h3>
            <dl className="mt-5 divide-y divide-[var(--border-soft)]">
              {DECISION.map((row) => (
                <div key={row.q} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <dt className="text-sm font-medium text-[var(--foreground)]">{row.q}</dt>
                  <dd className="text-sm text-[var(--muted)] sm:text-right">{row.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-6 text-[var(--muted-soft)]">
              সার্ভের সময় ছায়া, ছাদের দিক (দক্ষিণমুখী কি না) আর কাঠামো দেখে চূড়ান্ত সিস্টেম সাইজ ঠিক হয়। এই
              টেবিলটা শুধু দিক দেখানোর জন্য — চূড়ান্ত সিদ্ধান্ত সার্ভের পরে।
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--sidebar-bg)] p-6 text-white sm:p-8">
            <h3 className="font-display text-lg font-semibold tracking-tight">ব্র্যান্ড মিলিয়ে দেখার সময় যা দেখবেন</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Adani, Tata, Waaree, Vikram — প্রত্যেকেরই ভালো সিরিজ আছে। নাম দেখে নয়, এই ছয়টি জিনিস মিলিয়ে দেখুন।
            </p>
            <ul className="mt-4 space-y-3">
              {COMPARE.map((row) => (
                <li key={row.label} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-white">{row.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/60">{row.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-5 text-white/45">
              সংখ্যাগুলো মডেল-ভেদে বদলায়, তাই এখানে লেখা নেই — আপনার quotation-এ যে মডেল আছে, তার ডেটাশিট
              দেখে নেবেন।
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
