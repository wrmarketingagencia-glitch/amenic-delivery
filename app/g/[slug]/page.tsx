import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { GalleryViewer } from "./GalleryViewer"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pw?: string }>
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { pw } = await searchParams

  const gallery = await db.gallery.findFirst({
    where: { slug, isPublished: true },
    include: {
      studio: true,
      videos: { orderBy: { order: "asc" } },
      photos: { orderBy: { order: "asc" } },
    },
  })

  if (!gallery) notFound()

  if (gallery.password && gallery.password !== pw) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <PasswordForm slug={slug} />
      </div>
    )
  }

  return <GalleryViewer gallery={gallery} />
}

function PasswordForm({ slug }: { slug: string }) {
  return (
    <div className="text-center px-6">
      <div className="mb-6">
        <svg className="w-12 h-12 text-white/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-white text-xl font-semibold mb-1">Galeria Protegida</h2>
        <p className="text-white/50 text-sm">Digite a senha para acessar</p>
      </div>
      <form action={`/g/${slug}`} method="get" className="flex flex-col gap-3 max-w-xs mx-auto">
        <input
          type="password"
          name="pw"
          placeholder="Senha da galeria"
          className="px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-white/50"
          autoFocus
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-[#C9A84C] text-black font-semibold hover:bg-[#d4b55a] transition-colors"
        >
          Acessar
        </button>
      </form>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const gallery = await db.gallery.findUnique({
    where: { slug },
    include: { studio: true },
  })
  if (!gallery) return {}
  return {
    title: `${gallery.title} — ${gallery.studio.name}`,
    description: gallery.subtitle || `Galeria de ${gallery.studio.name}`,
    openGraph: {
      images: gallery.coverImageUrl ? [gallery.coverImageUrl] : [],
    },
  }
}
