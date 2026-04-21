"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { VideoPlayer } from "@/components/VideoPlayer"
import Image from "next/image"
import type { Gallery, Studio, Video, Photo } from "@/app/generated/prisma/client"

type GalleryWithAll = Gallery & { studio: Studio; videos: Video[]; photos: Photo[] }

export const FONT_MAP: Record<string, string> = {
  "Playfair Display": "'Playfair Display', Georgia, serif",
  "Merriweather":     "'Merriweather', Georgia, serif",
  "Lora":             "'Lora', Georgia, serif",
  "Ginger":           "'Ginger', Georgia, serif",
  "TheMacksen":       "'TheMacksen', Georgia, serif",
  "Bridamount":       "'Bridamount', cursive",
  "Thimberly":        "'Thimberly', cursive",
  "Shintia":          "'Shintia', cursive",
  "Housttely":        "'Housttely', cursive",
}

/* ── Thin elegant icons ─────────────────────────────────────────── */
const IconShare = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 13v6a1 1 0 001 1h14a1 1 0 001-1v-6" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)
const IconCheck = () => (
  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconDownload = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13" /><path d="M8 12l4 4 4-4" /><path d="M3 19h18" />
  </svg>
)
const IconMusicOn = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
)
const IconMusicOff = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)
const IconPhotos = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

/* ══════════════════════════════════════════════════════════════════
   LAYOUT: GATSBY — Vidflow-style immersive delivery
   · First video plays as silent background on load
   · Music auto-starts
   · Thumbnail strip pinned to bottom
   · Click thumbnail → full player with back-10s + animated icon
══════════════════════════════════════════════════════════════════ */
function LayoutGatsby({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [view, setView]               = useState<"videos" | "photos">("videos")
  const [copied, setCopied]           = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)

  const audioRef   = useRef<HTMLAudioElement>(null)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const stripRef   = useRef<HTMLDivElement>(null)

  const firstVideo = gallery.videos[0] ?? null

  /* Auto-start music */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !gallery.musicUrl) return
    audio.volume = 0.3
    audio.play().then(() => setMusicPlaying(true)).catch(() => {})
  }, [gallery.musicUrl])

  /* Auto-play bg video */
  useEffect(() => {
    const v = bgVideoRef.current
    if (!v || !firstVideo?.mp4Url) return
    v.play().catch(() => {})
  }, [firstVideo?.mp4Url])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) { audio.pause(); setMusicPlaying(false) }
    else              { audio.play();  setMusicPlaying(true)  }
  }, [musicPlaying])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [])

  const handleDownload = useCallback(() => {
    if (!activeVideo?.mp4Url) return
    const a = document.createElement("a")
    a.href = activeVideo.mp4Url
    a.download = `${activeVideo.title}.mp4`
    a.target = "_blank"
    a.click()
  }, [activeVideo])

  const selectVideo = useCallback((video: Video) => {
    setActiveVideo(video)
    /* scroll thumbnail into view */
    setTimeout(() => {
      const el = document.getElementById(`thumb-${video.id}`)
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }, 50)
  }, [])

  const closePlayer = useCallback(() => {
    setActiveVideo(null)
  }, [])

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden" style={{ fontFamily }}>

      {/* ── Music audio ──────────────────────────────────────────── */}
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* ── Full-screen background (behind everything) ───────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base: static image always visible (cover > first video thumbnail) */}
        {!activeVideo && (gallery.coverImageUrl || firstVideo?.thumbnailUrl) && (
          <Image
            src={gallery.coverImageUrl || firstVideo!.thumbnailUrl!}
            alt="" fill className="object-cover" priority sizes="100vw"
          />
        )}
        {/* Video layer on top — plays silently when mp4Url available */}
        {!activeVideo && firstVideo?.mp4Url && (
          <video
            ref={bgVideoRef}
            src={firstVideo.mp4Url}
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient: dark bottom-left (title), lighter top-right */}
        {!activeVideo && (
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.40) 45%, rgba(0,0,0,0.10) 75%, rgba(0,0,0,0.30) 100%)",
          }} />
        )}
      </div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-5 py-4">
        <div className="flex items-center">
          <Image
            src="/logo-amenic-branco.png"
            alt="Amenic Filmes"
            width={130}
            height={28}
            className="object-contain h-7 w-auto"
            priority
          />
        </div>

        <div className="flex items-center gap-1.5">
          {gallery.videos.length > 0 && gallery.photos.length > 0 && (
            <div className="flex gap-px bg-black/30 backdrop-blur-md rounded-full p-1 mr-1 border border-white/8">
              <button onClick={() => { setView("videos"); setActiveVideo(null) }}
                className="px-3.5 py-1.5 text-xs tracking-[0.15em] uppercase rounded-full transition-all"
                style={view === "videos" ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.35)" }}>
                Vídeos
              </button>
              <button onClick={() => { setView("photos"); setActiveVideo(null) }}
                className="px-3.5 py-1.5 text-xs tracking-[0.15em] uppercase rounded-full transition-all"
                style={view === "photos" ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.35)" }}>
                Fotos
              </button>
            </div>
          )}
          {gallery.musicUrl && (
            <button onClick={toggleMusic} title={musicPlaying ? "Pausar música" : "Tocar música"}
              className="w-9 h-9 rounded-full border border-white/15 hover:border-white/35 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/5">
              {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
            </button>
          )}
          {activeVideo?.mp4Url && activeVideo.downloadEnabled && (
            <button onClick={handleDownload} title="Baixar vídeo"
              className="w-9 h-9 rounded-full border border-white/15 hover:border-white/35 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/5">
              <IconDownload />
            </button>
          )}
          <button onClick={handleCopyLink} title="Copiar link"
            className="w-9 h-9 rounded-full border border-white/15 hover:border-white/35 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/5">
            {copied ? <IconCheck /> : <IconShare />}
          </button>
          {activeVideo && (
            <button onClick={closePlayer}
              className="ml-1 flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase text-white/50 hover:text-white border border-white/15 hover:border-white/30 rounded-full transition-all backdrop-blur-sm">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
              Início
            </button>
          )}
        </div>
      </header>

      {/* ── Middle area: flex-1, player or center text ───────────── */}
      <div className="relative z-10 flex-1 min-h-0">
        {/* Active video player fills exactly this area */}
        {activeVideo && (
          <div className="absolute inset-0 bg-black">
            <VideoPlayer
              hlsUrl={activeVideo.hlsUrl}
              mp4Url={activeVideo.mp4Url}
              thumbnailUrl={activeVideo.thumbnailUrl}
              title={activeVideo.title}
              primaryColor={primaryColor}
              downloadEnabled={activeVideo.downloadEnabled}
              fillContainer
            />
          </div>
        )}

        {/* Title — bottom-left, like reference */}
        {!activeVideo && view === "videos" && (
          <div className="absolute bottom-0 left-0 px-8 pb-8 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] mb-3 drop-shadow-2xl">
              {gallery.title}
            </h1>
            {gallery.subtitle && (
              <p className="text-white/55 text-sm font-light tracking-wide mb-6">{gallery.subtitle}</p>
            )}
            {gallery.videos.length > 0 && (
              <button
                onClick={() => firstVideo && selectVideo(firstVideo)}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 text-xs tracking-[0.2em] uppercase border border-white/30 hover:border-white/60 text-white/70 hover:text-white transition-all backdrop-blur-sm"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
                Reproduzir tudo
              </button>
            )}
          </div>
        )}

        {/* Photos grid */}
        {view === "photos" && !activeVideo && (
          <div className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-1 p-1">
              {gallery.photos.map((photo) => (
                <div key={photo.id} className="break-inside-avoid mb-1 overflow-hidden">
                  <Image src={photo.url} alt={photo.caption || ""} width={500} height={400}
                    className="w-full object-cover hover:scale-[1.02] transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Thumbnail strip — always at bottom ───────────────────── */}
      {view === "videos" && gallery.videos.length > 0 && (
        <div
          className="relative z-20 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div ref={stripRef} className="flex gap-3 overflow-x-auto px-6 py-5" style={{ scrollbarWidth: "none" }}>
            {gallery.videos.map((video) => {
              const isActive = activeVideo?.id === video.id
              return (
                <button key={video.id} id={`thumb-${video.id}`} onClick={() => selectVideo(video)}
                  className="flex-shrink-0 group text-left transition-all" style={{ width: 260 }}>
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden rounded transition-all duration-300"
                    style={{
                      aspectRatio: "16/9",
                      boxShadow: isActive ? `0 0 0 2px ${primaryColor}` : "none",
                      opacity: isActive ? 1 : 0.80,
                    }}>
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="w-full h-full bg-white/8 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
                      </div>
                    )}

                    {/* Dark overlay + play icon on hover */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/60 backdrop-blur-sm bg-black/20">
                          <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
                        </div>
                      </div>
                    )}

                    {/* Active: playing bars */}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
                        <div className="flex items-end gap-[3px] h-5">
                          {[0, 0.15, 0.05, 0.25].map((delay, i) => (
                            <span key={i} className="w-[3px] rounded-full animate-bounce"
                              style={{ height: `${10 + i * 4}px`, backgroundColor: primaryColor, animationDelay: `${delay}s`, animationDuration: "0.75s" }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title + play label */}
                  <div className="mt-3 px-0.5">
                    <p className="text-sm font-light truncate transition-colors"
                      style={{ color: isActive ? primaryColor : "rgba(255,255,255,0.85)" }}>
                      {video.title}
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase mt-1 font-light"
                      style={{ color: isActive ? `${primaryColor}90` : "rgba(255,255,255,0.28)" }}>
                      {isActive ? "Reproduzindo" : "Assistir filme"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT: SOLACE — player + chapter list on right
══════════════════════════════════════════════════════════════════ */
function LayoutSolace({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(gallery.videos[0] || null)
  const [view, setView]               = useState<"videos" | "photos">("videos")
  const [copied, setCopied]           = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (gallery.musicUrl && audioRef.current) {
      audioRef.current.volume = 0.25
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [gallery.musicUrl])

  const handleCopyLink = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleDownload = useCallback(() => {
    if (!activeVideo?.mp4Url) return
    const a = document.createElement("a"); a.href = activeVideo.mp4Url; a.download = `${activeVideo.title}.mp4`; a.target = "_blank"; a.click()
  }, [activeVideo])
  const toggleMusic = () => {
    if (!audioRef.current) return
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false) }
    else              { audioRef.current.play();  setMusicPlaying(true)  }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col" style={{ fontFamily }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* Top bar */}
      <div className="relative h-14 flex-shrink-0 border-b border-white/5">
        {gallery.coverImageUrl && (
          <div className="absolute inset-0">
            <Image src={gallery.coverImageUrl} alt="" fill className="object-cover opacity-20" sizes="100vw" />
            <div className="absolute inset-0 bg-black/70" />
          </div>
        )}
        <div className="relative h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {gallery.studio.logoUrl
              ? <Image src={gallery.studio.logoUrl} alt={gallery.studio.name} width={28} height={28} className="rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ border: `1px solid ${primaryColor}50`, color: primaryColor }}>{gallery.studio.name[0]}</div>
            }
            <div>
              <p className="text-white/70 text-xs font-light">{gallery.title}</p>
              {gallery.subtitle && <p className="text-white/30 text-[10px] font-light">{gallery.subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {gallery.videos.length > 0 && gallery.photos.length > 0 && (
              <div className="flex gap-px bg-white/5 rounded-full p-0.5 border border-white/8">
                {(["videos", "photos"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className="px-3 py-1 text-[10px] tracking-[0.15em] uppercase rounded-full transition-all"
                    style={view === v ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.35)" }}>
                    {v === "videos" ? "Vídeos" : "Fotos"}
                  </button>
                ))}
              </div>
            )}
            {gallery.musicUrl && (
              <button onClick={toggleMusic} className="w-8 h-8 rounded-full border border-white/15 hover:border-white/30 flex items-center justify-center transition-all">
                {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
              </button>
            )}
            {activeVideo?.mp4Url && activeVideo.downloadEnabled && (
              <button onClick={handleDownload} className="w-8 h-8 rounded-full border border-white/15 hover:border-white/30 flex items-center justify-center transition-all"><IconDownload /></button>
            )}
            <button onClick={handleCopyLink} className="w-8 h-8 rounded-full border border-white/15 hover:border-white/30 flex items-center justify-center transition-all">
              {copied ? <IconCheck /> : <IconShare />}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {view === "videos" && (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100svh - 3.5rem)" }}>
          <div className="flex-1 bg-black">
            {activeVideo
              ? <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
                  title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer />
              : gallery.coverImageUrl
                ? <div className="w-full h-full relative"><Image src={gallery.coverImageUrl} alt="" fill className="object-cover" /></div>
                : <div className="w-full h-full flex items-center justify-center">
                    <p className="text-white/20 text-xs tracking-widest uppercase">Selecione um capítulo</p>
                  </div>
            }
          </div>
          <div className="w-72 flex-shrink-0 bg-[#0d0d0d] border-l border-white/5 overflow-y-auto">
            <div className="p-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mb-3 font-light">Capítulos</p>
              {gallery.videos.map((video, i) => (
                <button key={video.id} onClick={() => setActiveVideo(video)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1.5 text-left transition-all ${
                    activeVideo?.id === video.id ? "bg-white/8 border border-white/12" : "hover:bg-white/4 border border-transparent"
                  }`}>
                  <div className="relative flex-shrink-0">
                    {video.thumbnailUrl
                      ? <img src={video.thumbnailUrl} className="w-16 h-9 object-cover rounded" alt="" />
                      : <div className="w-16 h-9 bg-white/8 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-white/20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
                        </div>
                    }
                    {activeVideo?.id === video.id && (
                      <div className="absolute inset-0 flex items-center justify-center rounded" style={{ background: `${primaryColor}30` }}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill={primaryColor}><polygon points="5 3 19 12 5 21" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/65 font-light truncate">{video.title}</p>
                    {video.durationSeconds != null && (
                      <p className="text-[10px] text-white/25 mt-0.5">{Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-white/20 flex-shrink-0">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "photos" && gallery.photos.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-1 p-1 bg-[#0a0a0a] flex-1">
          {gallery.photos.map((photo) => (
            <div key={photo.id} className="break-inside-avoid mb-1 overflow-hidden">
              <Image src={photo.url} alt={photo.caption || ""} width={500} height={400} className="w-full object-cover hover:scale-[1.02] transition-transform duration-700" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT: CINEMA — imersivo tela cheia, título flutuante
══════════════════════════════════════════════════════════════════ */
function LayoutCinema({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [showList, setShowList]       = useState(false)
  const [view, setView]               = useState<"videos" | "photos">("videos")
  const [copied, setCopied]           = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (gallery.musicUrl && audioRef.current) {
      audioRef.current.volume = 0.25
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [gallery.musicUrl])

  const handleCopyLink = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleDownload = useCallback(() => {
    if (!activeVideo?.mp4Url) return
    const a = document.createElement("a"); a.href = activeVideo.mp4Url; a.download = `${activeVideo.title}.mp4`; a.target = "_blank"; a.click()
  }, [activeVideo])
  const toggleMusic = () => {
    if (!audioRef.current) return
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false) }
    else              { audioRef.current.play();  setMusicPlaying(true)  }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" style={{ fontFamily }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {!activeVideo && gallery.coverImageUrl && (
        <div className="fixed inset-0">
          <Image src={gallery.coverImageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
          <div className="fixed inset-0 bg-black/65" />
        </div>
      )}

      {activeVideo && (
        <div className="fixed inset-0 bg-black">
          <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
            title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            {gallery.studio.logoUrl
              ? <Image src={gallery.studio.logoUrl} alt={gallery.studio.name} width={34} height={34} className="rounded-full object-cover" />
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ border: `1px solid ${primaryColor}50`, color: primaryColor }}>{gallery.studio.name[0]}</div>
            }
            <span className="font-light text-white/50 text-xs tracking-[0.2em] uppercase hidden sm:block">{gallery.studio.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {gallery.videos.length > 0 && gallery.photos.length > 0 && (
              <div className="flex gap-px bg-black/30 backdrop-blur-md rounded-full p-1 mr-1 border border-white/8">
                {(["videos", "photos"] as const).map(v => (
                  <button key={v} onClick={() => { setView(v); setActiveVideo(null) }}
                    className="px-3.5 py-1.5 text-xs tracking-[0.15em] uppercase rounded-full transition-all"
                    style={view === v ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.35)" }}>
                    {v === "videos" ? "Vídeos" : "Fotos"}
                  </button>
                ))}
              </div>
            )}
            {gallery.musicUrl && (
              <button onClick={toggleMusic} className="w-9 h-9 rounded-full border border-white/15 hover:border-white/35 backdrop-blur-sm flex items-center justify-center transition-all">
                {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
              </button>
            )}
            {activeVideo?.mp4Url && activeVideo.downloadEnabled && (
              <button onClick={handleDownload} className="w-9 h-9 rounded-full border border-white/15 hover:border-white/35 backdrop-blur-sm flex items-center justify-center transition-all"><IconDownload /></button>
            )}
            <button onClick={handleCopyLink} className="w-9 h-9 rounded-full border border-white/15 hover:border-white/35 backdrop-blur-sm flex items-center justify-center transition-all">
              {copied ? <IconCheck /> : <IconShare />}
            </button>
            {activeVideo && (
              <button onClick={() => { setActiveVideo(null); setShowList(false) }}
                className="ml-1 flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase text-white/50 hover:text-white border border-white/15 hover:border-white/30 rounded-full transition-all backdrop-blur-sm">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                Início
              </button>
            )}
          </div>
        </header>

        {!activeVideo && view === "videos" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <p className="text-xs tracking-[0.4em] uppercase text-white/30 mb-6 font-light">{gallery.studio.name}</p>
            <h1 className="text-6xl lg:text-8xl font-light leading-[1.05] mb-4">{gallery.title}</h1>
            {gallery.subtitle && <p className="text-white/40 text-lg font-light tracking-wide mb-12">{gallery.subtitle}</p>}
            <div className="flex items-center gap-4">
              <button onClick={() => gallery.videos[0] && setActiveVideo(gallery.videos[0])}
                className="flex items-center gap-3 px-10 py-4 text-xs tracking-[0.3em] uppercase transition-all hover:opacity-80"
                style={{ background: primaryColor, color: "#000" }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg>
                Reproduzir
              </button>
              {gallery.videos.length > 1 && (
                <button onClick={() => setShowList(!showList)}
                  className="px-6 py-4 text-xs tracking-[0.3em] uppercase border border-white/25 hover:border-white/50 transition-all text-white/60 hover:text-white">
                  Capítulos
                </button>
              )}
            </div>
          </div>
        )}

        {!activeVideo && view === "photos" && gallery.photos.length > 0 && (
          <div className="flex-1 columns-2 sm:columns-3 lg:columns-4 gap-1 p-1">
            {gallery.photos.map((photo) => (
              <div key={photo.id} className="break-inside-avoid mb-1 overflow-hidden">
                <Image src={photo.url} alt={photo.caption || ""} width={500} height={400} className="w-full object-cover hover:scale-[1.02] transition-transform duration-700" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showList && !activeVideo && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-xl border-t border-white/8 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-[0.2em] uppercase text-white/40">Capítulos</p>
              <button onClick={() => setShowList(false)} className="text-white/30 hover:text-white/60">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {gallery.videos.map((video) => (
                <button key={video.id} onClick={() => { setActiveVideo(video); setShowList(false) }}
                  className="flex-shrink-0 text-left group" style={{ width: 160 }}>
                  <div className="aspect-video bg-white/5 rounded overflow-hidden mb-2 relative">
                    {video.thumbnailUrl
                      ? <img src={video.thumbnailUrl} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21" /></svg></div>
                    }
                  </div>
                  <p className="text-xs text-white/60 font-light truncate">{video.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Main export
══════════════════════════════════════════════════════════════════ */
export function GalleryViewer({ gallery }: { gallery: GalleryWithAll }) {
  const primaryColor = gallery.primaryColor || gallery.studio.primaryColor || "#C9A84C"
  const fontFamily   = FONT_MAP[gallery.fontFamily] ?? FONT_MAP["Playfair Display"]

  if (gallery.layout === "solace") return <LayoutSolace gallery={gallery} primaryColor={primaryColor} fontFamily={fontFamily} />
  if (gallery.layout === "cinema") return <LayoutCinema gallery={gallery} primaryColor={primaryColor} fontFamily={fontFamily} />
  return <LayoutGatsby gallery={gallery} primaryColor={primaryColor} fontFamily={fontFamily} />
}
