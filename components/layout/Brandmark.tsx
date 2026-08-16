import Link from "next/link";

export function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
        <img
          src="/sulekha_engineering_logo.jpeg"
          alt="Sulekha Engineering"
          className="h-full w-full object-contain"
          width={36}
          height={36}
        />
      </span>
      <span
        className={`flex flex-col leading-tight transition-all duration-200 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        <span className="font-display whitespace-nowrap text-base font-semibold text-[var(--foreground)]">
          Sulekha Engineering
        </span>
        <span
          className="whitespace-nowrap text-[10px] uppercase text-[var(--muted)]"
          style={{ letterSpacing: "var(--tracking-wide)" }}
        >
          PM Surya Ghar Vendor
        </span>
      </span>
    </Link>
  );
}
