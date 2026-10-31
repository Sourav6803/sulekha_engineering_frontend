import Image from 'next/image';
import SectionHeading from './SectionHeading';

/**
 * The parts themselves, not just their names.
 *
 * The bill of material below this section lists every item in words; this is the
 * same list as pictures, because a customer who has never seen an ACDB box does
 * not know what they are being quoted for. The photographs are illustrations —
 * they show the type of part, not the exact model in a given quotation.
 *
 * Each card carries two or three spec chips. They repeat figures that are already
 * stated in the sentence beside them and in the BOM; nothing here is a model claim
 * or a warranty.
 */

type Item = {
  src: string;
  bangla: string;
  name: string;
  role: string;
  specs: string[];
};

const ITEMS: Item[] = [
  {
    src: '/equipment/panel.jpg',
    bangla: 'সোলার প্যানেল',
    name: 'Solar module',
    role: '৫৪৫ Wp বা তার বেশি, Mono PERC / TOPCon — ভর্তুকি নিলে DCR মডিউল।',
    specs: ['545 Wp+', 'Mono PERC / TOPCon', 'DCR option'],
  },
  {
    src: '/equipment/inverter.jpg',
    bangla: 'ইনভার্টার',
    name: 'Inverter',
    role: 'প্যানেলের DC-কে বাড়ির AC-তে বদলায়; ছায়া আর লোড দেখে সাইজ ঠিক হয়।',
    specs: ['On-grid / hybrid', 'Sized to load'],
  },
  {
    src: '/equipment/acdb.jpg',
    bangla: 'এসিডিবি বক্স',
    name: 'AC distribution board',
    role: 'AC দিকের ব্রেকার, MCB ও সার্জ প্রোটেকশন — শর্ট সার্কিট থেকে বাঁচায়।',
    specs: ['MCB + SPD', 'IP-rated box'],
  },
  {
    src: '/equipment/net-meter.jpg',
    bangla: 'নেট মিটার',
    name: 'Net meter',
    role: 'ডিসকম বসায়। জমা হওয়া ইউনিট পরের বিলে সমন্বয় হয়।',
    specs: ['Discom supplied', 'Bi-directional'],
  },
  {
    src: '/equipment/structure.jpg',
    bangla: 'মাউন্টিং স্ট্রাকচার',
    name: 'Mounting structure',
    role: 'গ্যালভানাইজড লোহার ফ্রেম, ঝড় ও প্যানেলের ওজন ধরে রাখে।',
    specs: ['GI steel', 'Elevated / shed'],
  },
  {
    src: '/equipment/earthing.jpg',
    bangla: 'আর্থিং ও ডিসি কেবল',
    name: 'Earthing & DC cable',
    role: 'বজ্রপাত ও ফুটো কারেন্ট থেকে সুরক্ষা; MC4 কানেক্টর সহ।',
    specs: ['4 mm² DC', 'Cu earthing', 'MC4'],
  },
];

export default function EquipmentSection() {
  return (
    <section id="equipment" className="scroll-mt-24 bg-[var(--background)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionHeading
            eyebrow="What we install · যন্ত্রপাতি"
            title="Every part on your roof. And what it does."
          />
          <p className="max-w-md text-sm leading-7 text-[var(--muted)] lg:pb-1">
            A solar system is more than panels. This is the bill of material we fit on a typical rooftop — the same
            list appears on your quotation.
          </p>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]" lang="bn">
          ছাদে আসলে কী কী বসে — প্যানেলের বাইরেও অনেক কিছু লাগে: ইনভার্টার, এসিডিবি, নেট মিটার, স্ট্রাকচার, আর্থিং।
          নিচের ছবিগুলো ধরন বোঝানোর জন্য; আপনার quotation-এ নির্দিষ্ট মডেল ও রেটিং লেখা থাকবে।
        </p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <article
              key={item.src}
              className="group flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] transition-all duration-250 hover:-translate-y-1 hover:border-[var(--primary-soft)] hover:shadow-[0_20px_44px_rgba(17,75,56,0.10)]"
            >
              {/* Tinted stage, not a white box: the photographs are products on white
                  backgrounds and disappear against a white card. */}
              <div
                className="relative aspect-[4/3] w-full overflow-hidden"
                style={{ background: 'radial-gradient(120% 110% at 22% 0%, #EFF5E6 0%, #E2EBD9 100%)' }}
              >
                <Image
                  src={item.src}
                  alt={`${item.name} — ${item.bangla}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                  {item.bangla}
                </p>
                <h3 className="font-display text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
                  {item.name}
                </h3>
                <p className="text-[12.5px] leading-7 text-[var(--muted)]" lang="bn">
                  {item.role}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2.5">
                  {item.specs.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-[5px] border border-[#DDE7D2] bg-[#EEF3E5] px-2 py-1 text-[10px] font-semibold tracking-[0.02em] text-[#3D5A49]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
