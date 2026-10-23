import Image from 'next/image';
import SectionHeading from './SectionHeading';

/**
 * The parts themselves, not just their names.
 *
 * The bill of material below this section lists every item in words; this is the
 * same list as pictures, because a customer who has never seen an ACDB box does
 * not know what they are being quoted for. The photographs are illustrations —
 * they show the type of part, not the exact model in a given quotation.
 */

type Item = {
  src: string;
  bangla: string;
  name: string;
  role: string;
};

const ITEMS: Item[] = [
  {
    src: '/equipment/panel.jpg',
    bangla: 'সোলার প্যানেল',
    name: 'Solar module',
    role: '৫৪৫ Wp বা তার বেশি, Mono PERC / TOPCon — ভর্তুকি নিলে DCR মডিউল।',
  },
  {
    src: '/equipment/inverter.jpg',
    bangla: 'ইনভার্টার',
    name: 'Inverter',
    role: 'প্যানেলের DC-কে বাড়ির AC-তে বদলায়; ছায়া আর লোড দেখে সাইজ ঠিক হয়।',
  },
  {
    src: '/equipment/acdb.jpg',
    bangla: 'এসিডিবি বক্স',
    name: 'AC distribution board',
    role: 'AC দিকের ব্রেকার, MCB ও সার্জ প্রোটেকশন — শর্ট সার্কিট থেকে বাঁচায়।',
  },
  {
    src: '/equipment/net-meter.jpg',
    bangla: 'নেট মিটার',
    name: 'Net meter',
    role: 'ডিসকম বসায়। জমা হওয়া ইউনিট পরের বিলে সমন্বয় হয়।',
  },
  {
    src: '/equipment/structure.jpg',
    bangla: 'মাউন্টিং স্ট্রাকচার',
    name: 'Mounting structure',
    role: 'গ্যালভানাইজড লোহার ফ্রেম, ঝড় ও প্যানেলের ওজন ধরে রাখে।',
  },
  {
    src: '/equipment/earthing.jpg',
    bangla: 'আর্থিং ও ডিসি কেবল',
    name: 'Earthing & DC cable',
    role: 'বজ্রপাত ও ফুটো কারেন্ট থেকে সুরক্ষা; MC4 কানেক্টর সহ।',
  },
];

export default function EquipmentSection() {
  return (
    <section id="equipment" className="scroll-mt-24 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="যন্ত্রপাতি"
          title="ছাদে আসলে কী কী বসে"
          description="প্যানেলের বাইরেও অনেক কিছু লাগে — ইনভার্টার, এসিডিবি, নেট মিটার, স্ট্রাকচার, আর্থিং। নিচের ছবিগুলো ধরন দেখানোর জন্য, আপনার quotation-এ মডেল লেখা থাকবে।"
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <article
              key={item.src}
              className="group overflow-hidden rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--background)] transition-all hover:-translate-y-0.5 hover:border-[var(--primary-soft)] hover:shadow-[var(--shadow-card)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                <Image
                  src={item.src}
                  alt={`${item.name} — ${item.bangla}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-active)]">
                  {item.bangla}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold tracking-tight text-[var(--foreground)]">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
