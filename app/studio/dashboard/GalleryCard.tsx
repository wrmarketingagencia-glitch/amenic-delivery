"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Gallery } from "@/app/generated/prisma/client"

type Props = {
  gallery: Gallery & { _count: { videos: number; photos: number } }
}

export function GalleryCard({ gallery }: Props) {
  const router = useRouter()
  const shareUrl = `${window?.location?.origin ?? ""}/g/${gallery.slug}`

  const deleteGallery = async () => {
    if (!confirm(`Deletar "${gallery.title}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/galleries/${gallery.id}`, { method: "DELETE" })
    if (res.ok) router.refresh()
  }

  return (
    <div className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl overflow-hidden group transition-colors">
      {/* Cover */}
      <div className="aspect-video bg-white/5 relative">
        {gallery.coverImageUrl ? (
          <img
            src={gallery.coverImageUrl}
            alt={gallery.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
          gallery.isPublished
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
        }`}>
          {gallery.isPublished ? "Publicada" : "Rascunho"}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-0.5 truncate">{gallery.title}</h3>
        {gallery.subtitle && (
          <p className="text-white/50 text-xs truncate mb-2">{gallery.subtitle}</p>
        )}

        <div className="flex items-center gap-3 text-white/40 text-xs mb-4">
          <span>{gallery._count.videos} vídeo{gallery._count.videos !== 1 ? "s" : ""}</span>
          {gallery._count.photos > 0 && <span>{gallery._count.photos} fotos</span>}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/studio/galleries/${gallery.id}`}
            className="flex-1 py-2 text-center text-sm text-white/70 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
          >
            Editar
          </Link>
          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            className="flex-1 py-2 text-center text-sm text-black bg-[#C9A84C] rounded-lg hover:bg-[#d4b55a] transition-colors font-medium"
          >
            Ver
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/g/${gallery.slug}`)}
            className="w-9 h-9 flex items-center justify-center border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-white/50"
            title="Copiar link"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={deleteGallery}
            className="w-9 h-9 flex items-center justify-center border border-white/20 rounded-lg hover:bg-red-500/20 hover:border-red-500/40 transition-colors text-white/50 hover:text-red-400"
            title="Deletar galeria"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
