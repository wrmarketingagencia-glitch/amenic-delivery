"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { VideoPlayer } from "@/components/VideoPlayer"
import Image from "next/image"
import type { Gallery, Studio, Video, Photo, Folder } from "@/app/generated/prisma/client"

type FolderWithItems = Folder & { videos: Video[]; photos: Photo[] }
type GalleryWithAll  = Gallery & { studio: Studio; videos: Video[]; photos: Photo[]; folders: FolderWithItems[] }

/* ══════════════════════════════════════════════════════════════════
   PHOTO LIGHTBOX
   · Full-screen overlay
   · Prev / Next arrows (keyboard ←→ + Esc to close)
   · Thumbnail strip at bottom (scrolls to keep current centred)
   · Download current photo (full-res) + Download ALL (ZIP)
══════════════════════════════════════════════════════════════════ */
function PhotoLightbox({
  photos,
  initialIndex,
  galleryId,
  galleryTitle,
  onClose,
}: {
  photos: Photo[]
  initialIndex: number
  galleryId: string
  galleryTitle: string
  onClose: () => void
}) {
  const [current, setCurrent]       = useState(initialIndex)
  const [imgLoaded, setImgLoaded]   = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dlProgress, setDlProgress] = useState<string | null>(null)
  const thumbListRef = useRef<HTMLDivElement>(null)

  const photo = photos[current]

  const prev = useCallback(() => {
    setImgLoaded(false)
    setCurrent(i => (i - 1 + photos.length) % photos.length)
  }, [photos.length])

  const next = useCallback(() => {
    setImgLoaded(false)
    setCurrent(i => (i + 1) % photos.length)
  }, [photos.length])

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev()
      if (e.key === "ArrowRight") next()
      if (e.key === "Escape")     onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next, onClose])

  /* Scroll active thumbnail into view */
  useEffect(() => {
    const container = thumbListRef.current
    if (!container) return
    const el = container.children[current] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [current])

  /* Lock body scroll while lightbox is open */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  /* Preload fotos anterior e próxima para navegação instantânea */
  useEffect(() => {
    const preload = (idx: number) => {
      if (idx < 0 || idx >= photos.length) return
      const img = new window.Image()
      img.src = photos[idx].url   // full-res — já em cache quando abrir
    }
    preload(current - 1)
    preload(current + 1)
  }, [current, photos])

  /* Touch swipe */
  const touchStartX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 50) dx > 0 ? next() : prev()
  }

  /* Download ALL as ZIP — gerado no cliente via downloadAllPhotos() */
  const downloadAll = async () => {
    if (downloading) return
    setDownloading(true)
    setDlProgress("Iniciando…")
    try {
      await downloadAllPhotos(photos, galleryTitle, setDlProgress)
    } catch (err) {
      console.error("[downloadAll]", err)
      alert("Erro ao gerar o ZIP. Tente novamente.")
    } finally {
      setDownloading(false)
      setDlProgress(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
        {/* Counter */}
        <p className="text-xs text-white/40 tabular-nums font-light">
          {current + 1} <span className="text-white/20">/</span> {photos.length}
        </p>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Download current — fetch+blob pois <a download> é ignorado cross-origin */}
          <button
            onClick={() => downloadSinglePhoto(photo.url)}
            title="Baixar esta foto em alta resolução"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase border border-white/15 text-white/60 hover:text-white hover:border-white/35 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M12 3v13"/><path d="M8 12l4 4 4-4"/><path d="M3 19h18"/>
            </svg>
            <span className="hidden sm:inline">Foto</span>
          </button>
          {/* Download ALL */}
          <button
            onClick={downloadAll}
            disabled={downloading}
            title="Baixar todas as fotos (ZIP)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase border border-white/15 text-white/60 hover:text-white hover:border-white/35 transition-all disabled:opacity-40 disabled:cursor-wait"
          >
            {downloading ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            <span className="hidden sm:inline">{dlProgress ?? (downloading ? "…" : "Todas")}</span>
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            title="Fechar (Esc)"
            className="w-8 h-8 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main image area ─────────────────────────────────────── */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden bg-black">
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-white/10 animate-pulse" />
          </div>
        )}
        {/* Full-resolution image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.caption || ""}
          onLoad={() => setImgLoaded(true)}
          className="max-h-full max-w-full object-contain select-none transition-opacity duration-300"
          style={{ opacity: imgLoaded ? 1 : 0 }}
          draggable={false}
        />

        {/* Prev arrow */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            title="Anterior (←)"
            className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 hover:border-white/40 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}

        {/* Next arrow */}
        {photos.length > 1 && (
          <button
            onClick={next}
            title="Próxima (→)"
            className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 hover:border-white/40 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )}

        {/* Caption */}
        {photo.caption && (
          <div className="absolute bottom-2 left-0 right-0 text-center px-16">
            <p className="text-xs text-white/50 font-light">{photo.caption}</p>
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ─────────────────────────────────────── */}
      {photos.length > 1 && (
        <div
          className="flex-shrink-0 border-t border-white/8"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
        >
          <div
            ref={thumbListRef}
            className="flex gap-1.5 px-3 py-2.5 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setImgLoaded(false); setCurrent(i) }}
                className="flex-shrink-0 overflow-hidden rounded transition-all duration-150"
                style={{
                  width:  56,
                  height: 40,
                  outline: i === current ? "2px solid rgba(255,255,255,0.85)" : "2px solid transparent",
                  opacity: i === current ? 1 : 0.45,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoThumbUrl(p.url, 160, 72)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Bunny CDN Image Optimizer ───────────────────────────────────
   Gera URL com parâmetros de redimensionamento do Bunny CDN Optimizer.
   Requer que o Optimizer esteja habilitado na zona CDN (AMENICFOTOS).
   Se não estiver habilitado, os parâmetros são ignorados e a URL original
   é retornada — sem erros, apenas sem otimização.

   Configurar em: Bunny Dashboard → CDN → AMENICFOTOS → Optimizer
   ────────────────────────────────────────────────────────────── */
function photoThumbUrl(url: string, width: number, quality = 82): string {
  if (!url) return url
  try {
    const u = new URL(url)
    // Não adiciona params em URLs que já têm query string complexa
    u.searchParams.set("width",   String(width))
    u.searchParams.set("quality", String(quality))
    u.searchParams.set("format",  "auto")   // WebP em browsers compatíveis
    return u.toString()
  } catch {
    return url
  }
}

/* ── Foto na galeria: clicável para abrir lightbox ───────────────
   Usa <img> nativo (sem Next.js optimizer) para funcionar no Passenger.
   Mostra fundo cinza enquanto carrega e faz fade-in ao carregar.
   No mobile o botão de download é sempre visível.
   ────────────────────────────────────────────────────────────── */
function GalleryPhoto({
  photo,
  priority = false,
  onClick,
}: {
  photo: Photo
  priority?: boolean
  onClick?: () => void
}) {
  const [loaded, setLoaded] = useState(false)

  // Grid: 800px de largura, qualidade 85 — rápido e nítido
  // Sempre usa photo.url (original) como base para manter qualidade máxima
  const displaySrc = photoThumbUrl(photo.url, 800, 85)

  return (
    <div
      className="relative group overflow-hidden bg-white/5 cursor-zoom-in"
      onClick={onClick}
    >
      {!loaded && <div className="absolute inset-0 bg-white/6 animate-pulse" />}
      {/* Primeiras fotos: eager (aparecem imediatamente). Resto: lazy (carrega conforme rola) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={photo.caption || ""}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        className="w-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
      />
      {/* Download button — full-res original; stops click from bubbling to lightbox */}
      <button
        onClick={e => { e.stopPropagation(); downloadSinglePhoto(photo.url) }}
        title="Baixar foto em alta resolução"
        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 max-sm:opacity-100"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
          <path d="M12 3v13"/><path d="M8 12l4 4 4-4"/><path d="M3 19h18"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Download de foto individual via fetch+blob (CORS * no Bunny) ───
   <a download> é ignorado pelo browser para URLs cross-origin.
   Fetch + blob URL cria uma URL same-origin que força o download.
   ─────────────────────────────────────────────────────────────── */
async function downloadSinglePhoto(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob    = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const ext     = url.split("?")[0].split(".").pop()?.toLowerCase() || "jpg"
    const a       = document.createElement("a")
    a.href        = blobUrl
    a.download    = `foto.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch (err) {
    console.error("[downloadSinglePhoto]", err)
    // Fallback: abrir em nova aba (usuário pode salvar manualmente)
    window.open(url, "_blank")
  }
}

/* ── Download de todas as fotos como ZIP (gerado no cliente) ────────
   Browser busca as fotos direto do CDN (CORS habilitado no Bunny Storage)
   e cria o ZIP localmente com fflate — sem passar pelo servidor,
   sem timeout do LiteSpeed.
   ─────────────────────────────────────────────────────────────── */
async function downloadAllPhotos(
  photos: Photo[],
  galleryTitle: string,
  onProgress: (msg: string | null) => void,
): Promise<void> {
  const { Zip, ZipDeflate } = await import("fflate")

  const safeName = galleryTitle
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s\-_]/gi, "").replace(/\s+/g, "_")
    .slice(0, 80) || "fotos"

  const chunks: Uint8Array[] = []
  await new Promise<void>((resolve, reject) => {
    const zip = new Zip((err, chunk, final) => {
      if (err) { reject(err); return }
      chunks.push(chunk)
      if (final) resolve()
    })

    ;(async () => {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        onProgress(`${i + 1} / ${photos.length}`)
        try {
          const res = await fetch(photo.url)
          if (!res.ok || !res.body) continue
          const buf  = await res.arrayBuffer()
          const ext  = photo.url.split("?")[0].split(".").pop()?.toLowerCase() || "jpg"
          const name = `${String(i + 1).padStart(3, "0")}_foto.${ext}`
          const file = new ZipDeflate(name, { level: 1 })
          zip.add(file)
          file.push(new Uint8Array(buf), true)
        } catch { /* pula foto com falha */ }
      }
      zip.end()
    })().catch(reject)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob(chunks as any[], { type: "application/zip" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `${safeName}_fotos.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  onProgress(null)
}

/* ── Download de vídeo via proxy da API (same-origin, sem CORS) ─────
   A API valida permissões e faz proxy do CDN com Content-Disposition.
   1. showSaveFilePicker — streaming p/ disco sem RAM (Chrome/Edge 86+)
   2. <a download>       — fallback: inicia download via navegação normal
   ─────────────────────────────────────────────────────────────── */
async function triggerVideoDownload(galleryId: string, videoId: string, title: string) {
  const safeName = `${title.replace(/[^a-z0-9\s\-_]/gi, "").trim() || "video"}.mp4`
  const apiUrl   = `/api/galleries/${galleryId}/videos/download?videoId=${videoId}`

  // 1. File System Access API (Chrome/Edge) — streaming direto p/ disco
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: safeName,
        types: [{ description: "Vídeo MP4", accept: { "video/mp4": [".mp4"] } }],
      })
      const res = await fetch(apiUrl)
      if (!res.ok || !res.body) throw new Error("proxy falhou")
      const writable = await handle.createWritable()
      await res.body.pipeTo(writable)
      return
    } catch { /* cancelado ou não suportado — usa fallback */ }
  }

  // 2. <a download> — funciona em todos os browsers (same-origin → sem bloqueio)
  const a = document.createElement("a")
  a.href     = apiUrl
  a.download = safeName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Font map — applied ONLY to the gallery main title (h1) ────────
export const FONT_MAP: Record<string, string> = {
  "Italiana":           "'Italiana', Georgia, serif",
  "Della Respira":      "'Della Respira', Georgia, serif",
  "Raleway":            "'Raleway', system-ui, sans-serif",
  "Slabo 13px":         "'Slabo 13px', Georgia, serif",
  "Cormorant Garamond": "'Cormorant Garamond', Georgia, serif",
  "Playfair Display":   "'Playfair Display', Georgia, serif",
  "Merriweather":       "'Merriweather', Georgia, serif",
  "Lora":               "'Lora', Georgia, serif",
  "Ginger":             "'Ginger', Georgia, serif",
  "TheMacksen":         "'TheMacksen', Georgia, serif",
  "Bridamount":         "'Bridamount', cursive",
  "Thimberly":          "'Thimberly', cursive",
  "Shintia":            "'Shintia', cursive",
  "Housttely":          "'Housttely', cursive",
}

export const UI_FONT = "'Inter', system-ui, sans-serif"

/* ── Shared icons ────────────────────────────────────────────────── */
const IconShare = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 13v6a1 1 0 001 1h14a1 1 0 001-1v-6"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)
const IconCheck = () => (
  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconDownload = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13"/><path d="M8 12l4 4 4-4"/><path d="M3 19h18"/>
  </svg>
)
const IconMusicOn = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)
const IconMusicOff = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
)

/* ── Amenic logo ────────────────────────────────────────────────── */
const AmenicLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const dims = { sm: [80, 20], md: [110, 26], lg: [140, 34] }[size]
  return (
    <Image
      src="/logo-amenic-branco.png"
      alt="Amenic Filmes"
      width={dims[0]}
      height={dims[1]}
      className="object-contain"
      style={{ height: dims[1], width: "auto" }}
      priority
    />
  )
}

/* ── Icon button ────────────────────────────────────────────────── */
const IconBtn = ({ onClick, title, children, active }: { onClick?: () => void; title?: string; children: React.ReactNode; active?: boolean }) => (
  <button onClick={onClick} title={title}
    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all backdrop-blur-sm
      ${active ? "border-white/50 bg-white/10 text-white" : "border-white/15 hover:border-white/35 text-white/70 hover:text-white hover:bg-white/5"}`}>
    {children}
  </button>
)

/* ── Photos section with lightbox wiring ─────────────────────────
   Reused inside all 3 layouts.
   ─────────────────────────────────────────────────────────────── */
function PhotosSection({
  photos,
  galleryId,
  galleryTitle,
  columns = "masonry",
}: {
  photos: Photo[]
  galleryId: string
  galleryTitle: string
  columns?: "masonry" | "sidebar"
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [dlBusy,     setDlBusy]     = useState(false)
  const [dlProgress, setDlProgress] = useState<string | null>(null)

  if (photos.length === 0) return null

  const handleDownloadAll = async () => {
    if (dlBusy) return
    setDlBusy(true)
    setDlProgress("Iniciando…")
    try {
      await downloadAllPhotos(photos, galleryTitle, setDlProgress)
    } catch (err) {
      console.error("[PhotosSection downloadAll]", err)
      alert("Erro ao gerar o ZIP. Tente novamente.")
    } finally {
      setDlBusy(false)
      setDlProgress(null)
    }
  }

  return (
    <>
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          galleryId={galleryId}
          galleryTitle={galleryTitle}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* "Download all" banner */}
      <div className="flex items-center justify-between px-4 py-3 mb-2 mx-1 rounded-lg bg-white/3 border border-white/6">
        <p className="text-xs text-white/40 font-light">
          {photos.length} foto{photos.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={handleDownloadAll}
          disabled={dlBusy}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          {dlBusy ? (
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
          {dlProgress ?? (dlBusy ? "…" : "Baixar todas")}
        </button>
      </div>

      {/* Grid */}
      {columns === "sidebar" ? (
        <div className="grid grid-cols-2 gap-1.5 content-start">
          {photos.map((photo, i) => (
            <div key={photo.id} className="aspect-square overflow-hidden rounded">
              <GalleryPhoto
                photo={photo}
                priority={i < 8}
                onClick={() => setLightboxIndex(i)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-1">
          {photos.map((photo, i) => (
            <div key={photo.id} className="break-inside-avoid mb-1">
              <GalleryPhoto
                photo={photo}
                priority={i < 8}
                onClick={() => setLightboxIndex(i)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT 1: GATSBY  —  RooFilms style
══════════════════════════════════════════════════════════════════ */
function LayoutGatsby({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo,   setActiveVideo]   = useState<Video | null>(null)
  const [activeFolder,  setActiveFolder]  = useState<FolderWithItems | null>(null)
  const [view,          setView]          = useState<"videos" | "photos">("videos")
  const [copied,        setCopied]        = useState(false)
  const [musicPlaying,  setMusicPlaying]  = useState(false)

  const mainVideos    = gallery.videos.filter(v => !v.folderId)
  const activeFolders = gallery.folders.filter(f => f.videos.length > 0)

  const audioRef   = useRef<HTMLAudioElement>(null)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const cardsRef   = useRef<HTMLDivElement>(null)
  const firstVideo = mainVideos[0] ?? null

  useEffect(() => { bgVideoRef.current?.play().catch(() => {}) }, [firstVideo?.mp4Url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !gallery.musicUrl) return
    audio.volume = 0.35
    const tryPlay = () => audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    tryPlay().catch(() => {
      const unlock = () => { tryPlay(); document.removeEventListener("click", unlock); document.removeEventListener("touchstart", unlock); document.removeEventListener("keydown", unlock) }
      document.addEventListener("click",      unlock, { once: true })
      document.addEventListener("touchstart", unlock, { once: true })
      document.addEventListener("keydown",    unlock, { once: true })
    })
  }, [gallery.musicUrl])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) { audio.pause(); setMusicPlaying(false) }
    else              { audio.play().then(() => setMusicPlaying(true)).catch(() => {}) }
  }, [musicPlaying])

  const openVideo = useCallback((video: Video) => {
    audioRef.current?.pause(); setMusicPlaying(false); setActiveVideo(video)
  }, [])

  const closeVideo = useCallback(() => {
    setActiveVideo(null)
    const audio = audioRef.current
    if (audio && gallery.musicUrl) audio.play().then(() => setMusicPlaying(true)).catch(() => {})
  }, [gallery.musicUrl])

  const openFolder  = useCallback((folder: FolderWithItems) => setActiveFolder(folder), [])
  const closeFolder = useCallback(() => setActiveFolder(null), [])

  const handleVideoPlay  = useCallback(() => { audioRef.current?.pause(); setMusicPlaying(false) }, [])
  const handleVideoPause = useCallback(() => {}, [])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }, [])

  const heroSrc = gallery.coverImageUrl || firstVideo?.thumbnailUrl || null

  return (
    <div className="relative" style={{ fontFamily: UI_FONT }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* ════ FULLSCREEN VIDEO OVERLAY ═══════════════════════════ */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-4">
              <button onClick={closeVideo}
                className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-white/50 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M19 12H5M11 6l-6 6 6 6"/>
                </svg>
                Voltar
              </button>
              <div className="w-px h-4 bg-white/12" />
              <p className="text-xs text-white/40 font-light truncate max-w-xs">{activeVideo.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {gallery.musicUrl && (
                <IconBtn onClick={toggleMusic} title={musicPlaying ? "Pausar música" : "Tocar música"} active={musicPlaying}>
                  {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
                </IconBtn>
              )}
              {activeVideo.mp4Url && activeVideo.downloadEnabled && (
                <IconBtn
                  onClick={() => triggerVideoDownload(gallery.id, activeVideo.id, activeVideo.title)}
                  title="Baixar vídeo"
                >
                  <IconDownload />
                </IconBtn>
              )}
              <IconBtn onClick={handleCopyLink} title="Copiar link">
                {copied ? <IconCheck /> : <IconShare />}
              </IconBtn>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <VideoPlayer
              key={activeVideo.id}
              hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
              title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled}
              downloadApiUrl={activeVideo.mp4Url && activeVideo.downloadEnabled ? `/api/galleries/${gallery.id}/videos/download?videoId=${activeVideo.id}` : null}
              fillContainer autoPlay
              onVideoPlay={handleVideoPlay} onVideoPause={handleVideoPause}
            />
          </div>
        </div>
      )}

      {/* ════ HERO + CARDS ═══════════════════════════════════════ */}
      <div className="min-h-screen bg-[#0a0a0a] text-white">

        {/* ── HERO (100vh) ───────────────────────────────────── */}
        <section className="relative w-full overflow-hidden" style={{ height: "100svh" }}>
          {heroSrc && (
            <Image src={heroSrc} alt="" fill className="object-cover" priority sizes="100vw"
              style={{ filter: "brightness(0.55)" }} />
          )}
          {firstVideo?.mp4Url && (
            <video ref={bgVideoRef} src={firstVideo.mp4Url} autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "brightness(0.45)" }} />
          )}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 80%, rgba(10,10,10,1) 100%)" }} />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 sm:px-10 py-6">
            <AmenicLogo size="md" />
            <div className="flex items-center gap-2">
              {gallery.videos.length > 0 && gallery.photos.length > 0 && (
                <div className="flex gap-px bg-black/30 backdrop-blur-md rounded-full p-1 mr-2 border border-white/8">
                  {(["videos", "photos"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className="px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase rounded-full transition-all"
                      style={view === v ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.45)" }}>
                      {v === "videos" ? "Vídeos" : "Fotos"}
                    </button>
                  ))}
                </div>
              )}
              {gallery.musicUrl && (
                <IconBtn onClick={toggleMusic} title={musicPlaying ? "Pausar música" : "Tocar música"} active={musicPlaying}>
                  {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
                </IconBtn>
              )}
              <IconBtn onClick={handleCopyLink} title="Copiar link">
                {copied ? <IconCheck /> : <IconShare />}
              </IconBtn>
            </div>
          </div>

          {/* Title + Play All */}
          <div className="absolute bottom-0 left-0 z-20 px-7 sm:px-10 pb-12 sm:pb-16 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-light leading-[1.0] mb-3 drop-shadow-2xl text-white"
              style={{ fontFamily, letterSpacing: "-0.01em" }}>
              {gallery.title}
            </h1>
            {gallery.subtitle && (
              <p className="text-white/50 text-sm tracking-[0.2em] uppercase font-light mb-8">{gallery.subtitle}</p>
            )}
            {view === "videos" && mainVideos.length > 0 && (
              <button onClick={() => firstVideo && openVideo(firstVideo)}
                className="inline-flex items-center gap-3 px-7 py-3 text-[11px] tracking-[0.3em] uppercase text-white border border-white/40 hover:border-white hover:bg-white/5 transition-all backdrop-blur-sm">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                Play All
              </button>
            )}
          </div>

          {(mainVideos.length > 0 || activeFolders.length > 0) && (
            <div className="absolute bottom-8 right-10 z-20 opacity-40">
              <svg className="w-4 h-4 text-white animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M6 13l6 6 6-6"/>
              </svg>
            </div>
          )}
        </section>

        {/* ── CHAPTER CARDS ─────────────────────────────────── */}
        {view === "videos" && (mainVideos.length > 0 || activeFolders.length > 0) && (
          activeFolder ? (
            <section className="relative bg-[#0a0a0a] pt-10 pb-16 px-7 sm:px-10">
              <button onClick={closeFolder}
                className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-white/35 hover:text-white/70 transition-colors mb-8">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M19 12H5M11 6l-6 6 6 6"/>
                </svg>
                Voltar
              </button>
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 mb-2">{activeFolder.name}</p>
              <p className="text-white/40 text-xs font-light mb-8">{activeFolder.videos.length} vídeo{activeFolder.videos.length !== 1 ? "s" : ""}</p>
              <div ref={cardsRef} className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {activeFolder.videos.map(video => (
                  <button key={video.id} onClick={() => openVideo(video)} className="group flex-shrink-0 text-left" style={{ width: "clamp(260px, 28vw, 420px)" }}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", background: "#111" }}>
                      {video.thumbnailUrl
                        ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ filter: "brightness(0.65) saturate(0.7)" }} />
                        : <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]"><svg className="w-10 h-10 text-white/10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                      }
                      <div className="absolute inset-0 bg-black/25" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border border-white/30 group-hover:border-white/80 backdrop-blur-sm bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300 opacity-60 group-hover:opacity-100">
                          <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                        <p className="text-xs text-white/80 font-light leading-tight truncate">{video.title}</p>
                      </div>
                    </div>
                    <div className="mt-3 pb-1">
                      <p className="text-sm font-light text-white/75 group-hover:text-white transition-colors leading-tight tracking-wide truncate">{video.title}</p>
                      <p className="mt-1.5 text-[10px] tracking-[0.3em] uppercase font-light text-white/40 group-hover:text-white/70 transition-colors">Play Film</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="relative bg-[#0a0a0a] pt-12 pb-16 px-7 sm:px-10">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 mb-8">Filmes</p>
              <div ref={cardsRef} className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {mainVideos.map(video => (
                  <button key={video.id} onClick={() => openVideo(video)} className="group flex-shrink-0 text-left" style={{ width: "clamp(260px, 28vw, 420px)" }}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", background: "#111" }}>
                      {video.thumbnailUrl
                        ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ filter: "brightness(0.65) saturate(0.7)" }} />
                        : <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]"><svg className="w-10 h-10 text-white/10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                      }
                      <div className="absolute inset-0 bg-black/25" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border border-white/30 group-hover:border-white/80 backdrop-blur-sm bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300 opacity-60 group-hover:opacity-100">
                          <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                        <p className="text-xs text-white/80 font-light leading-tight truncate">{video.title}</p>
                      </div>
                    </div>
                    <div className="mt-3 pb-1">
                      <p className="text-sm font-light text-white/75 group-hover:text-white transition-colors leading-tight tracking-wide truncate">{video.title}</p>
                      <p className="mt-1.5 text-[10px] tracking-[0.3em] uppercase font-light text-white/40 group-hover:text-white/70 transition-colors">Play Film</p>
                    </div>
                  </button>
                ))}
                {activeFolders.map(folder => {
                  const cover = folder.videos[0]?.thumbnailUrl ?? null
                  return (
                    <button key={folder.id} onClick={() => openFolder(folder)} className="group flex-shrink-0 text-left" style={{ width: "clamp(260px, 28vw, 420px)" }}>
                      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", background: "#111" }}>
                        {cover
                          ? <img src={cover} alt={folder.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={{ filter: "brightness(0.55) saturate(0.6)" }} />
                          : <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]" />
                        }
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border border-white/30 group-hover:border-white/80 backdrop-blur-sm bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300 opacity-60 group-hover:opacity-100">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                            </svg>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                          <p className="text-[9px] text-white/60 tracking-widest">{folder.videos.length} vídeo{folder.videos.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                          <p className="text-xs text-white/80 font-light leading-tight truncate">{folder.name}</p>
                        </div>
                      </div>
                      <div className="mt-3 pb-1">
                        <p className="text-sm font-light text-white/75 group-hover:text-white transition-colors leading-tight tracking-wide truncate">{folder.name}</p>
                        <p className="mt-1.5 text-[10px] tracking-[0.3em] uppercase font-light text-white/40 group-hover:text-white/70 transition-colors">Ver capítulo</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        )}

        {/* ── PHOTOS ─────────────────────────────────────────── */}
        {view === "photos" && gallery.photos.length > 0 && (
          <section className="pt-4 px-1">
            <PhotosSection
              photos={gallery.photos}
              galleryId={gallery.id}
              galleryTitle={gallery.title}
            />
          </section>
        )}

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <footer className="px-7 sm:px-10 py-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs tracking-[0.35em] uppercase text-white/20 font-light">{gallery.title}</p>
          <AmenicLogo size="sm" />
        </footer>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT 2: EDITORIAL
══════════════════════════════════════════════════════════════════ */
function LayoutEditorial({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo,  setActiveVideo]  = useState<Video | null>(gallery.videos[0] ?? null)
  const [view,         setView]         = useState<"videos" | "photos">("videos")
  const [copied,       setCopied]       = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef  = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !gallery.musicUrl) return
    audio.volume = 0.35
    const tryPlay = () => audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    tryPlay().catch(() => {
      const unlock = () => { tryPlay(); document.removeEventListener("click", unlock); document.removeEventListener("touchstart", unlock) }
      document.addEventListener("click", unlock, { once: true })
      document.addEventListener("touchstart", unlock, { once: true })
    })
  }, [gallery.musicUrl])

  const toggleMusic  = () => { if (!audioRef.current) return; musicPlaying ? (audioRef.current.pause(), setMusicPlaying(false)) : (audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})) }
  const handleVideoPlay  = () => { audioRef.current?.pause(); setMusicPlaying(false) }
  const handleVideoPause = () => { if (!audioRef.current || !gallery.musicUrl) return; audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {}) }
  const handleCopyLink   = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const selectVideo = (video: Video) => {
    setActiveVideo(video)
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: UI_FONT }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      <header className="sticky top-0 z-40 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/6"
        style={{ background: "rgba(8,8,8,0.92)", backdropFilter: "blur(20px)" }}>
        <AmenicLogo size="sm" />
        <div className="text-center flex-1 px-4">
          <h2 className="text-sm font-light text-white/70 tracking-wide truncate">{gallery.title}</h2>
          {gallery.subtitle && <p className="text-[10px] text-white/30 tracking-wider">{gallery.subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {gallery.videos.length > 0 && gallery.photos.length > 0 && (
            <div className="flex gap-px bg-white/5 rounded-full p-0.5 border border-white/8 mr-2">
              {(["videos", "photos"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1 text-[10px] tracking-wider uppercase rounded-full transition-all"
                  style={view === v ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.35)" }}>
                  {v === "videos" ? "Vídeos" : "Fotos"}
                </button>
              ))}
            </div>
          )}
          {gallery.musicUrl && (
            <IconBtn onClick={toggleMusic} title={musicPlaying ? "Pausar" : "Tocar música"} active={musicPlaying}>
              {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
            </IconBtn>
          )}
          <IconBtn onClick={handleCopyLink} title="Copiar link">
            {copied ? <IconCheck /> : <IconShare />}
          </IconBtn>
        </div>
      </header>

      {view === "videos" && (
        <>
          <div ref={playerRef} className="w-full bg-black" style={{ maxHeight: "75vh" }}>
            {activeVideo ? (
              <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "75vh" }}>
                <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
                  title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer
                  downloadApiUrl={activeVideo.mp4Url && activeVideo.downloadEnabled ? `/api/galleries/${gallery.id}/videos/download?videoId=${activeVideo.id}` : null}
                  onVideoPlay={handleVideoPlay} onVideoPause={handleVideoPause} />
              </div>
            ) : gallery.coverImageUrl ? (
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <Image src={gallery.coverImageUrl} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <h1 className="text-3xl sm:text-5xl font-light text-white drop-shadow-xl text-center px-6" style={{ fontFamily }}>{gallery.title}</h1>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center py-24 bg-[#0d0d0d]">
                <h1 className="text-4xl font-light text-white/30" style={{ fontFamily }}>{gallery.title}</h1>
              </div>
            )}
          </div>
          {activeVideo && (
            <div className="px-6 sm:px-10 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="flex items-end gap-[3px] h-3.5">
                {[0, 0.1, 0.05].map((d, i) => (
                  <span key={i} className="w-[2px] rounded-full animate-bounce"
                    style={{ height: `${6 + i * 3}px`, backgroundColor: primaryColor, animationDelay: `${d}s`, animationDuration: "0.7s" }} />
                ))}
              </div>
              <p className="text-xs text-white/50 font-light">Reproduzindo: <span className="text-white/80">{activeVideo.title}</span></p>
            </div>
          )}
          <div className="px-6 sm:px-10 py-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-6">Capítulos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.videos.map((video, idx) => {
                const isActive = activeVideo?.id === video.id
                return (
                  <button key={video.id} onClick={() => selectVideo(video)} className="group text-left transition-all">
                    <div className="relative overflow-hidden rounded bg-white/4" style={{ aspectRatio: "16/9", boxShadow: isActive ? `0 0 0 2px ${primaryColor}` : "none" }}>
                      {video.thumbnailUrl
                        ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        : <div className="w-full h-full flex items-center justify-center"><svg className="w-7 h-7 text-white/15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                      }
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-[9px] text-white/70 font-mono">{idx + 1}</span>
                      </div>
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 rounded-full border border-white/60 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                          </div>
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
                          <div className="flex items-end gap-[3px] h-4">
                            {[0, 0.1, 0.05].map((d, i) => (
                              <span key={i} className="w-[3px] rounded-full animate-bounce"
                                style={{ height: `${7 + i * 3}px`, backgroundColor: primaryColor, animationDelay: `${d}s`, animationDuration: "0.7s" }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 px-0.5">
                      <p className="text-sm font-light truncate" style={{ color: isActive ? primaryColor : "rgba(255,255,255,0.75)" }}>{video.title}</p>
                      {video.durationSeconds != null && (
                        <p className="text-[10px] text-white/30 mt-0.5">{Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {view === "photos" && gallery.photos.length > 0 && (
        <div className="p-2 pt-4">
          <PhotosSection
            photos={gallery.photos}
            galleryId={gallery.id}
            galleryTitle={gallery.title}
          />
        </div>
      )}

      <footer className="px-6 sm:px-10 py-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-2xl font-light text-white/30 tracking-wide" style={{ fontFamily: UI_FONT }}>{gallery.title}</p>
        <AmenicLogo size="sm" />
      </footer>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT 3: CINEMA
══════════════════════════════════════════════════════════════════ */
function LayoutCinema({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo,  setActiveVideo]  = useState<Video | null>(gallery.videos[0] ?? null)
  const [view,         setView]         = useState<"videos" | "photos">("videos")
  const [copied,       setCopied]       = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !gallery.musicUrl) return
    audio.volume = 0.35
    const tryPlay = () => audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    tryPlay().catch(() => {
      const unlock = () => { tryPlay(); document.removeEventListener("click", unlock); document.removeEventListener("touchstart", unlock) }
      document.addEventListener("click", unlock, { once: true })
      document.addEventListener("touchstart", unlock, { once: true })
    })
  }, [gallery.musicUrl])

  const toggleMusic      = () => { if (!audioRef.current) return; musicPlaying ? (audioRef.current.pause(), setMusicPlaying(false)) : (audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})) }
  const handleVideoPlay  = () => { audioRef.current?.pause(); setMusicPlaying(false) }
  const handleVideoPause = () => { if (!audioRef.current || !gallery.musicUrl) return; audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {}) }
  const handleCopyLink   = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden" style={{ fontFamily: UI_FONT }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* ── Left sidebar ──────────────────────────────────────────── */}
      <aside className={`flex-shrink-0 flex flex-col border-r border-white/6 bg-[#0a0a0a] transition-all duration-300 ${sidebarOpen ? "w-64 sm:w-72" : "w-0 overflow-hidden"}`}>
        <div className="flex-shrink-0 px-6 py-6 border-b border-white/6">
          <AmenicLogo size="sm" />
          <p className="text-sm font-light text-white/80 mt-5 leading-snug tracking-wide" style={{ fontFamily: UI_FONT }}>{gallery.title}</p>
          {gallery.subtitle && <p className="text-[11px] text-white/35 mt-1 leading-relaxed">{gallery.subtitle}</p>}
        </div>

        {gallery.videos.length > 0 && gallery.photos.length > 0 && (
          <div className="flex-shrink-0 flex gap-px px-4 py-3 border-b border-white/5">
            {(["videos", "photos"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="flex-1 py-1.5 text-[10px] tracking-[0.15em] uppercase rounded transition-all"
                style={view === v ? { background: `${primaryColor}20`, color: primaryColor } : { color: "rgba(255,255,255,0.3)" }}>
                {v === "videos" ? "Vídeos" : "Fotos"}
              </button>
            ))}
          </div>
        )}

        {view === "videos" && (
          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
            {gallery.videos.map((video, idx) => {
              const isActive = activeVideo?.id === video.id
              return (
                <button key={video.id} onClick={() => setActiveVideo(video)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all group ${isActive ? "bg-white/6" : "hover:bg-white/3"}`}>
                  <div className="relative flex-shrink-0 w-16 h-9 rounded overflow-hidden bg-white/5">
                    {video.thumbnailUrl
                      ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><svg className="w-3 h-3 text-white/20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                    }
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${primaryColor}30` }}>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill={primaryColor}><polygon points="5 3 19 12 5 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-light truncate" style={{ color: isActive ? primaryColor : "rgba(255,255,255,0.65)" }}>{video.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/20">{idx + 1}</span>
                      {video.durationSeconds != null && (
                        <span className="text-[9px] text-white/25">{Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {view === "photos" && (
          <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
            <PhotosSection
              photos={gallery.photos}
              galleryId={gallery.id}
              galleryTitle={gallery.title}
              columns="sidebar"
            />
          </div>
        )}

        <div className="flex-shrink-0 px-4 py-4 border-t border-white/6 flex items-center gap-2">
          {gallery.musicUrl && <IconBtn onClick={toggleMusic} active={musicPlaying} title="Música">{musicPlaying ? <IconMusicOn /> : <IconMusicOff />}</IconBtn>}
          {activeVideo?.mp4Url && activeVideo.downloadEnabled && (
            <IconBtn
              onClick={() => triggerVideoDownload(gallery.id, activeVideo.id, activeVideo.title)}
              title="Baixar vídeo"
            >
              <IconDownload />
            </IconBtn>
          )}
          <IconBtn onClick={handleCopyLink} title="Copiar link">{copied ? <IconCheck /> : <IconShare />}</IconBtn>
        </div>
      </aside>

      {/* ── Right: video player / hero ────────────────────────────── */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <button onClick={() => setSidebarOpen(o => !o)}
          className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/15 hover:border-white/30 backdrop-blur-sm flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            {sidebarOpen ? <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/> : <path d="M13 7l5 5-5 5M6 7l5 5-5 5"/>}
          </svg>
        </button>

        {view === "videos" && activeVideo ? (
          <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
            title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer
            downloadApiUrl={activeVideo.mp4Url && activeVideo.downloadEnabled ? `/api/galleries/${gallery.id}/videos/download?videoId=${activeVideo.id}` : null}
            onVideoPlay={handleVideoPlay} onVideoPause={handleVideoPause} />
        ) : view === "videos" && gallery.coverImageUrl ? (
          <div className="w-full h-full relative">
            <Image src={gallery.coverImageUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-12">
              <h1 className="text-5xl lg:text-7xl font-light text-white drop-shadow-2xl" style={{ fontFamily }}>{gallery.title}</h1>
              {gallery.subtitle && <p className="text-white/50 text-lg mt-4 font-light">{gallery.subtitle}</p>}
              {gallery.videos.length > 0 && (
                <button onClick={() => setActiveVideo(gallery.videos[0])}
                  className="mt-8 inline-flex items-center gap-3 px-8 py-3 text-xs tracking-[0.3em] uppercase transition-all hover:opacity-80"
                  style={{ background: primaryColor, color: "#000" }}>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                  Reproduzir
                </button>
              )}
            </div>
          </div>
        ) : view === "photos" ? (
          <div className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            {/* Full-screen photos handled by PhotosSection's own lightbox */}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <h1 className="text-5xl font-light text-white/20" style={{ fontFamily }}>{gallery.title}</h1>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Main export
══════════════════════════════════════════════════════════════════ */
export function GalleryViewer({ gallery }: { gallery: GalleryWithAll }) {
  const primaryColor = gallery.primaryColor || gallery.studio.primaryColor || "#C9A84C"
  const fontFamily   = FONT_MAP[gallery.fontFamily] ?? FONT_MAP["Playfair Display"]

  if (gallery.layout === "editorial") return <LayoutEditorial gallery={gallery} primaryColor={primaryColor} fontFamily={fontFamily} />
  if (gallery.layout === "cinema")    return <LayoutCinema    gallery={gallery} primaryColor={primaryColor} fontFamily={fontFamily} />
  return                                     <LayoutGatsby    gallery={gallery} primaryColor={primaryColor} fontFamily={fontFamily} />
}
