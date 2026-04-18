import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
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

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm tracking-widest uppercase text-white/80">Amenic Filmes</span>
          <span className="text-white/30">|</span>
          <span className="text-white/70 text-sm">{studio?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/50 text-sm hover:text-white transition-colors">
            Ver site
          </Link>
          <Link href="/studio/settings" className="text-white/50 text-sm hover:text-white transition-colors">
            Configurações
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="text-white/50 text-sm hover:text-white transition-colors">
              Sair
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Minhas Galerias</h1>
            <p className="text-white/50 text-sm mt-1">
              {galleries.length} galeria{galleries.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/studio/galleries/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-black font-semibold text-sm hover:bg-[#d4b55a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Galeria
          </Link>
        </div>

        {galleries.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/50 text-sm mb-4">Nenhuma galeria criada ainda</p>
            <Link
              href="/studio/galleries/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-black font-semibold text-sm"
            >
              Criar primeira galeria
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {galleries.map((g) => (
              <GalleryCard key={g.id} gallery={g} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
