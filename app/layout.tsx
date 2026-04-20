import type { Metadata } from "next"
import "./globals.css"

// Google Fonts para seleção de tipografia nas galerias
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap"

export const metadata: Metadata = {
  title: "Amenic Filmes — Cinema Documental",
  description: "Transformamos o seu 'sim' em cinema. Filmagem de casamentos e eventos corporativos em Brasília com estética cinematográfica.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#111] text-white">{children}</body>
    </html>
  )
}
