import type { Metadata } from "next";

const description =
  "Calcula tu presupuesto mensual, aplica la regla 50/30/20 y divide gastos en pareja con porcentajes personalizados en SFIQ.";

export const metadata: Metadata = {
  title: "Calculadoras financieras gratis: presupuesto, 50/30/20 y gastos en pareja",
  description,
  alternates: {
    canonical: "/calculadoras",
  },
  openGraph: {
    type: "website",
    url: "https://sfiq.app/calculadoras",
    title: "Calculadoras financieras gratis | SFIQ",
    description,
    siteName: "SFIQ",
    locale: "es_PE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculadoras financieras gratis | SFIQ",
    description,
  },
};

const calculatorsSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Calculadoras financieras de SFIQ",
  url: "https://sfiq.app/calculadoras",
  description,
  inLanguage: "es",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Calculadora de presupuesto mensual",
        url: "https://sfiq.app/calculadoras#presupuesto",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Calculadora regla 50/30/20",
        url: "https://sfiq.app/calculadoras#503020",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Calculadora para dividir gastos en pareja",
        url: "https://sfiq.app/calculadoras#pareja",
      },
    ],
  },
};

export default function CalculadorasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorsSchema) }}
      />
      {children}
    </>
  );
}
