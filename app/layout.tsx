import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Sulekha Engineering",
    description: "Powering a Greener Tomorrow with Sustainable Solar Engineering.",
    url: "https://sulekha-engineering-frontend.vercel.app/",
    siteName: "Sulekha Engineering",
    images: [
      {
        url: "/logo.jpeg", // Use your full logo for shared links
        width: 1200,
        height: 630,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning={true}
    >
      <body suppressHydrationWarning className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              borderRadius: 'var(--radius)',
            },
          }}
        />
      </body>
    </html>
  );
}

