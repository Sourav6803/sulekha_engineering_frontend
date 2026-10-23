import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Images, MapPin, PlayCircle } from 'lucide-react';
import type { PublicProject } from '@/types/site';

/** One completed installation, as a card. */
export default function ProjectCard({ project }: { project: PublicProject }) {
  const images = project.media.filter((item) => item.kind === 'image').length;
  const videos = project.media.filter((item) => item.kind === 'video').length;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border-soft)] bg-white transition-all hover:-translate-y-0.5 hover:border-[var(--primary-soft)] hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--surface-muted)]">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #DBF4E3 0%, #B4E3C6 50%, #0B7A3D 100%)' }}
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)] shadow-sm">
          {project.capacityKW} kW
        </span>
        {(images > 0 || videos > 0) && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {videos > 0 ? <PlayCircle className="h-3.5 w-3.5" /> : <Images className="h-3.5 w-3.5" />}
            {images + videos}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-6 text-[var(--foreground)]">{project.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
          {project.location.district && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {project.location.district}
            </span>
          )}
          {project.panelBrand && <span>· {project.panelBrand}</span>}
        </div>
        {project.summary && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-[var(--muted)]">{project.summary}</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
          Read the story
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
