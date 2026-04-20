"use client"

import { useState, useRef, useCallback } from "react"
import { VideoPlayer } from "@/components/VideoPlayer"
import Image from "next/image"
import type { Gallery, Studio, Video, Photo } from "@/app/generated/prisma/client"

type GalleryWithAll = Gallery & { studio: Studio; videos: Video[]; photos: Photo[] }

const FONT_MAP: Record<string, string> = {
  Georgia:    "Georgia, serif",
  Ginger:     "'Ginger', Georgia, serif",
  TheMacksen: "'TheMacksen', Georgia, serif",
  Bridamount: "'Bridamount', cursive",
  Thimberly:  "'Thimberly', cursive",
  Shintia:    "'Shintia', cursive",
  Housttely:  "'Housttely', cursive",
}

export function GalleryViewer({ gallery }: { gallery: GalleryWithAll }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [view, setView] = useState<"videos" | "photos">("videos")
  const [copied, setCopied] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const primaryColor = gallery.primaryColor || gallery.studio.primaryColor || "#C9A84C"
  const fontFamily = FONT_MAP[gallery.fontFamily] ?? FONT_MAP["Georgia"]

  const handlePlayAll = () => {
    if (gallery.videos[0]) setActiveVideo(gallery.videos[0])
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // TV — fullscreen na tag <video> nativa
  const handleWatchOnTV = useCallback(() => {
    const videoEl = document.querySelector("video")
    if (!videoEl) return
    if (videoEl.requestFullscreen) videoEl.requestFullscreen()
    else if ((videoEl as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      ;(videoEl as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen()
    }
  }, [])

  // Download — baixa o MP4 do vídeo ativo
  const handleDownload = useCallback(() => {
    if (!activeVideo?.mp4Url) return
    const a = document.createElement("a")
    a.href = activeVideo.mp4Url
    a.download = `${activeVideo.title}.mp4`
    a.target = "_blank"
    a.click()
  }, [activeVideo])

  const showDownload = activeVideo?.mp4Url && activeVideo.downloadEnabled
  const showTV = !!activeVideo

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white" style={{ fontFamily }}>

      {/* ─── HERO / PLAYER ───────────────────────────────────────────── */}
      <section className="relative" style={{ height: "100svh" }}>

        {/* Background cover (sem vídeo ativo) */}
        {!activeVideo && gallery.coverImageUrl && (
          <div className="absolute inset-0">
            <Image src={gallery.coverImageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.45) 100%)"
            }} />
          </div>
        )}

        {/* Gradiente de fallback */}
        {!activeVideo && !gallery.coverImageUrl && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1c1c1c,#2a2a2a)" }} />
        )}

        {/* Player de vídeo */}
        {activeVideo && (
          <div className="absolute inset-0 bg-black">
            <VideoPlayer
              hlsUrl={activeVideo.hlsUrl}
              mp4Url={activeVideo.mp4Url}
              thumbnailUrl={activeVideo.thumbnailUrl}
              title={activeVideo.title}
              primaryColor={primaryColor}
              downloadEnabled={activeVideo.downloadEnabled}
            />
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
          {/* Logo / Studio */}
          <div className="flex items-center gap-3">
            {gallery.studio.logoUrl ? (
              <Image src={gallery.studio.logoUrl} alt={gallery.studio.name} width={36} height={36} className="rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: primaryColor, color: "#111" }}>
                {gallery.studio.name[0]}
              </div>
            )}
            <span className="font-semibold text-white/90 text-sm tracking-wide hidden sm:block">
              {gallery.studio.name}
            </span>
          </div>

          {/* Ações direita */}
          <div className="flex items-center gap-1.5">
            {/* Vídeos / Fotos toggle */}
            {gallery.videos.length > 0 && gallery.photos.length > 0 && (
              <div className="flex gap-0.5 bg-black/30 backdrop-blur-sm rounded-full p-1 mr-1">
                <button onClick={() => setView("videos")}
                  className="px-3 py-1 text-xs rounded-full transition-all"
                  style={view === "videos" ? { background: primaryColor, color: "#111", fontWeight: 600 } : { color: "rgba(255,255,255,0.55)" }}>
                  Vídeos
                </button>
                <button onClick={() => setView("photos")}
                  className="px-3 py-1 text-xs rounded-full transition-all"
                  style={view === "photos" ? { background: primaryColor, color: "#111", fontWeight: 600 } : { color: "rgba(255,255,255,0.55)" }}>
                  Fotos
                </button>
              </div>
            )}

            {/* TV (fullscreen) */}
            {showTV && (
              <button onClick={handleWatchOnTV} title="Assistir em tela cheia"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            {/* Download */}
            {showDownload && (
              <button onClick={handleDownload} title="Baixar vídeo"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}

            {/* Voltar ao hero */}
            {activeVideo && (
              <button onClick={() => setActiveVideo(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Início
              </button>
            )}

            {/* Compartilhar */}
            <button onClick={handleCopyLink} title="Copiar link"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors">
              {copied ? (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* ── Conteúdo do hero (título + play all) ───────────────────── */}
        {!activeVideo && (
          <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-10">
            <h1 className="text-5xl lg:text-7xl font-light leading-tight mb-2 drop-shadow-lg">
              {gallery.title}
            </h1>
            {gallery.subtitle && (
              <p className="text-white/60 text-lg mb-8 drop-shadow">{gallery.subtitle}</p>
            )}
            {gallery.videos.length > 0 && view === "videos" && (
              <button onClick={handlePlayAll}
                className="inline-flex items-center gap-3 px-8 py-3 text-black font-semibold text-sm tracking-widest uppercase transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Reproduzir Tudo
              </button>
            )}
          </div>
        )}
      </section>

      {/* ─── CARROSSEL DE VÍDEOS ─────────────────────────────────────── */}
      {view === "videos" && gallery.videos.length > 0 && (
        <div className="bg-[#0e0e0e] border-t border-white/5">
          <div className="flex gap-3 overflow-x-auto px-6 py-5" style={{ scrollbarWidth: "none" }}>
            {gallery.videos.map((video) => (
              <button key={video.id} onClick={() => setActiveVideo(video)}
                className="flex-shrink-0 group relative rounded-lg overflow-hidden transition-all"
                style={{
                  width: 220,
                  outline: activeVideo?.id === video.id ? `2px solid ${primaryColor}` : "2px solid transparent",
                  outlineOffset: 2,
                }}>
                <div className="aspect-video bg-white/5 relative">
                  {video.thumbnailUrl ? (
                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" sizes="220px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                      <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  {activeVideo?.id === video.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: primaryColor }}>
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 bg-[#161616]">
                  <p className="text-white/80 text-xs font-medium truncate">{video.title}</p>
                  {video.durationSeconds != null && (
                    <p className="text-white/40 text-xs mt-0.5">
                      {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── GRID DE FOTOS ───────────────────────────────────────────── */}
      {view === "photos" && gallery.photos.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 p-3 bg-[#0e0e0e]">
          {gallery.photos.map((photo) => (
            <div key={photo.id} className="break-inside-avoid mb-2 rounded-md overflow-hidden">
              <Image src={photo.url} alt={photo.caption || ""} width={500} height={400}
                className="w-full object-cover hover:scale-[1.02] transition-transform duration-500" />
            </div>
          ))}
        </div>
      )}

      {/* ─── FOOTER AMENIC ───────────────────────────────────────────── */}
      <footer className="px-6 py-5 flex items-center justify-center bg-[#0e0e0e] border-t border-white/5">
        <a href="/" className="opacity-40 hover:opacity-70 transition-opacity">
          <Image src="/logo-amenic.png" alt="Amenic Filmes" width={120} height={32} className="object-contain w-auto h-7" />
        </a>
      </footer>
    </div>
  )
}
