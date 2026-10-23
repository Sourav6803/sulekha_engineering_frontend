import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, PlayCircle, Sun, Wrench } from 'lucide-react';
import { getProjectCached } from '@/lib/site/server-data';
import type { PublicProject } from '@/types/site';

export const dynamic = 'force-dynamic';

const place = (project: PublicProject) =>
  [project.location.area, project.location.district, project.location.state].filter(Boolean).join(', ');

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
  const { slug } = await params;
  const project = await getProjectCached(slug);

  if (!project) return { title: 'Project not found | Sulekha Engineering' };

  const title = `${project.title} — ${project.capacityKW} kW rooftop solar | Sulekha Engineering`;
  const description =
    project.summary ??
    `${project.capacityKW} kW rooftop solar installation${place(project) ? ` in ${place(project)}` : ''}, commissioned by Sulekha Engineering.`;

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      images: project.coverImage ? [{ url: project.coverImage }] : undefined,
    },
  };
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectCached(slug);

  if (!project) notFound();

  const facts = [
    { label: 'System size', value: `${project.capacityKW} kW`, icon: Sun },
    { label: 'Panel', value: [project.panelBrand, project.panelModel].filter(Boolean).join(' ') || '—', icon: Wrench },
    project.panelCount ? { label: 'Modules', value: `${project.panelCount}`, icon: Sun } : null,
    { label: 'Inverter', value: project.inverterBrand ?? '—', icon: Wrench },
    { label: 'Type', value: project.systemType.replace('-', ' '), icon: Sun },
    project.structureType ? { label: 'Structure', value: project.structureType, icon: Wrench } : null,
    project.commissionedAt
      ? {
          label: 'Commissioned',
          value: new Date(project.commissionedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          icon: CalendarDays,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string; icon: typeof Sun }[];

  const images = project.media.filter((item) => item.kind === 'image');
  const videos = project.media.filter((item) => item.kind === 'video');
  const paragraphs = (project.story ?? '').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  return (
    <article>
      {/* Cover */}
      <section className="relative isolate overflow-hidden bg-[var(--foreground)] pt-16">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0E8A45] to-[#064E27]" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <div className="mx-auto max-w-7xl px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {project.capacityKW} kW
            </span>
            {project.scheme && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                {project.scheme}
              </span>
            )}
            {project.highlight && (
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                Featured
              </span>
            )}
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            {project.title}
          </h1>

          {place(project) && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/85">
              <MapPin className="h-4 w-4" />
              {place(project)}
            </p>
          )}

          {project.summary && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">{project.summary}</p>
          )}
        </div>
      </section>

      {/* Facts */}
      <section className="border-b border-[var(--border-soft)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-px px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-tint)] text-[var(--primary-active)]">
                <fact.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)]">{fact.label}</p>
                <p className="mt-0.5 text-sm font-semibold capitalize text-[var(--foreground)]">{fact.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story + gallery */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">The installation</h2>
            {paragraphs.length > 0 ? (
              <div className="mt-4 space-y-4 text-sm leading-8 text-[var(--muted)] sm:text-base">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-8 text-[var(--muted)] sm:text-base">
                {project.capacityKW} kW {project.systemType.replace('-', ' ')} rooftop system
                {place(project) ? ` in ${place(project)}` : ''}
                {project.commissionedAt
                  ? `, commissioned in ${new Date(project.commissionedAt).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric',
                    })}.`
                  : '.'}
              </p>
            )}

            {project.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/enquiry" className="brand-button">
                Get a quote like this
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/projects" className="neutral-button">
                See more projects
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image) => (
                  <figure
                    key={image.id}
                    className={`relative overflow-hidden rounded-2xl bg-[var(--surface-muted)] ${
                      images.length === 1 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.caption ?? project.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, 50vw"
                      className="object-cover"
                    />
                  </figure>
                ))}
              </div>
            )}

            {videos.length > 0 && (
              <div className="space-y-2">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white p-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
                  >
                    <PlayCircle className="h-5 w-5 shrink-0 text-[var(--primary)]" />
                    <span className="truncate">{video.caption ?? 'Watch the installation'}</span>
                  </a>
                ))}
              </div>
            )}

            {images.length === 0 && videos.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-5 py-10 text-center text-sm text-[var(--muted)]">
                No photos have been published for this installation yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
