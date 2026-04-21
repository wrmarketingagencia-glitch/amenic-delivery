import type { Metadata } from "next"
import "./globals.css"

// Google Fonts — tipografia das galerias (título principal)
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700" +
  "&family=Italiana" +
  "&family=Della+Respira" +
  "&family=Raleway:ital,wght@0,300;0,400;0,500;1,300;1,400" +
  "&family=Slabo+13px" +
  "&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500" +
  "&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400" +
  "&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500" +
  "&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500" +
  "&display=swap"

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#111] text-white">{children}</body>
    </html>
  )
}
