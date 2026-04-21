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
}

export function VideoPlayer({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  title,
  primaryColor = "#C9A84C",
  downloadEnabled = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoSrc = hlsUrl || mp4Url

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
    } else if (mp4Url) {
      video.src = mp4Url
    } else if (hlsUrl) {
      video.src = hlsUrl
    }

    return () => {
      hlsRef.current?.destroy()
    }
  }, [hlsUrl, mp4Url, videoSrc])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setProgress(video.currentTime)
    setDuration(video.duration || 0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Number(e.target.value)
    setProgress(Number(e.target.value))
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const v = Number(e.target.value)
    video.volume = v
    setVolume(v)
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
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (!videoSrc) {
    return (
      <div
        className="w-full aspect-video bg-black/40 flex items-center justify-center rounded-lg"
        style={{ border: `1px solid ${primaryColor}30` }}
      >
        <p className="text-white/40 text-sm">Nenhum vídeo disponível</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={thumbnailUrl || undefined}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        playsInline
      />

      {/* Play overlay when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: `${primaryColor}cc` }}
          >
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-gradient-to-t from-black/90 to-transparent pt-10 pb-3 px-4">
          {/* Progress bar */}
          <div className="relative mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${primaryColor} ${
                  duration ? (progress / duration) * 100 : 0
                }%, rgba(255,255,255,0.3) 0%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/pause */}
              <button onClick={togglePlay} className="text-white hover:opacity-80">
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

              {/* Volume */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={handleVolume}
                  className="w-16 h-1 appearance-none cursor-pointer rounded-full"
                  style={{
                    background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.3) 0%)`,
                  }}
                />
              </div>

              {/* Time */}
              <span className="text-white/70 text-xs font-mono">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Download */}
              {downloadEnabled && mp4Url && (
                <a
                  href={mp4Url}
                  download
                  className="text-white/70 hover:text-white transition-colors"
                  title="Baixar vídeo"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )}

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                {fullscreen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
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
