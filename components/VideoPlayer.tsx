"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"

interface VideoPlayerProps {
  hlsUrl?: string | null
  mp4Url?: string | null
  thumbnailUrl?: string | null
  title: string
  primaryColor?: string
  downloadEnabled?: boolean
  /** When true, fills the parent container height instead of using aspect-video */
  fillContainer?: boolean
}

export function VideoPlayer({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  title,
  primaryColor = "#C9A84C",
  downloadEnabled = true,
  fillContainer = false,
}: VideoPlayerProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const hlsRef      = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [playing,      setPlaying]      = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [volume,       setVolume]       = useState(1)
  const [fullscreen,   setFullscreen]   = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const videoSrc = hlsUrl || mp4Url

  /* ── HLS / MP4 setup ─────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true })
      hlsRef.current = hls
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
    } else if (mp4Url) {
      video.src = mp4Url
    } else if (hlsUrl) {
      // Native HLS (Safari)
      video.src = hlsUrl
    }

    return () => { hlsRef.current?.destroy() }
  }, [hlsUrl, mp4Url, videoSrc])

  /* ── Playback controls ────────────────────────────────────────── */
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play() : v.pause()
  }

  const rewind10 = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, v.currentTime - 10)
  }

  const forward10 = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Number(e.target.value)
    setProgress(Number(e.target.value))
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val
    setVolume(val)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00"
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
  }

  /* ── No source ───────────────────────────────────────────────── */
  if (!videoSrc) {
    return (
      <div className={`w-full bg-black/40 flex items-center justify-center ${fillContainer ? "h-full" : "aspect-video rounded-lg"}`}
        style={{ border: `1px solid ${primaryColor}30` }}>
        <p className="text-white/40 text-sm">Nenhum vídeo disponível</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden group cursor-pointer ${fillContainer ? "h-full" : "aspect-video rounded-lg"}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={thumbnailUrl || undefined}
        onClick={togglePlay}
        onTimeUpdate={() => {
          const v = videoRef.current
          if (!v) return
          setProgress(v.currentTime)
          setDuration(v.duration || 0)
        }}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
      />

      {/* ── Play overlay (paused) ────────────────────────────────── */}
      {!playing && (
        <button onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: `${primaryColor}cc` }}>
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="bg-gradient-to-t from-black/90 to-transparent pt-12 pb-3 px-4">

          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range" min={0} max={duration || 100} value={progress}
              onChange={handleSeek}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${primaryColor} ${duration ? (progress / duration) * 100 : 0}%, rgba(255,255,255,0.25) 0%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">

            {/* Left controls */}
            <div className="flex items-center gap-3">

              {/* Play / Pause */}
              <button onClick={togglePlay} className="text-white hover:opacity-80 transition-opacity flex-shrink-0">
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Rewind 10s */}
              <button onClick={rewind10}
                className="text-white/70 hover:text-white transition-colors flex-shrink-0"
                title="Voltar 10 segundos">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <text x="7.5" y="16" fontSize="6" fill="currentColor" stroke="none" fontFamily="system-ui" fontWeight="600">10</text>
                </svg>
              </button>

              {/* Forward 10s */}
              <button onClick={forward10}
                className="text-white/70 hover:text-white transition-colors flex-shrink-0"
                title="Avançar 10 segundos">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <text x="7.5" y="16" fontSize="6" fill="currentColor" stroke="none" fontFamily="system-ui" fontWeight="600">10</text>
                </svg>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white/60 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={handleVolume}
                  className="w-16 h-1 appearance-none cursor-pointer rounded-full"
                  style={{ background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.25) 0%)` }}
                />
              </div>

              {/* Time */}
              <span className="text-white/55 text-xs font-mono whitespace-nowrap">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 flex-shrink-0">

              {/* Download */}
              {downloadEnabled && mp4Url && (
                <a href={mp4Url} download target="_blank"
                  className="text-white/60 hover:text-white transition-colors"
                  title="Baixar vídeo"
                  onClick={e => e.stopPropagation()}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M12 3v13"/><path d="M8 12l4 4 4-4"/><path d="M3 19h18"/>
                  </svg>
                </a>
              )}

              {/* Fullscreen */}
              <button onClick={toggleFullscreen}
                className="text-white/60 hover:text-white transition-colors"
                title={fullscreen ? "Sair do fullscreen" : "Fullscreen"}>
                {fullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
