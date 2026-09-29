import type { Metadata } from "next";
import AdSenseBootstrap from "../components/AdSenseBootstrap";
import CookieConsent from "../components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "SFIQ | Smart Financial Intelligence",
  description:
    "Organiza tus gastos personales, gastos en pareja, deudas, metas y estadísticas en un solo lugar.",
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
