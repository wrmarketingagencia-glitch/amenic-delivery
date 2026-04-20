"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Gallery, Video, Photo } from "@/app/generated/prisma/client"

type GalleryWithAll = Gallery & { videos: Video[]; photos: Photo[] }
type Section = "videos" | "photos" | "heading" | "background" | "colors" | "share"

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconVideos = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)
const IconPhotos = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IconHeading = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16" />
  </svg>
)
const IconBackground = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14l4-4 4 4 4-6 4 4" />
  </svg>
)
const IconColors = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
)
const IconShare = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
)

const SECTIONS: { id: Section; label: string; Icon: React.FC }[] = [
  { id: "videos",     label: "Vídeos",     Icon: IconVideos },
  { id: "photos",     label: "Fotos",      Icon: IconPhotos },
  { id: "heading",    label: "Título",     Icon: IconHeading },
  { id: "background", label: "Capa",       Icon: IconBackground },
  { id: "colors",     label: "Cores",      Icon: IconColors },
  { id: "share",      label: "Compartilhar", Icon: IconShare },
]

// ─── Main component ──────────────────────────────────────────────────────────
export function GalleryEditor({ gallery }: { gallery: GalleryWithAll }) {
  const [section, setSection] = useState<Section>("videos")
  const [videos, setVideos] = useState<Video[]>(gallery.videos)
  const [photos, setPhotos] = useState<Photo[]>(gallery.photos)
  const [published, setPublished] = useState(gallery.isPublished)

  // Heading state
  const [title, setTitle] = useState(gallery.title)
  const [subtitle, setSubtitle] = useState(gallery.subtitle || "")
  const [fontFamily, setFontFamily] = useState(gallery.fontFamily || "Georgia")


  // Background state
  const [coverUrl, setCoverUrl] = useState(gallery.coverImageUrl || "")
  const [uploadingCover, setUploadingCover] = useState(false)

  // Colors state
  const [primaryColor, setPrimaryColor] = useState(gallery.primaryColor || "#C9A84C")

  // Share state
  const [password, setPassword] = useState(gallery.password || "")
  const [linkCopied, setLinkCopied] = useState(false)

  // Video upload state
  const [videoTitle, setVideoTitle] = useState("")
  const [videoMp4, setVideoMp4] = useState("")
  const [videoHls, setVideoHls] = useState("")
  const [videoThumb, setVideoThumb] = useState("")
  const [addMode, setAddMode] = useState<"upload" | "url" | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoCaption, setPhotoCaption] = useState("")
  const [addPhotoMode, setAddPhotoMode] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  // ── Saving helpers ────────────────────────────────────────────────────────
  const patch = async (data: Record<string, unknown>) => {
    await fetch(`/api/galleries/${gallery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }

  // ── Video upload ──────────────────────────────────────────────────────────
  const handleFileUpload = (file: File) => {
    if (!videoTitle) { alert("Digite um nome para o vídeo primeiro"); return }
    setUploading(true); setUploadProgress(0)
    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)
    form.append("type", "video")
    form.append("title", videoTitle)
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        await addVideo({ mp4Url: data.url, hlsUrl: data.hlsUrl ?? null, thumbnailUrl: data.thumbnailUrl ?? null })
      } else { alert("Erro no upload") }
      setUploading(false); setUploadProgress(0)
    }
    xhr.onerror = () => { setUploading(false); alert("Erro no upload") }
    xhr.send(form)
  }

  const addVideo = async (extra: Partial<Video>) => {
    const res = await fetch(`/api/galleries/${gallery.id}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: videoTitle || "Sem título", ...extra }),
    })
    if (res.ok) {
      const video = await res.json()
      setVideos((v) => [...v, video])
      setVideoTitle(""); setVideoMp4(""); setVideoHls(""); setVideoThumb(""); setAddMode(null)
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Remover este vídeo?")) return
    const res = await fetch(`/api/galleries/${gallery.id}/videos?videoId=${videoId}`, { method: "DELETE" })
    if (res.ok) setVideos((v) => v.filter((x) => x.id !== videoId))
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoFileUpload = (file: File) => {
    setUploadingPhoto(true); setPhotoUploadProgress(0)
    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setPhotoUploadProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        await addPhoto(data.url)
      } else { alert("Erro no upload") }
      setUploadingPhoto(false); setPhotoUploadProgress(0)
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
      setPhotoUrl(""); setPhotoCaption(""); setAddPhotoMode(false)
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm("Remover esta foto?")) return
    const res = await fetch(`/api/galleries/${gallery.id}/photos?photoId=${photoId}`, { method: "DELETE" })
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== photoId))
  }

  // ── Cover image upload ────────────────────────────────────────────────────
  const handleCoverUpload = (file: File) => {
    setUploadingCover(true)
    const form = new FormData()
    form.append("file", file)
    form.append("folder", `${gallery.id}/cover`)
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    xhr.onload = async () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        setCoverUrl(data.url)
        await patch({ coverImageUrl: data.url })
      } else { alert("Erro no upload da capa") }
      setUploadingCover(false)
    }
    xhr.onerror = () => { setUploadingCover(false); alert("Erro") }
    xhr.send(form)
  }

  // ── Toggle publish ────────────────────────────────────────────────────────
  const togglePublish = async () => {
    if (!published) {
      await fetch(`/api/galleries/${gallery.id}/publish`, { method: "POST" })
      setPublished(true)
    } else {
      await patch({ isPublished: false })
      setPublished(false)
    }
  }

  const galleryUrl = typeof window !== "undefined"
    ? `${window.location.origin}/g/${gallery.slug}`
    : `/g/${gallery.slug}`

  const inputCls = "w-full px-4 py-2.5 rounded-lg bg-white/5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30 text-sm"
  const btnPrimary = "px-5 py-2.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-40 transition-colors"
  const btnGhost = "px-4 py-2 text-sm text-white/60 border border-white/15 rounded-lg hover:bg-white/10 transition-colors"

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">

      {/* ── Top nav ──────────────────────────────────────────────────── */}
      <nav className="border-b border-white/10 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/studio/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm truncate max-w-52">{gallery.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Ver galeria ↗
          </a>
          <button
            onClick={togglePublish}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              published
                ? "bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25"
                : "bg-[#C9A84C] text-black hover:bg-[#d4b55a]"
            }`}
          >
            {published ? "✓ Publicada" : "Publicar"}
          </button>
        </div>
      </nav>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="w-[72px] bg-[#0e0e0e] border-r border-white/10 flex flex-col items-center py-4 gap-1 flex-shrink-0">
          {SECTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className="w-full flex flex-col items-center gap-1 py-3 px-1 transition-colors relative"
              style={section === id ? { color: "#C9A84C" } : { color: "rgba(255,255,255,0.4)" }}
            >
              {section === id && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#C9A84C] rounded-r" />
              )}
              <Icon />
              <span className="text-[9px] font-medium leading-none tracking-wide">{label}</span>
            </button>
          ))}
        </aside>

        {/* ── Panel ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-7 max-w-2xl">

          {/* VIDEOS */}
          {section === "videos" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-lg">Vídeos</h2>
                  <p className="text-white/40 text-sm mt-0.5">{videos.length} vídeo{videos.length !== 1 ? "s" : ""}</p>
                </div>
                {!addMode && (
                  <div className="flex gap-2">
                    <button onClick={() => setAddMode("upload")} className={btnGhost}>↑ Upload</button>
                    <button onClick={() => setAddMode("url")} className={btnGhost}>+ URL</button>
                  </div>
                )}
              </div>

              {addMode && (
                <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">
                      {addMode === "upload" ? "Upload de vídeo" : "Adicionar por URL"}
                    </span>
                    <button onClick={() => setAddMode(null)} className="text-white/30 hover:text-white text-lg leading-none">×</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <input type="text" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Nome do vídeo (ex: Cerimônia)" className={inputCls} />

                    {addMode === "upload" ? (
                      <>
                        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                        {uploading ? (
                          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                            <div className="flex justify-between text-sm text-white/60 mb-2">
                              <span>Enviando para Bunny Stream...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full py-10 border border-dashed border-white/15 rounded-xl text-white/30 hover:text-white/60 hover:border-white/30 transition-colors text-sm flex flex-col items-center gap-3"
                          >
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Clique para selecionar o vídeo
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <input type="url" value={videoMp4} onChange={(e) => setVideoMp4(e.target.value)} placeholder="URL do MP4" className={inputCls} />
                        <input type="url" value={videoHls} onChange={(e) => setVideoHls(e.target.value)} placeholder="URL do HLS (.m3u8) — opcional" className={inputCls} />
                        <input type="url" value={videoThumb} onChange={(e) => setVideoThumb(e.target.value)} placeholder="URL da thumbnail — opcional" className={inputCls} />
                        <button
                          onClick={() => addVideo({ mp4Url: videoMp4 || null, hlsUrl: videoHls || null, thumbnailUrl: videoThumb || null })}
                          disabled={!videoMp4 && !videoHls}
                          className={btnPrimary}
                        >
                          Adicionar Vídeo
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {videos.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                  <IconVideos />
                  <p className="text-white/30 text-sm mt-3">Nenhum vídeo ainda</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {videos.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 transition-colors group">
                      <span className="text-white/20 text-xs w-4 text-center flex-shrink-0">{i + 1}</span>
                      <div className="w-16 h-10 flex-shrink-0 rounded overflow-hidden bg-white/10 relative">
                        {v.thumbnailUrl ? (
                          <Image src={v.thumbnailUrl} alt="" fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white/20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.title}</p>
                        <p className="text-white/30 text-xs truncate mt-0.5">{v.hlsUrl || v.mp4Url}</p>
                      </div>
                      <button
                        onClick={() => deleteVideo(v.id)}
                        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
          )}

          {/* PHOTOS */}
          {section === "photos" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-lg">Fotos</h2>
                  <p className="text-white/40 text-sm mt-0.5">{photos.length} foto{photos.length !== 1 ? "s" : ""}</p>
                </div>
                {!addPhotoMode && (
                  <div className="flex gap-2">
                    <button onClick={() => { setAddPhotoMode(true); setTimeout(() => photoFileRef.current?.click(), 50) }} className={btnGhost}>↑ Upload</button>
                    <button onClick={() => setAddPhotoMode(true)} className={btnGhost}>+ URL</button>
                  </div>
                )}
              </div>

              <input ref={photoFileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                if (e.target.files) Array.from(e.target.files).forEach(handlePhotoFileUpload)
              }} />

              {addPhotoMode && (
                <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Adicionar foto</span>
                    <button onClick={() => setAddPhotoMode(false)} className="text-white/30 hover:text-white text-lg">×</button>
                  </div>
                  {uploadingPhoto ? (
                    <div className="rounded-lg bg-white/5 p-4 mb-4 border border-white/10">
                      <div className="flex justify-between text-sm text-white/60 mb-2">
                        <span>Enviando...</span><span>{photoUploadProgress}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${photoUploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => photoFileRef.current?.click()}
                      className="w-full py-8 border border-dashed border-white/15 rounded-xl text-white/30 hover:text-white/60 hover:border-white/30 transition-colors text-sm flex flex-col items-center gap-2 mb-4"
                    >
                      <IconPhotos />
                      Upload de fotos (múltiplas)
                    </button>
                  )}
                  <div className="flex flex-col gap-2.5">
                    <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Ou cole a URL da imagem" className={inputCls} />
                    <input type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="Legenda (opcional)" className={inputCls} />
                    <button onClick={() => addPhoto(photoUrl)} disabled={!photoUrl} className={btnPrimary}>
                      Adicionar Foto
                    </button>
                  </div>
                </div>
              )}

              {photos.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                  <p className="text-white/30 text-sm">Nenhuma foto ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                      <Image src={p.url} alt={p.caption || ""} fill className="object-cover" sizes="150px" />
                      <button
                        onClick={() => deletePhoto(p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HEADING */}
          {section === "heading" && (
            <div>
              <h2 className="font-semibold text-lg mb-1">Título e Fontes</h2>
              <p className="text-white/40 text-sm mb-6">Personaliza o título, subtítulo e tipografia da galeria.</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Título</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ex: João & Maria" />
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Subtítulo</label>
                  <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputCls} placeholder="Ex: Casamento • Março 2025 • Brasília" />
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Fonte do título</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: "Georgia",    css: "Georgia, serif",         sample: "João & Maria",         desc: "Clássica • Serif padrão" },
                      { value: "Ginger",     css: "'Ginger', serif",         sample: "João & Maria",         desc: "Elegante • Ligaduras refinadas" },
                      { value: "TheMacksen", css: "'TheMacksen', serif",     sample: "João & Maria",         desc: "Moderno • Traço fino" },
                      { value: "Bridamount", css: "'Bridamount', cursive",   sample: "João & Maria",         desc: "Script • Estilo casamento" },
                      { value: "Thimberly",  css: "'Thimberly', cursive",    sample: "João & Maria",         desc: "Script • Traço elegante" },
                      { value: "Shintia",    css: "'Shintia', cursive",      sample: "João & Maria",         desc: "Script • Romântica" },
                      { value: "Housttely",  css: "'Housttely', cursive",    sample: "João & Maria",         desc: "Assinatura • Manuscrita" },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFontFamily(f.value)}
                        className="flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left"
                        style={fontFamily === f.value
                          ? { borderColor: "#C9A84C", background: "rgba(201,168,76,0.08)" }
                          : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-base leading-tight truncate" style={{ fontFamily: f.css }}>
                            {f.sample}
                          </p>
                          <p className="text-white/35 text-[10px] mt-1 tracking-wide">{f.value} — {f.desc}</p>
                        </div>
                        {fontFamily === f.value && (
                          <div className="w-4 h-4 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0 ml-3">
                            <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => patch({ title, subtitle: subtitle || null, fontFamily })}
                  className={btnPrimary}
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* BACKGROUND */}
          {section === "background" && (
            <div>
              <h2 className="font-semibold text-lg mb-1">Imagem de Capa</h2>
              <p className="text-white/40 text-sm mb-6">Aparece como fundo do hero na galeria do cliente.</p>

              {coverUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-white/10">
                  <Image src={coverUrl} alt="Capa" fill className="object-cover" sizes="600px" />
                  <button
                    onClick={() => { setCoverUrl(""); patch({ coverImageUrl: null }) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white/60 hover:text-red-400 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              <button
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
                className="w-full py-10 border border-dashed border-white/15 rounded-xl text-white/30 hover:text-white/60 hover:border-white/30 transition-colors text-sm flex flex-col items-center gap-3 mb-4"
              >
                <IconBackground />
                {uploadingCover ? "Enviando..." : "Upload de imagem de capa"}
              </button>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Ou cole a URL da imagem"
                  className={`${inputCls} flex-1`}
                />
                <button onClick={() => patch({ coverImageUrl: coverUrl || null })} className={btnPrimary}>
                  Salvar
                </button>
              </div>
            </div>
          )}

          {/* COLORS */}
          {section === "colors" && (
            <div>
              <h2 className="font-semibold text-lg mb-1">Identidade Visual</h2>
              <p className="text-white/40 text-sm mb-6">Cor de destaque usada nos botões e elementos interativos.</p>

              <div className="mb-6">
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Cor primária</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <div className="absolute inset-0 rounded-xl" style={{ background: primaryColor }} />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className={inputCls}
                      placeholder="#C9A84C"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Paletas sugeridas</label>
                <div className="grid grid-cols-5 gap-2">
                  {["#C9A84C", "#D4956A", "#9B8B6E", "#7C9E8F", "#8B7BA8"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPrimaryColor(c)}
                      className="aspect-square rounded-lg border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: primaryColor === c ? "white" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
                <p className="text-xs text-white/40 mb-2">Prévia</p>
                <div className="flex items-center gap-3">
                  <button
                    className="px-5 py-2 text-sm font-semibold text-black"
                    style={{ background: primaryColor }}
                  >
                    ▶ Reproduzir Tudo
                  </button>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: primaryColor }}>
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>

              <button onClick={() => patch({ primaryColor })} className={btnPrimary}>
                Salvar cor
              </button>
            </div>
          )}

          {/* SHARE */}
          {section === "share" && (
            <div>
              <h2 className="font-semibold text-lg mb-1">Compartilhar</h2>
              <p className="text-white/40 text-sm mb-6">Configurações de acesso e link da galeria.</p>

              <div className="flex flex-col gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Link da galeria</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm text-[#C9A84C] truncate">{galleryUrl}</code>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(galleryUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                      className={btnGhost}
                    >
                      {linkCopied ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">
                    Senha de acesso <span className="normal-case">(deixe vazio para acesso livre)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ex: casamento2025"
                      className={`${inputCls} flex-1`}
                    />
                    <button onClick={() => patch({ password: password || null })} className={btnPrimary}>
                      Salvar
                    </button>
                  </div>
                  <p className="text-white/30 text-xs mt-1.5">
                    {password ? "Galeria protegida por senha." : "Galeria acessível por qualquer pessoa com o link."}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Galeria publicada</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {published ? "Visível para os clientes" : "Rascunho — só você pode ver"}
                      </p>
                    </div>
                    <button
                      onClick={togglePublish}
                      className={`w-12 h-6 rounded-full transition-colors relative ${published ? "bg-green-500" : "bg-white/20"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${published ? "left-6.5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
