export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">{eyebrow}</span>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">{description}</p>}
    </div>
  );
}
