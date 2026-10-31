import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, MapPin, PlayCircle } from 'lucide-react';
import type { DistrictStat, PublicProject } from '@/types/site';

/**
 * Evidence, not adjectives: the districts we have worked in and the jobs we can
 * show. Both are aggregates of published stories, so nothing here can drift out
 * of step with what the office has actually uploaded.
 *
 * The band is deliberately dark. Everything above it is ivory, and a reader who
 * has scrolled through pricing needs a change of surface before the next selling
 * section — the photographs carry the argument here, so the background gets out
 * of their way.
 */

const STRIP = [
  { value: '1–10 kW', label: 'Residential system range' },
  { value: 'West Bengal', label: 'Survey & installation coverage' },
  { value: 'Survey → meter', label: 'Subsidy paperwork handled' },
  { value: 'After-sales', label: 'Service once the panels are up' },
];

export default function OurWork({
  districts,
  projects,
  totalProjects,
}: {
  districts: DistrictStat[];
  projects: PublicProject[];
  totalProjects: number;
}) {
  const max = Math.max(1, ...districts.map((row) => row.projects));
  const [lead, ...rest] = projects;

  return (
    <section
      id="work"
      className="relative scroll-mt-24 overflow-hidden py-16 text-[#EEF3E9] sm:py-24"
      style={{ background: 'linear-gradient(175deg, #0C382A 0%, #114B38 52%, #0E4030 100%)' }}
    >
      {/* The same leaf-tinted glow the hero uses, so the two dark moments rhyme. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-72 -top-80 h-[820px] w-[820px] rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, #2F7C5C 0%, rgba(47,124,92,0) 68%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#CFE0D4]">
              Our work · <span className="normal-case tracking-normal text-[#B9CDBF]">আমাদের কাজ</span>
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-[#F8F9F1] sm:text-4xl lg:text-[2.9rem]">
              Rooftops we have
              <br />
              built for.
            </h2>
          </div>
          <div>
            <p className="max-w-md text-sm leading-7 text-[#B9CDBF]">
              Every roof needs a different answer — an elevated structure on a flat RCC terrace, a compact array behind
              a parapet, or rails clamped to a sloped metal shed. These are the jobs we have published, with the
              photographs taken on site.
            </p>
            {totalProjects > 0 && (
              <Link
                href="/projects"
                className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-[#B4861B] transition-colors hover:text-[#F6D98C]"
              >
                {totalProjects === 1 ? 'See the completed project' : `See all ${totalProjects} projects`}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {lead ? (
          <>
            <div className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              <ProjectTile project={lead} wide />
              {rest.slice(0, 5).map((project) => (
                <ProjectTile key={project.id} project={project} />
              ))}
            </div>

            <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-[#2B6350] sm:grid-cols-2 lg:grid-cols-4">
              {STRIP.map((item) => (
                <div key={item.label} className="bg-[#10432F] px-5 py-5">
                  <strong className="block font-display text-lg font-semibold tracking-tight text-[#B4861B]">
                    {item.value}
                  </strong>
                  <span className="mt-1 block text-[11px] leading-5 text-[#A9C2B1]">{item.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-9 flex flex-col items-start gap-4 rounded-2xl border border-[#2B6350] bg-[#10432F]/70 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A2F23] text-[#B4861B]">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#F8F9F1]">Site photographs are added as jobs hand over</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#B9CDBF]">
                  Each completed installation is published here with its photographs and walkthrough video. Book a
                  survey and you can see the nearest finished system before you decide.
                </p>
              </div>
            </div>
            <Link
              href="/enquiry"
              className="shrink-0 rounded-full bg-[#B4861B] px-5 py-2.5 text-sm font-semibold text-[#2B2412] transition-colors hover:bg-[#F6D98C]"
            >
              Book a survey
            </Link>
          </div>
        )}

        {/* The district tally is the one number that proves the coverage claim. */}
        {districts.length > 0 && (
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {districts.slice(0, 8).map((row) => (
              <div key={row.district} className="rounded-xl border border-[#2B6350] bg-[#0A2F23]/45 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#EEF3E9]">
                    <MapPin className="h-3.5 w-3.5 text-[#B4861B]" />
                    {row.district}
                  </span>
                  <span className="text-[11px] text-[#A9C2B1]">{row.capacityKW} kW</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#1B5340]">
                  <div
                    className="h-full rounded-full bg-[#B4861B]"
                    style={{ width: `${Math.max(12, (row.projects / max) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10.5px] text-[#8FA89A]">
                  {row.projects} installation{row.projects === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 max-w-2xl text-[11px] leading-6 text-[#8FA89A]">
          Photographs are published only for jobs the office has marked as complete and cleared for the website.
        </p>
      </div>
    </section>
  );
}

/**
 * One photograph, with the label over it.
 *
 * The lead tile spans the full width and keeps a cinematic ratio; the rest are
 * square so a ragged row still lines up. Both fall back to the brand gradient
 * when a project has no cover image yet.
 */
function ProjectTile({ project, wide = false }: { project: PublicProject; wide?: boolean }) {
  const videos = project.media.filter((item) => item.kind === 'video').length;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative isolate overflow-hidden rounded-2xl bg-[#0A2F23] ${
        wide ? 'sm:col-span-2 lg:col-span-3 aspect-[4/3] sm:aspect-[16/7] lg:aspect-[21/8]' : 'aspect-square'
      }`}
    >
      {project.coverImage ? (
        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          sizes={wide ? '(max-width: 1024px) 100vw, 1200px' : '(max-width: 640px) 100vw, 380px'}
          className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #2E7C5B 0%, #114B38 55%, #0A2F23 100%)' }}
        />
      )}

      {/* The scrim is what makes white type survive a bright photograph. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(0deg, rgba(6,30,23,0.9) 0%, rgba(6,30,23,0.22) 52%, rgba(6,30,23,0) 78%)',
        }}
      />

      <div className={`absolute inset-x-5 bottom-4 z-10 ${wide ? 'lg:inset-x-7 lg:bottom-6' : ''}`}>
        <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#B4861B] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-[#2B2412]">
          {videos > 0 && <PlayCircle className="h-3 w-3" />}
          {project.capacityKW} kW
          {project.location.district ? ` · ${project.location.district}` : ''}
        </span>
        <h3
          className={`mt-2 font-display font-semibold tracking-tight text-white ${
            wide ? 'text-lg lg:text-[26px]' : 'text-base'
          }`}
        >
          {project.title}
        </h3>
        {project.summary && (
          <p className={`mt-1 text-[11.5px] leading-6 text-[#C4D7C9] ${wide ? 'max-w-md' : 'line-clamp-2'}`}>
            {project.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
