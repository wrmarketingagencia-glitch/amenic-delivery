import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { GalleryCard } from "./GalleryCard"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/studio/login")

  const [studio, galleries] = await Promise.all([
    db.studio.findUnique({ where: { id: session.user.id } }),
    db.gallery.findMany({
      where: { studioId: session.user.id },
      include: { _count: { select: { videos: true, photos: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Group by year
  const byYear = galleries.reduce<Record<string, typeof galleries>>((acc, g) => {
    const year = new Date(g.createdAt).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(g)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {studio?.logoUrl ? (
            <Image src={studio.logoUrl} alt={studio.name} width={32} height={32} className="rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-black text-xs font-bold">
              {studio?.name?.[0]}
            </div>
          )}
          <span className="text-white/80 text-sm font-medium tracking-wide">{studio?.name}</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/" className="text-white/40 text-sm hover:text-white transition-colors">
            Ver site
          </Link>
          <Link href="/studio/settings" className="text-white/40 text-sm hover:text-white transition-colors">
            Configurações
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="text-white/40 text-sm hover:text-white transition-colors">Sair</button>
          </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-light tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Minhas Galerias
            </h1>
            <p className="text-white/30 text-sm mt-1">
              {galleries.length} galeria{galleries.length !== 1 ? "s" : ""} no total
            </p>
          </div>
          <Link
            href="/studio/galleries/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b55a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Galeria
          </Link>
        </div>

        {galleries.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/8 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm mb-6">Nenhuma galeria criada ainda</p>
            <Link
              href="/studio/galleries/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b55a] transition-colors"
            >
              Criar primeira galeria
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {years.map((year) => (
              <section key={year}>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="text-white/50 text-sm font-semibold tracking-widest uppercase">{year}</h2>
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-white/25 text-xs">{byYear[year].length} galeria{byYear[year].length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {byYear[year].map((g) => (
                    <GalleryCard key={g.id} gallery={g} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
