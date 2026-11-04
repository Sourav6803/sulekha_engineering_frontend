'use client';

import Script from 'next/script';

/**
 * Google Analytics 4, marketing pages only.
 *
 * Mounted in the `(site)` layout rather than the root so the staff dashboard's
 * page views never land in the same property as customer traffic — otherwise
 * "users" becomes a mix of office staff and visitors and every funnel is wrong.
 *
 * The measurement ID is a build-time public value (`NEXT_PUBLIC_GA_MEASUREMENT_ID`);
 * when it is unset nothing is loaded at all, so a preview deploy cannot pollute
 * the live property.
 */
export default function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
