import { MapPin, Sun, TrendingUp, Users } from 'lucide-react';
import type { HomePayload } from '@/types/site';

/**
 * Live totals from the showcase collection.
 *
 * When nothing has been published yet the bar would read "0 homes, 0 kW" and
 * undermine the page, so it falls back to facts that are true regardless: the
 * scheme's own numbers.
 */
export default function StatsBar({ stats }: { stats: HomePayload['stats'] }) {
  const live = stats.projects > 0;

  const items = live
    ? [
        { label: 'Installations completed', value: `${stats.projects}`, icon: Sun },
        { label: 'Capacity commissioned', value: `${stats.capacityKW.toLocaleString('en-IN')} kW`, icon: TrendingUp },
        { label: 'Districts served', value: `${stats.districts}`, icon: MapPin },
        { label: 'Panel brands fitted', value: `${stats.brandsInstalled}`, icon: Users },
      ]
    : [
        { label: 'Free units a month', value: '300', icon: Sun },
        { label: 'Central subsidy cap', value: '₹78,000', icon: TrendingUp },
        { label: 'Districts covered', value: '23', icon: MapPin },
        { label: 'Panel performance warranty', value: '25 yrs', icon: Users },
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
