import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Preço de Disco — lista de consulta",
  description: "Lista rápida para consultar referências e descobrir se um disco está barato.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Preço de Disco — lista de consulta",
    description: "Pesquise, compare e saiba se um disco está barato.",
    images: [{ url: "https://acervo-33-vinil.anamerischneider65.chatgpt.site/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preço de Disco — lista de consulta",
    description: "Pesquise, compare e saiba se um disco está barato.",
    images: ["https://acervo-33-vinil.anamerischneider65.chatgpt.site/og.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
