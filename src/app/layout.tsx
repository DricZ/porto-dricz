import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "@/index.css"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "Audrico | Fullstack Developer",
    template: "%s | Audrico Portfolio",
  },
  description:
    "Interactive Ubuntu-style Portfolio of Audrico. Fullstack Developer specializing in React, Next.js, and modern web development.",
  keywords: [
    "Audrico",
    "Fullstack Developer",
    "Portfolio",
    "Next.js",
    "React",
    "TypeScript",
    "Ubuntu Desktop Simulator",
  ],
  authors: [{ name: "Audrico", url: "https://github.com/Audrico" }],
  creator: "Audrico",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    title: "Audrico | Fullstack Developer",
    description:
      "Interactive Ubuntu-style Portfolio of Audrico. Explore my projects, skills, and experience in a unique desktop environment.",
    siteName: "Audrico Portfolio",
    images: [
      {
        url: "/og-image.png", // Akan fallback jika file tidak ada
        width: 1200,
        height: 630,
        alt: "Audrico Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Audrico | Fullstack Developer",
    description:
      "Interactive Ubuntu-style Portfolio of Audrico. Explore my projects and skills.",
    creator: "@Audrico",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Audrico",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://Audrico.com",
              jobTitle: "Fullstack Developer",
              sameAs: [
                "https://github.com/Audrico",
                // Tambahkan URL LinkedIn / sosmed lainnya di sini jika ada
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
