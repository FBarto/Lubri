import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FB Lubricentro y Baterías | Villa Carlos Paz",
  description: "Tu lubricentro de confianza en Villa Carlos Paz. Cambio de aceite, filtros, baterías y gomería. Atención por orden de llegada o con turno online.",
  openGraph: {
    title: "FB Lubricentro y Baterías",
    description: "Mantenimiento vehicular en Villa Carlos Paz. Asunción 505.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": "FB Lubricentro y Baterías",
    "image": "https://lubri-app.vercel.app/og-image.jpg",
    "description": "Lubricentro y venta de baterías en Villa Carlos Paz.",
    "url": "https://lubri-app.vercel.app",
    "telephone": "+5493516756248",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Asunción 505",
      "addressLocality": "Villa Carlos Paz",
      "addressRegion": "Córdoba",
      "postalCode": "X5152",
      "addressCountry": "AR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -31.420783,
      "longitude": -64.500248
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:30",
        "closes": "13:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "16:30",
        "closes": "20:30"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday"],
        "opens": "09:00",
        "closes": "13:00"
      }
    ],
    "sameAs": [
      "https://wa.me/5493516756248"
    ]
  };

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
