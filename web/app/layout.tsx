import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { RegistrarSW } from "@/components/RegistrarSW";

// Toda la escala de la marca: Light 300 (captions), Regular 400 (cuerpo),
// Medium 500 (destacados), SemiBold 600 (subtítulos), Bold 700 (títulos),
// ExtraBold 800 / Black 900 (impacto). Ver manual de marca, pág 7.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// El <link rel="manifest"> lo agrega Next solo desde app/manifest.ts.
export const metadata: Metadata = {
  title: "Quin",
  description: "Control diario de ventas — Agencia Quin",
  appleWebApp: { capable: true, title: "Quin", statusBarStyle: "default" },
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00A89D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body>
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
