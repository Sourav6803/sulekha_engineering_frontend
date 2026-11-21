import { BadgeCheck, ClipboardCheck, Headphones, Sun } from 'lucide-react';

type Props = {
  subsidyCap: number;
  unitsPerKWPerDay: number;
  unitsPerKWPerDayMax: number;
};

/** A concise proof strip focused on the offer and service, not installation totals. */
export default function StatsBar({ subsidyCap, unitsPerKWPerDay, unitsPerKWPerDayMax }: Props) {
  const items = [
    { label: 'Central subsidy cap', value: `Up to ₹${subsidyCap.toLocaleString('en-IN')}`, icon: BadgeCheck },
    { label: 'Typical generation', value: `${unitsPerKWPerDay}–${unitsPerKWPerDayMax} units / kW / day`, icon: Sun },
    { label: 'Project support', value: 'Survey to net meter', icon: ClipboardCheck },
    { label: 'After installation', value: 'After-sales support', icon: Headphones },
  ];

  return (
    <section className="border-b border-[var(--border-soft)] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--primary-active)]">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{item.value}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted-soft)]">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
