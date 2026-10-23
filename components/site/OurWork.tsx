import Link from 'next/link';
import { ArrowRight, Camera, MapPin } from 'lucide-react';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import type { DistrictStat, PublicProject } from '@/types/site';

/**
 * Evidence, not adjectives: the districts we have worked in and the jobs we can
 * show. Both are aggregates of published stories, so nothing here can drift out
 * of step with what the office has actually uploaded.
 */
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

  return (
    <section id="work" className="scroll-mt-24 bg-[var(--background)] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Where we have installed"
            title="Real roofs, photographed on the day"
            description="Every story below is a completed job: the district, the system size, the panels fitted, and the photographs taken on site."
          />
          {totalProjects > 0 && (
            <Link href="/projects" className="neutral-button !px-5 !py-2.5 text-sm">
              All {totalProjects} projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>

        {districts.length > 0 && (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {districts.slice(0, 8).map((row) => (
              <div
                key={row.district}
                className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]">
                    <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {row.district}
                  </span>
                  <span className="text-xs font-medium text-[var(--muted)]">{row.capacityKW} kW</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${Math.max(12, (row.projects / max) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--muted-soft)]">
                  {row.projects} installation{row.projects === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-start gap-4 rounded-[1.75rem] border border-dashed border-[var(--border)] bg-white/70 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Site photographs are added as jobs hand over</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Each completed installation is published here with its photographs and walkthrough video. Book a
                  survey and you can see the nearest finished system before you decide.
                </p>
              </div>
            </div>
            <Link href="/enquiry" className="brand-button shrink-0 !px-5 !py-2.5 text-sm">
              Book a survey
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
