"use client"

import { useState } from "react"
import { VideoPlayer } from "@/components/VideoPlayer"
import type { Gallery, Studio, Video, Photo } from "@/app/generated/prisma/client"
import Image from "next/image"

type GalleryWithAll = Gallery & {
  studio: Studio
  videos: Video[]
  photos: Photo[]
}

export function GalleryViewer({ gallery }: { gallery: GalleryWithAll }) {
  const [activeVideo, setActiveVideo] = useState<Video | null>(
    gallery.videos[0] ?? null
  )
  const [showPhotos, setShowPhotos] = useState(false)
  const primaryColor = gallery.studio.primaryColor || "#C9A84C"

  const bg = gallery.coverImageUrl
    ? `url(${gallery.coverImageUrl})`
    : `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)`

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#111",
        color: "white",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          {gallery.studio.logoUrl ? (
            <Image
              src={gallery.studio.logoUrl}
              alt={gallery.studio.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: primaryColor, color: "#111" }}
            >
              {gallery.studio.name[0]}
            </div>
          )}
          <span className="font-semibold text-white/90">{gallery.studio.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {gallery.videos.length > 0 && gallery.photos.length > 0 && (
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              <button
                onClick={() => setShowPhotos(false)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  !showPhotos ? "text-black" : "text-white/60 hover:text-white"
                }`}
                style={!showPhotos ? { backgroundColor: primaryColor } : {}}
              >
                Vídeos
              </button>
              <button
                onClick={() => setShowPhotos(true)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  showPhotos ? "text-black" : "text-white/60 hover:text-white"
                }`}
                style={showPhotos ? { backgroundColor: primaryColor } : {}}
              >
                Fotos
              </button>
            </div>
          )}

          {/* Share button */}
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            title="Copiar link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1">
        {/* Left sidebar */}
        <aside
          className="lg:w-80 p-8 flex flex-col justify-center"
          style={{
            background: gallery.coverImageUrl
              ? "linear-gradient(to right, rgba(17,17,17,0.95) 0%, rgba(17,17,17,0.7) 100%)"
              : undefined,
          }}
        >
          <h1
            className="text-4xl lg:text-5xl font-light mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {gallery.title}
          </h1>
          {gallery.subtitle && (
            <p className="text-white/50 text-sm mb-6">{gallery.subtitle}</p>
          )}

          {!showPhotos && activeVideo && (
            <button
              onClick={() => {
                const videoEl = document.querySelector("video")
                if (videoEl?.paused) videoEl.play()
                else videoEl?.pause()
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-sm text-black font-semibold text-sm w-fit"
              style={{ backgroundColor: primaryColor }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              REPRODUZIR FILME
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-4 lg:p-8 flex flex-col gap-6">
          {!showPhotos ? (
            <>
              {activeVideo && (
                <VideoPlayer
                  hlsUrl={activeVideo.hlsUrl}
                  mp4Url={activeVideo.mp4Url}
                  thumbnailUrl={activeVideo.thumbnailUrl}
                  title={activeVideo.title}
                  primaryColor={primaryColor}
                  downloadEnabled={activeVideo.downloadEnabled}
                />
              )}

              {/* Video list */}
              {gallery.videos.length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {gallery.videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="group relative rounded overflow-hidden aspect-video"
                      style={{
                        border: activeVideo?.id === video.id
                          ? `2px solid ${primaryColor}`
                          : "2px solid transparent",
                      }}
                    >
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-medium truncate">{video.title}</p>
                        {video.durationSeconds && (
                          <p className="text-white/50 text-xs">
                            {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Photo grid */
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-2">
              {gallery.photos.map((photo) => (
                <div key={photo.id} className="break-inside-avoid rounded overflow-hidden">
                  <Image
                    src={photo.url}
                    alt={photo.caption || ""}
                    width={400}
                    height={300}
                    className="w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 flex justify-end">
        <a
          href="/"
          className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/60 transition-colors"
        >
          <span className="tracking-widest uppercase">Amenic Filmes</span>
        </a>
      </footer>
    </div>
  )
}
