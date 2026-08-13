import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acervo 33 — catálogo e preços de discos",
  description: "Um catálogo independente de discos, leilões e pesquisas de preço em vinil.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
