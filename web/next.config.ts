import type { NextConfig } from "next";

const privateRoutes = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/espacio",
  "/dashboard",
  "/pareja",
  "/nuevo-gasto",
  "/nuevo-ingreso",
  "/movimientos",
  "/presupuestos",
  "/estadisticas",
  "/categorias",
  "/metodos-pago",
  "/deudas",
  "/saldar-deuda",
  "/detalle-gasto",
  "/chat-gasto",
  "/perfil",
  "/ajustes",
  "/datos",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return privateRoutes.map((source) => ({
      source,
      headers: [
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow, noarchive",
        },
      ],
    }));
  },
};

export default nextConfig;
