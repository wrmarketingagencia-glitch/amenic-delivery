"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { VideoPlayer } from "@/components/VideoPlayer"
import Image from "next/image"
import type { Gallery, Studio, Video, Photo, Folder } from "@/app/generated/prisma/client"

type FolderWithItems = Folder & { videos: Video[]; photos: Photo[] }
type GalleryWithAll  = Gallery & { studio: Studio; videos: Video[]; photos: Photo[]; folders: FolderWithItems[] }

// ── Font map — applied ONLY to the gallery main title (h1) ────────
export const FONT_MAP: Record<string, string> = {
  // Google Fonts (reference image)
  "Italiana":           "'Italiana', Georgia, serif",
  "Della Respira":      "'Della Respira', Georgia, serif",
  "Raleway":            "'Raleway', system-ui, sans-serif",
  "Slabo 13px":         "'Slabo 13px', Georgia, serif",
  "Cormorant Garamond": "'Cormorant Garamond', Georgia, serif",
  // Classic Google
  "Playfair Display":   "'Playfair Display', Georgia, serif",
  "Merriweather":       "'Merriweather', Georgia, serif",
  "Lora":               "'Lora', Georgia, serif",
  // Local (Amenic custom)
  "Ginger":             "'Ginger', Georgia, serif",
  "TheMacksen":         "'TheMacksen', Georgia, serif",
  "Bridamount":         "'Bridamount', cursive",
  "Thimberly":          "'Thimberly', cursive",
  "Shintia":            "'Shintia', cursive",
  "Housttely":          "'Housttely', cursive",
}

// UI uses Inter always — never changes with font selection
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

/* ── Amenic logo (fixed — never changes with font) ───────────────── */
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

/* ── Icon button ─────────────────────────────────────────────────── */
const IconBtn = ({ onClick, title, children, active }: { onClick?: () => void; title?: string; children: React.ReactNode; active?: boolean }) => (
  <button onClick={onClick} title={title}
    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all backdrop-blur-sm
      ${active ? "border-white/50 bg-white/10 text-white" : "border-white/15 hover:border-white/35 text-white/70 hover:text-white hover:bg-white/5"}`}>
    {children}
  </button>
)

/* ══════════════════════════════════════════════════════════════════
   LAYOUT 1: GATSBY  —  VidFlow style
   · Full-screen background (cover photo → silent bg video)
   · AMENIC logo pinned top-left
   · Couple name large bottom-left with "Reproduzir tudo"
   · Horizontal thumbnail strip pinned to bottom
   · Active video: player fills the middle area
══════════════════════════════════════════════════════════════════ */
function LayoutGatsby({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo,   setActiveVideo]   = useState<Video | null>(null)
  const [view,          setView]          = useState<"videos" | "photos">("videos")
  const [copied,        setCopied]        = useState(false)
  const [musicPlaying,  setMusicPlaying]  = useState(false)

  const audioRef   = useRef<HTMLAudioElement>(null)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const stripRef   = useRef<HTMLDivElement>(null)
  const firstVideo = gallery.videos[0] ?? null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !gallery.musicUrl) return
    audio.volume = 0.3
    audio.play().then(() => setMusicPlaying(true)).catch(() => {})
  }, [gallery.musicUrl])

  useEffect(() => {
    bgVideoRef.current?.play().catch(() => {})
  }, [firstVideo?.mp4Url])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    musicPlaying ? (audio.pause(), setMusicPlaying(false)) : (audio.play(), setMusicPlaying(true))
  }, [musicPlaying])

  // Pausa música quando vídeo toca; retoma quando vídeo pausa
  const handleVideoPlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setMusicPlaying(false)
  }, [])

  const handleVideoPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !gallery.musicUrl) return
    audio.play().then(() => setMusicPlaying(true)).catch(() => {})
  }, [gallery.musicUrl])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [])

  const selectVideo = useCallback((video: Video) => {
    setActiveVideo(video)
    setTimeout(() => {
      document.getElementById(`thumb-${video.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }, 50)
  }, [])

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden" style={{ fontFamily: UI_FONT }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* ── Full-screen background ───────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!activeVideo && (gallery.coverImageUrl || firstVideo?.thumbnailUrl) && (
          <Image src={gallery.coverImageUrl || firstVideo!.thumbnailUrl!} alt="" fill className="object-cover" priority sizes="100vw" />
        )}
        {!activeVideo && firstVideo?.mp4Url && (
          <video ref={bgVideoRef} src={firstVideo.mp4Url} autoPlay muted loop playsInline className="w-full h-full object-cover absolute inset-0" />
        )}
        {!activeVideo && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.55) 100%)" }} />
        )}
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-6 py-5">
        <AmenicLogo size="md" />

        <div className="flex items-center gap-2">
          {/* Videos / Photos toggle */}
          {gallery.videos.length > 0 && gallery.photos.length > 0 && (
            <div className="flex gap-px bg-black/30 backdrop-blur-md rounded-full p-1 mr-2 border border-white/8">
              {(["videos", "photos"] as const).map(v => (
                <button key={v} onClick={() => { setView(v); setActiveVideo(null) }}
                  className="px-3.5 py-1.5 text-xs tracking-[0.15em] uppercase rounded-full transition-all"
                  style={view === v ? { background: primaryColor, color: "#000" } : { color: "rgba(255,255,255,0.4)" }}>
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
          {activeVideo?.mp4Url && activeVideo.downloadEnabled && (
            <IconBtn onClick={() => { const a = document.createElement("a"); a.href = activeVideo.mp4Url!; a.download = `${activeVideo.title}.mp4`; a.click() }} title="Baixar vídeo">
              <IconDownload />
            </IconBtn>
          )}
          <IconBtn onClick={handleCopyLink} title="Copiar link">
            {copied ? <IconCheck /> : <IconShare />}
          </IconBtn>
          {activeVideo && (
            <button onClick={() => setActiveVideo(null)}
              className="ml-1 flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase text-white/50 hover:text-white border border-white/15 hover:border-white/30 rounded-full transition-all backdrop-blur-sm">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
              Voltar
            </button>
          )}
        </div>
      </header>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0">
        {activeVideo && (
          <div className="absolute inset-0 bg-black">
            <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
              title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer
              onVideoPlay={handleVideoPlay} onVideoPause={handleVideoPause} />
          </div>
        )}

        {/* Couple name — bottom-left */}
        {!activeVideo && view === "videos" && (
          <div className="absolute bottom-0 left-0 px-8 pb-8 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.05] mb-3 drop-shadow-2xl" style={{ fontFamily }}>
              {gallery.title}
            </h1>
            {gallery.subtitle && (
              <p className="text-white/55 text-sm font-light tracking-wide mb-6">{gallery.subtitle}</p>
            )}
            {gallery.videos.length > 0 && (
              <button onClick={() => firstVideo && selectVideo(firstVideo)}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 text-xs tracking-[0.2em] uppercase border border-white/30 hover:border-white/60 text-white/70 hover:text-white transition-all backdrop-blur-sm">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                Reproduzir tudo
              </button>
            )}
          </div>
        )}

        {/* Photos masonry */}
        {view === "photos" && !activeVideo && (
          <div className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-1 p-1">
              {gallery.photos.map(photo => (
                <div key={photo.id} className="break-inside-avoid mb-1 overflow-hidden">
                  <Image src={photo.url} alt={photo.caption || ""} width={500} height={400} className="w-full object-cover hover:scale-[1.02] transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ───────────────────────────────────── */}
      {view === "videos" && gallery.videos.length > 0 && (
        <div className="relative z-20 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div ref={stripRef} className="flex gap-3 overflow-x-auto px-6 py-4" style={{ scrollbarWidth: "none" }}>
            {gallery.videos.map(video => {
              const isActive = activeVideo?.id === video.id
              return (
                <button key={video.id} id={`thumb-${video.id}`} onClick={() => selectVideo(video)}
                  className="flex-shrink-0 group text-left transition-all" style={{ width: 220 }}>
                  <div className="relative overflow-hidden rounded transition-all duration-300"
                    style={{ aspectRatio: "16/9", boxShadow: isActive ? `0 0 0 2px ${primaryColor}` : "none", opacity: isActive ? 1 : 0.75 }}>
                    {video.thumbnailUrl
                      ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                      : <div className="w-full h-full bg-white/8 flex items-center justify-center"><svg className="w-7 h-7 text-white/20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                    }
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full border border-white/60 backdrop-blur-sm bg-black/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                        </div>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 flex items-end justify-center pb-1.5" style={{ background: `${primaryColor}18` }}>
                        <div className="flex items-end gap-[3px] h-4">
                          {[0, 0.12, 0.06, 0.18].map((d, i) => (
                            <span key={i} className="w-[3px] rounded-full animate-bounce"
                              style={{ height: `${8 + i * 3}px`, backgroundColor: primaryColor, animationDelay: `${d}s`, animationDuration: "0.7s" }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 px-0.5">
                    <p className="text-xs font-light truncate" style={{ color: isActive ? primaryColor : "rgba(255,255,255,0.8)" }}>
                      {video.title}
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase mt-0.5 font-light"
                      style={{ color: isActive ? `${primaryColor}90` : "rgba(255,255,255,0.25)" }}>
                      {isActive ? "Reproduzindo" : "Assistir"}
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
   LAYOUT 2: EDITORIAL  —  Roo Films style
   · Dark background, full-page scroll
   · Header: AMENIC logo + gallery title (center) + icons
   · Hero: large 16:9 featured player
   · Below: chapter grid (3 cols) — click to play in hero
   · Photos: masonry below chapters
══════════════════════════════════════════════════════════════════ */
function LayoutEditorial({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo,  setActiveVideo]  = useState<Video | null>(gallery.videos[0] ?? null)
  const [view,         setView]         = useState<"videos" | "photos">("videos")
  const [copied,       setCopied]       = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gallery.musicUrl && audioRef.current) {
      audioRef.current.volume = 0.25
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [gallery.musicUrl])

  const toggleMusic = () => {
    if (!audioRef.current) return
    musicPlaying ? (audioRef.current.pause(), setMusicPlaying(false)) : (audioRef.current.play(), setMusicPlaying(true))
  }

  const handleVideoPlay = () => { audioRef.current?.pause(); setMusicPlaying(false) }
  const handleVideoPause = () => {
    if (!audioRef.current || !gallery.musicUrl) return
    audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
  }

  const handleCopyLink = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const selectVideo = (video: Video) => {
    setActiveVideo(video)
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: UI_FONT }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* ── Sticky header ───────────────────────────────────────── */}
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
          {/* ── Featured player ───────────────────────────────── */}
          <div ref={playerRef} className="w-full bg-black" style={{ maxHeight: "75vh" }}>
            {activeVideo ? (
              <div className="relative w-full" style={{ aspectRatio: "16/9", maxHeight: "75vh" }}>
                <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
                  title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer
                  onVideoPlay={handleVideoPlay} onVideoPause={handleVideoPause} />
              </div>
            ) : gallery.coverImageUrl ? (
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <Image src={gallery.coverImageUrl} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <h1 className="text-3xl sm:text-5xl font-light text-white drop-shadow-xl text-center px-6" style={{ fontFamily }}>
                    {gallery.title}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center py-24 bg-[#0d0d0d]">
                <h1 className="text-4xl font-light text-white/30" style={{ fontFamily }}>{gallery.title}</h1>
              </div>
            )}
          </div>

          {/* Now playing label */}
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

          {/* ── Chapter grid ──────────────────────────────────── */}
          <div className="px-6 sm:px-10 py-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-6">Capítulos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.videos.map((video, idx) => {
                const isActive = activeVideo?.id === video.id
                return (
                  <button key={video.id} onClick={() => selectVideo(video)}
                    className="group text-left transition-all">
                    <div className="relative overflow-hidden rounded bg-white/4"
                      style={{ aspectRatio: "16/9", boxShadow: isActive ? `0 0 0 2px ${primaryColor}` : "none" }}>
                      {video.thumbnailUrl
                        ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        : <div className="w-full h-full flex items-center justify-center"><svg className="w-7 h-7 text-white/15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                      }
                      {/* Number badge */}
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
                      <p className="text-sm font-light truncate" style={{ color: isActive ? primaryColor : "rgba(255,255,255,0.75)" }}>
                        {video.title}
                      </p>
                      {video.durationSeconds != null && (
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Photos */}
      {view === "photos" && gallery.photos.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-1 p-1">
          {gallery.photos.map(photo => (
            <div key={photo.id} className="break-inside-avoid mb-1 overflow-hidden">
              <Image src={photo.url} alt={photo.caption || ""} width={500} height={400} className="w-full object-cover hover:scale-[1.02] transition-transform duration-700" />
            </div>
          ))}
        </div>
      )}

      {/* Footer with couple name */}
      <footer className="px-6 sm:px-10 py-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-2xl font-light text-white/30 tracking-wide" style={{ fontFamily: UI_FONT }}>{gallery.title}</p>
        <AmenicLogo size="sm" />
      </footer>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT 3: CINEMA  —  Fitzner style
   · Left sidebar: logo + title + vertical chapter list
   · Right: full-height video player (or hero cover)
   · Premium, immersive, no distraction
══════════════════════════════════════════════════════════════════ */
function LayoutCinema({ gallery, primaryColor, fontFamily }: { gallery: GalleryWithAll; primaryColor: string; fontFamily: string }) {
  const [activeVideo,  setActiveVideo]  = useState<Video | null>(gallery.videos[0] ?? null)
  const [view,         setView]         = useState<"videos" | "photos">("videos")
  const [copied,       setCopied]       = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (gallery.musicUrl && audioRef.current) {
      audioRef.current.volume = 0.25
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [gallery.musicUrl])

  const toggleMusic = () => {
    if (!audioRef.current) return
    musicPlaying ? (audioRef.current.pause(), setMusicPlaying(false)) : (audioRef.current.play(), setMusicPlaying(true))
  }

  const handleVideoPlay = () => { audioRef.current?.pause(); setMusicPlaying(false) }
  const handleVideoPause = () => {
    if (!audioRef.current || !gallery.musicUrl) return
    audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
  }

  const handleCopyLink = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden" style={{ fontFamily: UI_FONT }}>
      {gallery.musicUrl && <audio ref={audioRef} src={gallery.musicUrl} loop />}

      {/* ── Left sidebar ────────────────────────────────────────── */}
      <aside className={`flex-shrink-0 flex flex-col border-r border-white/6 bg-[#0a0a0a] transition-all duration-300 ${sidebarOpen ? "w-64 sm:w-72" : "w-0 overflow-hidden"}`}>
        {/* Logo + title */}
        <div className="flex-shrink-0 px-6 py-6 border-b border-white/6">
          <AmenicLogo size="sm" />
          <p className="text-sm font-light text-white/80 mt-5 leading-snug tracking-wide" style={{ fontFamily: UI_FONT }}>
            {gallery.title}
          </p>
          {gallery.subtitle && (
            <p className="text-[11px] text-white/35 mt-1 leading-relaxed">{gallery.subtitle}</p>
          )}
        </div>

        {/* Videos / Photos tabs */}
        {gallery.videos.length > 0 && gallery.photos.length > 0 && (
          <div className="flex-shrink-0 flex gap-px px-4 py-3 border-b border-white/5">
            {(["videos", "photos"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="flex-1 py-1.5 text-[10px] tracking-[0.15em] uppercase rounded transition-all"
                style={view === v ? { background: `${primaryColor}20`, color: primaryColor } : { color: "rgba(255,255,255,0.3)" }}>
                {v === "videos" ? "Vídeos" : "Fotos"}
              </button>
            ))}
          </div>
        )}

        {/* Chapter list */}
        {view === "videos" && (
          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
            {gallery.videos.map((video, idx) => {
              const isActive = activeVideo?.id === video.id
              return (
                <button key={video.id} onClick={() => setActiveVideo(video)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all group ${isActive ? "bg-white/6" : "hover:bg-white/3"}`}>
                  {/* Thumbnail */}
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
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-light truncate" style={{ color: isActive ? primaryColor : "rgba(255,255,255,0.65)" }}>
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/20">{idx + 1}</span>
                      {video.durationSeconds != null && (
                        <span className="text-[9px] text-white/25">
                          {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Photos list sidebar */}
        {view === "photos" && (
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-1.5 content-start" style={{ scrollbarWidth: "thin" }}>
            {gallery.photos.map(photo => (
              <div key={photo.id} className="aspect-square rounded overflow-hidden bg-white/4">
                <Image src={photo.url} alt={photo.caption || ""} width={120} height={120} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Bottom sidebar actions */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/6 flex items-center gap-2">
          {gallery.musicUrl && (
            <IconBtn onClick={toggleMusic} active={musicPlaying} title="Música">
              {musicPlaying ? <IconMusicOn /> : <IconMusicOff />}
            </IconBtn>
          )}
          {activeVideo?.mp4Url && activeVideo.downloadEnabled && (
            <IconBtn title="Baixar" onClick={() => { const a = document.createElement("a"); a.href = activeVideo.mp4Url!; a.download = `${activeVideo.title}.mp4`; a.click() }}>
              <IconDownload />
            </IconBtn>
          )}
          <IconBtn onClick={handleCopyLink} title="Copiar link">
            {copied ? <IconCheck /> : <IconShare />}
          </IconBtn>
        </div>
      </aside>

      {/* ── Right: video player / hero ───────────────────────────── */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Toggle sidebar button */}
        <button onClick={() => setSidebarOpen(o => !o)}
          className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/15 hover:border-white/30 backdrop-blur-sm flex items-center justify-center transition-all">
          <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            {sidebarOpen ? <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/> : <path d="M13 7l5 5-5 5M6 7l5 5-5 5"/>}
          </svg>
        </button>

        {view === "videos" && activeVideo ? (
          <VideoPlayer hlsUrl={activeVideo.hlsUrl} mp4Url={activeVideo.mp4Url} thumbnailUrl={activeVideo.thumbnailUrl}
            title={activeVideo.title} primaryColor={primaryColor} downloadEnabled={activeVideo.downloadEnabled} fillContainer
            onVideoPlay={handleVideoPlay} onVideoPause={handleVideoPause} />
        ) : view === "videos" && gallery.coverImageUrl ? (
          <div className="w-full h-full relative">
            <Image src={gallery.coverImageUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center px-12">
              <h1 className="text-5xl lg:text-7xl font-light text-white drop-shadow-2xl" style={{ fontFamily }}>
                {gallery.title}
              </h1>
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
            <div className="columns-2 lg:columns-3 gap-1 p-1">
              {gallery.photos.map(photo => (
                <div key={photo.id} className="break-inside-avoid mb-1 overflow-hidden">
                  <Image src={photo.url} alt={photo.caption || ""} width={600} height={450} className="w-full object-cover hover:scale-[1.02] transition-transform duration-700" />
                </div>
              ))}
            </div>
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
