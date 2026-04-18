import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Amenic Filmes — Cinema Documental",
  description: "Transformamos o seu 'sim' em cinema. Filmagem de casamentos e eventos corporativos em Brasília com estética cinematográfica.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#111] text-white">{children}</body>
    </html>
  )
}
