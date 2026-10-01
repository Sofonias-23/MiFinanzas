import type { Metadata } from "next";
import AdSenseBootstrap from "../components/AdSenseBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sfiq.app"),
  title: {
    default: "SFIQ | Control de gastos y finanzas personales en pareja",
    template: "%s | SFIQ",
  },
  description:
    "Organiza ingresos, gastos, presupuestos y gastos en pareja. Controla tu dinero, divide gastos y entiende mejor tus finanzas con SFIQ.",
  other: {
    "google-adsense-account": "ca-pub-2118685293203157",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AdSenseBootstrap />
        {children}
      </body>
    </html>
  );
}
