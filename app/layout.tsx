import type { Metadata } from "next"
import "./globals.css"

// Fontes auto-hospedadas em /public/fonts — declaradas em globals.css

export const metadata: Metadata = {
  title: "Amenic Filmes — Cinema Documental",
  description: "Transformamos o seu 'sim' em cinema. Filmagem de casamentos e eventos corporativos em Brasília com estética cinematográfica.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "Amenic Filmes — Cinema Documental",
    description: "Transformamos o seu 'sim' em cinema. Filmagem de casamentos e eventos corporativos em Brasília com estética cinematográfica.",
    url: "https://amenicfilmes.com.br",
    siteName: "Amenic Filmes",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Amenic Filmes" }],
    locale: "pt_BR",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head />
      <body className="min-h-full flex flex-col bg-[#111] text-white">{children}</body>
    </html>
  )
}
