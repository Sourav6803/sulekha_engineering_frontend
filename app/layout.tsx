import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// Geist / Geist Mono used to be loaded here from next/font/google, but nothing
// consumed their CSS variables: the type system in globals.css is Fraunces +
// Plus Jakarta Sans + IBM Plex Mono (see the note at the top of that file).
// Downloading them only added a build-time dependency on fonts.googleapis.com,
// which fails behind a proxy or on an offline builder - Next.js then logged
// "Failed to download Geist Mono from Google Fonts" and fell back anyway.

// export const metadata: Metadata = {
//   title: "Sulekha Engineering | Inventory & Installations",
//   description:
//     "Internal inventory and installation management for PM Surya Ghar Muft Bijli Yojana vendors.",
//   icons: {
//     icon: "/icon.png",
//     apple: "/icon.png",
//   },
// };


export const metadata: Metadata = {
  title: "Sulekha Engineering | Inventory & Installations",
  description:
    "Internal inventory and installation management for PM Surya Ghar Muft Bijli Yojana vendors.",
  metadataBase: new URL('https://sulekha-engineering-frontend.vercel.app/'), // Replace with your actual domain
  icons: {
    // Multiple entries on purpose: the .ico is what Safari and older browsers
    // ask for, the PNGs are what Chrome and Firefox prefer for the tab.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Sulekha Engineering",
    description: "Powering a Greener Tomorrow with Sustainable Solar Engineering.",
    url: "https://sulekha-engineering-frontend.vercel.app/",
    siteName: "Sulekha Engineering",
    images: [
      {
        url: "/logo.jpeg", // Use your full logo for shared links
        width: 1536, // real size of logo.jpeg - a wrong value makes crawlers crop it
        height: 1024,
        alt: "Sulekha Engineering Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sulekha Engineering",
    description: "Powering a Greener Tomorrow",
    images: ["/logo.jpeg"],
  },
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning={true}
    >
      <body suppressHydrationWarning className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              borderRadius: 'var(--radius)',
            },
          }}
        />
      </body>
    </html>
  );
}

