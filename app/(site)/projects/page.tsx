import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import ProjectCard from '@/components/site/ProjectCard';
import { listProjectsOnServer, type ProjectQuery } from '@/lib/api/site.api';
import { getHomeCached } from '@/lib/site/server-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Completed rooftop solar projects | Sulekha Engineering',
  description:
    'Every published installation with its system size, district, panel make and photos — the work, not a claim about it.',
  alternates: { canonical: '/projects' },
};

const SORTS: { value: NonNullable<ProjectQuery['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'capacity', label: 'Largest system' },
  { value: 'views', label: 'Most viewed' },
  { value: 'oldest', label: 'Oldest first' },
];

const one = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(one(params.page)) || 1);
  const district = one(params.district);
  const brand = one(params.brand);
  const search = one(params.search);
  const sortParam = one(params.sort);
  const sort = (SORTS.find((option) => option.value === sortParam)?.value ?? 'newest') as NonNullable<ProjectQuery['sort']>;

  const [{ items, pagination }, home] = await Promise.all([
    listProjectsOnServer({
      page,
      limit: 12,
      sort,
      district: district || undefined,
      brand: brand || undefined,
      search: search || undefined,
    }),
    getHomeCached(),
  ]);

  const districts = home?.districts.map((row) => row.district) ?? [];
  const brands = home?.brands.map((row) => row.name) ?? [];
  const hasFilters = Boolean(district || brand || search) || sort !== 'newest';

  /** Keeps the other filters when paging, and omits page=1 to keep URLs clean. */
  const hrefFor = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = { district, brand, search, sort, page, ...overrides };
    const query = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === '' || (key === 'page' && Number(value) <= 1)) return;
      if (key === 'sort' && value === 'newest') return;
      query.set(key, String(value));
    });
    const qs = query.toString();
    return qs ? `/projects?${qs}` : '/projects';
  };

  return (
    <>
      <section className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] pb-12 pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Our work</span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Roofs we have actually commissioned
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Every story below is a real installation, published with the customer&apos;s consent. Size, district, panel
            make and the photos are recorded when the job is handed over — nothing here is edited for the brochure.
          </p>
          <p className="mt-5 text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">{pagination.total}</span>{' '}
            {pagination.total === 1 ? 'project' : 'projects'} published
            {districts.length > 0 && (
              <>
                {' '}
                across <span className="font-semibold text-[var(--foreground)]">{districts.length}</span> districts
              </>
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* A plain GET form: the filters work before any JavaScript loads. */}
        <form method="get" className="surface-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="sr-only" htmlFor="project-search">
            Search projects
          </label>
          <input
            id="project-search"
            name="search"
            defaultValue={search}
            placeholder="Search by village, customer or system…"
            className="form-input"
          />

          <label className="sr-only" htmlFor="project-district">
            District
          </label>
          <select id="project-district" name="district" defaultValue={district} className="form-input">
            <option value="">All districts</option>
            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="project-brand">
            Panel brand
          </label>
          <select id="project-brand" name="brand" defaultValue={brand} className="form-input">
            <option value="">All panel brands</option>
            {brands.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="project-sort">
            Sort
          </label>
          <select id="project-sort" name="sort" defaultValue={sort} className="form-input">
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="submit" className="brand-button justify-center">
            Apply
          </button>
        </form>

        {hasFilters && (
          <div className="mt-3">
            <Link href="/projects" className="text-sm font-medium text-[var(--primary)] hover:underline">
              Clear all filters
            </Link>
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-10 rounded-[1.75rem] border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
            <MapPin className="mx-auto h-6 w-6 text-[var(--muted-soft)]" />
            <p className="mt-3 font-display text-lg font-semibold text-[var(--foreground)]">No projects match this filter</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try a different district, or{' '}
              <Link href="/projects" className="font-medium text-[var(--primary)] hover:underline">
                see every project
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <nav className="mt-12 flex items-center justify-between gap-4 border-t border-[var(--border-soft)] pt-6" aria-label="Pagination">
            {pagination.page > 1 ? (
              <Link href={hrefFor({ page: pagination.page - 1 })} className="neutral-button">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="neutral-button pointer-events-none opacity-40">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </span>
            )}

            <span className="text-sm text-[var(--muted)]">
              Page <span className="font-semibold text-[var(--foreground)]">{pagination.page}</span> of {pagination.pages}
            </span>

            {pagination.page < pagination.pages ? (
              <Link href={hrefFor({ page: pagination.page + 1 })} className="neutral-button">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <span className="neutral-button pointer-events-none opacity-40">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
