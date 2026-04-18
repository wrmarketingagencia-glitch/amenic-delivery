"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import type { Gallery, Video, Photo } from "@/app/generated/prisma/client"

type GalleryWithAll = Gallery & { videos: Video[]; photos: Photo[] }

export function GalleryEditor({ gallery }: { gallery: GalleryWithAll }) {
  const [videos, setVideos] = useState<Video[]>(gallery.videos)
  const [photos, setPhotos] = useState<Photo[]>(gallery.photos)
  const [published, setPublished] = useState(gallery.isPublished)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoMp4, setVideoMp4] = useState("")
  const [videoHls, setVideoHls] = useState("")
  const [videoThumb, setVideoThumb] = useState("")
  const [addMode, setAddMode] = useState<"upload" | "url" | null>(null)
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoCaption, setPhotoCaption] = useState("")
  const [addPhotoMode, setAddPhotoMode] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!videoTitle) {
      alert("Digite um nome para o vídeo primeiro")
      return
    }
    setUploading(true)
    setUploadProgress(0)

    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        await addVideo({ mp4Url: data.url })
      } else {
        alert("Erro no upload")
      }
      setUploading(false)
      setUploadProgress(0)
    }

    xhr.onerror = () => { setUploading(false); alert("Erro no upload") }
    xhr.send(form)
  }

  const addVideo = async (extra: Partial<Video>) => {
    const res = await fetch(`/api/galleries/${gallery.id}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: videoTitle || "Sem título",
        ...extra,
      }),
    })
    if (res.ok) {
      const video = await res.json()
      setVideos((v) => [...v, video])
      setVideoTitle("")
      setVideoMp4("")
      setVideoHls("")
      setVideoThumb("")
      setAddMode(null)
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Remover este vídeo?")) return
    const res = await fetch(`/api/galleries/${gallery.id}/videos?videoId=${videoId}`, { method: "DELETE" })
    if (res.ok) setVideos((v) => v.filter((x) => x.id !== videoId))
  }

  const handlePhotoFileUpload = async (file: File) => {
    setUploadingPhoto(true)
    setPhotoUploadProgress(0)

    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setPhotoUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        await addPhoto(data.url)
      } else {
        alert("Erro no upload da foto")
      }
      setUploadingPhoto(false)
      setPhotoUploadProgress(0)
    }

    xhr.onerror = () => { setUploadingPhoto(false); alert("Erro no upload") }
    xhr.send(form)
  }

  const addPhoto = async (url: string, caption?: string) => {
    const res = await fetch(`/api/galleries/${gallery.id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, caption: caption || photoCaption || null }),
    })
    if (res.ok) {
      const photo = await res.json()
      setPhotos((p) => [...p, photo])
      setPhotoUrl("")
      setPhotoCaption("")
      setAddPhotoMode(false)
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm("Remover esta foto?")) return
    const res = await fetch(`/api/galleries/${gallery.id}/photos?photoId=${photoId}`, { method: "DELETE" })
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== photoId))
  }

  const togglePublish = async () => {
    if (!published) {
      await fetch(`/api/galleries/${gallery.id}/publish`, { method: "POST" })
      setPublished(true)
    } else {
      await fetch(`/api/galleries/${gallery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
      })
      setPublished(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/studio/dashboard" className="text-white/50 hover:text-white text-sm">
            ← Dashboard
          </Link>
          <span className="text-white/30">/</span>
          <span className="text-white/70 text-sm truncate max-w-40">{gallery.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Ver galeria →
          </a>
          <button
            onClick={togglePublish}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              published
                ? "bg-white/10 text-white/70 hover:bg-white/20"
                : "bg-[#C9A84C] text-black hover:bg-[#d4b55a]"
            }`}
          >
            {published ? "✓ Publicada" : "Publicar"}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Gallery info */}
        <div className="mb-8 p-5 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">{gallery.title}</h1>
              {gallery.subtitle && <p className="text-white/50 text-sm mt-0.5">{gallery.subtitle}</p>}
              <p className="text-white/40 text-xs mt-1">
                Link:{" "}
                <code className="text-[#C9A84C]">
                  {typeof window !== "undefined" ? window.location.origin : ""}/g/{gallery.slug}
                </code>
              </p>
            </div>
            {gallery.password && (
              <span className="flex items-center gap-1 text-xs text-white/40 border border-white/10 px-2 py-1 rounded">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Com senha
              </span>
            )}
          </div>
        </div>

        {/* Videos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Vídeos ({videos.length})</h2>
            {!addMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => setAddMode("upload")}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ↑ Upload
                </button>
                <button
                  onClick={() => setAddMode("url")}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  + URL
                </button>
              </div>
            )}
          </div>

          {/* Add video form */}
          {addMode && (
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {addMode === "upload" ? "Upload de vídeo" : "Adicionar por URL"}
                </span>
                <button onClick={() => setAddMode(null)} className="text-white/40 hover:text-white text-sm">✕</button>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Nome do vídeo (ex: Cerimônia, Festa...)"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 text-sm"
                />

                {addMode === "upload" ? (
                  <div>
                    <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    {uploading ? (
                      <div className="rounded-lg bg-white/10 p-4">
                        <div className="flex justify-between text-sm text-white/70 mb-2">
                          <span>Fazendo upload...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C9A84C] rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full py-8 border border-dashed border-white/20 rounded-lg text-white/40 hover:text-white/70 hover:border-white/40 transition-colors text-sm flex flex-col items-center gap-2"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Clique para selecionar vídeo
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="url"
                      value={videoMp4}
                      onChange={(e) => setVideoMp4(e.target.value)}
                      placeholder="URL do MP4"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 text-sm"
                    />
                    <input
                      type="url"
                      value={videoHls}
                      onChange={(e) => setVideoHls(e.target.value)}
                      placeholder="URL do HLS (.m3u8) — opcional"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 text-sm"
                    />
                    <input
                      type="url"
                      value={videoThumb}
                      onChange={(e) => setVideoThumb(e.target.value)}
                      placeholder="URL da thumbnail — opcional"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 text-sm"
                    />
                    <button
                      onClick={() => addVideo({ mp4Url: videoMp4 || null, hlsUrl: videoHls || null, thumbnailUrl: videoThumb || null })}
                      disabled={!videoMp4 && !videoHls}
                      className="py-2.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-40 transition-colors"
                    >
                      Adicionar Vídeo
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Video list */}
          {videos.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
              <p className="text-white/40 text-sm">Nenhum vídeo adicionado ainda</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {videos.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-white/30 text-sm w-5 text-center">{i + 1}</span>
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="w-16 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-10 bg-white/10 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.title}</p>
                    <p className="text-white/40 text-xs truncate">{v.hlsUrl || v.mp4Url}</p>
                  </div>
                  <button
                    onClick={() => deleteVideo(v.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Fotos ({photos.length})</h2>
            {!addPhotoMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setAddPhotoMode(true); setTimeout(() => photoFileRef.current?.click(), 50) }}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ↑ Upload
                </button>
                <button
                  onClick={() => setAddPhotoMode(true)}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  + URL
                </button>
              </div>
            )}
          </div>

          {addPhotoMode && (
            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Adicionar foto</span>
                <button onClick={() => setAddPhotoMode(false)} className="text-white/40 hover:text-white text-sm">✕</button>
              </div>

              <input ref={photoFileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((f) => handlePhotoFileUpload(f))
                }
              }} />

              {uploadingPhoto ? (
                <div className="rounded-lg bg-white/10 p-4 mb-3">
                  <div className="flex justify-between text-sm text-white/70 mb-2">
                    <span>Fazendo upload...</span>
                    <span>{photoUploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${photoUploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => photoFileRef.current?.click()}
                  className="w-full py-6 border border-dashed border-white/20 rounded-lg text-white/40 hover:text-white/70 hover:border-white/40 transition-colors text-sm flex flex-col items-center gap-2 mb-3"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Clique para fazer upload (múltiplas fotos)
                </button>
              )}

              <div className="flex flex-col gap-3">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Ou cole a URL da imagem"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 text-sm"
                />
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Legenda (opcional)"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 text-sm"
                />
                <button
                  onClick={() => addPhoto(photoUrl)}
                  disabled={!photoUrl}
                  className="py-2.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-40 transition-colors"
                >
                  Adicionar Foto
                </button>
              </div>
            </div>
          )}

          {photos.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
              <p className="text-white/40 text-sm">Nenhuma foto adicionada ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative group aspect-square rounded overflow-hidden bg-white/5">
                  <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover" />
                  <button
                    onClick={() => deletePhoto(p.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {p.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{p.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
