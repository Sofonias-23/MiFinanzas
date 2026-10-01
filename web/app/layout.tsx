import type { Metadata } from "next";
import AdSenseBootstrap from "../components/AdSenseBootstrap";
import CookieConsent from "../components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sfiq.app"),
  title: {
    default: "SFIQ | Control de gastos y finanzas personales en pareja",
    template: "%s | SFIQ",
  },
  description:
    "Organiza ingresos, gastos, presupuestos y gastos en pareja. Controla tu dinero, divide gastos y entiende mejor tus finanzas con SFIQ.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AdSenseBootstrap />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
