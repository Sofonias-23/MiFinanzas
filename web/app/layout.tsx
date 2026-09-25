import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiFinanzas | Finanzas personales y en pareja",
  description:
    "Organiza tus gastos personales, gastos en pareja, deudas, metas y estadísticas en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
