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
  title: "FB Lubricentro | Servicio Automotriz y Mecánica Ligera",
  description: "Servicio profesional de lubricentro, cambio de aceite, filtros y mecánica ligera. Agenda tu turno online de forma rápida y sencilla.",
  openGraph: {
    title: "FB Lubricentro",
    description: "Tu lubricentro de confianza. Reserva tu turno online.",
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
    "name": "FB Lubricentro",
    "image": "https://lubri-app.vercel.app/og-image.jpg", // Placeholder
    "description": "Servicio de lubricentro y mecánica ligera.",
    "url": "https://lubri-app.vercel.app",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Argentina",
      "addressCountry": "AR"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday"],
        "opens": "08:00",
        "closes": "13:00"
      }
    ]
  };

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
