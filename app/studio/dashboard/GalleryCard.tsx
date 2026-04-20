"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Gallery } from "@/app/generated/prisma/client"

type Props = {
  gallery: Gallery & { _count: { videos: number; photos: number } }
}

export function GalleryCard({ gallery }: Props) {
  const router = useRouter()

  const deleteGallery = async () => {
    if (!confirm(`Deletar "${gallery.title}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/galleries/${gallery.id}`, { method: "DELETE" })
    if (res.ok) router.refresh()
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/g/${gallery.slug}`)
  }

  return (
    <div className="group relative rounded-xl overflow-hidden bg-[#181818] border border-white/8 hover:border-white/20 transition-all duration-300">
      {/* Cover image */}
      <div className="aspect-video relative bg-[#111] overflow-hidden">
        {gallery.coverImageUrl ? (
          <Image
            src={gallery.coverImageUrl}
            alt={gallery.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <svg className="w-9 h-9 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-white/20 text-xs">Sem capa</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${
          gallery.isPublished
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-white/10 text-white/50 border border-white/15"
        }`}>
          {gallery.isPublished ? "● Publicada" : "Rascunho"}
        </div>

        {/* Quick actions (shown on hover) */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={copyLink}
            title="Copiar link"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            title="Ver galeria"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={deleteGallery}
            title="Deletar"
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white/40 hover:text-red-400 flex items-center justify-center transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Title at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <h3 className="font-semibold text-white text-base leading-tight drop-shadow" style={{ fontFamily: "Georgia, serif" }}>
            {gallery.title}
          </h3>
          {gallery.subtitle && (
            <p className="text-white/60 text-xs mt-0.5 truncate">{gallery.subtitle}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 text-white/35 text-xs">
          {gallery._count.videos > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              {gallery._count.videos}
            </span>
          )}
          {gallery._count.photos > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {gallery._count.photos}
            </span>
          )}
          {gallery.password && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Com senha
            </span>
          )}
        </div>

        <Link
          href={`/studio/galleries/${gallery.id}`}
          className="px-3.5 py-1.5 text-xs font-medium text-black bg-[#C9A84C] rounded-lg hover:bg-[#d4b55a] transition-colors"
        >
          Editar
        </Link>
      </div>
    </div>
  )
}
