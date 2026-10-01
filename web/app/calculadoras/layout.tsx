import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadoras financieras gratis: presupuesto, 50/30/20 y gastos en pareja",
  description:
    "Calcula tu presupuesto mensual, aplica la regla 50/30/20 y divide gastos en pareja con porcentajes personalizados en SFIQ.",
};

export default function CalculadorasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
