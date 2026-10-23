import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeIndianRupee, Landmark, Percent, ShieldCheck } from 'lucide-react';

/**
 * The scheme banner, with a slot for the campaign photograph.
 *
 * The photograph is the office's own — the one shot at the scheme launch with the
 * Prime Minister and the state leadership. It is not generated here: a picture of
 * real people has to be the real picture, and a redrawn or borrowed one would be
 * a false claim about who was in the room.
 *
 * Dropping the file in is all that is needed:
 *
 *   public/scheme-cover.jpg      portrait-ish, 3:4, at least 900 px wide
 *
 * Until then the band still reads as a finished section — it carries the subsidy
 * figures and the CTA, so nothing on the page looks like a missing image.
 */
const PHOTO_FILE = 'scheme-cover.jpg';
const PHOTO_CAPTION = 'পিএম সূর্য ঘর মুফত বিজলি যোজনার প্রচারে';

const hasPhoto = () => {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', PHOTO_FILE));
  } catch {
    return false;
  }
};

export default function PmSchemeBanner() {
  const photo = hasPhoto();

  return (
    <section id="scheme" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-[var(--sidebar-bg)] text-white">
          <div className={`grid items-center gap-0 ${photo ? 'lg:grid-cols-[0.85fr_1.15fr]' : ''}`}>
            {photo && (
              <div className="relative">
                <div className="relative aspect-[3/4] w-full sm:aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[26rem]">
                  <Image
                    src={`/${PHOTO_FILE}`}
                    alt={PHOTO_CAPTION}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-xs font-medium text-white/85">{PHOTO_CAPTION}</p>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-tint)]">
                <Landmark className="h-3.5 w-3.5" />
                পিএম সূর্য ঘর মুফত বিজলি যোজনা
              </span>

              <h2 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                সরকারি ভর্তুকি সরাসরি আপনার ব্যাঙ্ক অ্যাকাউন্টে
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
                ছাদে সোলার বসালে কেন্দ্রীয় সরকারের ভর্তুকি আর রাজ্যের অতিরিক্ত ভর্তুকি — দুটোই মেলে। রেজিস্ট্রেশন,
                ডিসকমের অনুমতি, নেট মিটারিং আর ভর্তুকির কাগজপত্র আমরা দেখি।
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: BadgeIndianRupee, value: '₹78,000', label: 'কেন্দ্রীয় ভর্তুকি (৩ কিলোওয়াট)' },
                  { icon: ShieldCheck, value: '₹15,000', label: 'SC/ST রাজ্য ভর্তুকি' },
                  { icon: Percent, value: '5.75%', label: 'ব্যাঙ্ক লোনের সুদ' },
                ].map((fact) => (
                  <div key={fact.label} className="rounded-2xl bg-white/5 p-4">
                    <fact.icon className="h-4 w-4 text-[var(--primary-bright)]" />
                    <p className="mt-2 font-display text-xl font-semibold tracking-tight">{fact.value}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-white/55">{fact.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/enquiry"
                  className="inline-flex items-center rounded-full bg-[var(--primary-bright)] px-5 py-3 text-sm font-semibold text-[var(--sidebar-bg)] transition-colors hover:bg-white"
                >
                  ফ্রি সার্ভে বুক করুন
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <span className="text-xs text-white/50">অনুমোদিত PM Surya Ghar ভেন্ডর</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
