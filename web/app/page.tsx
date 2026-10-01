import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const description =
  "Organiza ingresos, gastos, presupuestos y gastos en pareja. Controla tu dinero, divide gastos y entiende mejor tus finanzas con SFIQ.";

export const metadata: Metadata = {
  title: "SFIQ | Control de gastos y finanzas personales en pareja",
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://sfiq.app/",
    title: "SFIQ | Control de gastos y finanzas personales en pareja",
    description,
    siteName: "SFIQ",
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: "SFIQ | Control de gastos y finanzas personales en pareja",
    description,
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SFIQ",
  url: "https://sfiq.app/",
  description,
  inLanguage: "es",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomePageClient />
    </>
  );
}
