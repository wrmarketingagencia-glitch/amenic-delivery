"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Gallery, Video, Photo, Folder } from "@/app/generated/prisma/client"
import { FONT_MAP } from "@/app/g/[slug]/GalleryViewer"

type FolderWithItems = Folder & { videos: Video[]; photos: Photo[] }
type GalleryWithAll = Gallery & { videos: Video[]; photos: Photo[]; folders: FolderWithItems[] }
type Section = "upload" | "link" | "folders" | "heading" | "background" | "music" | "styles" | "settings" | "deliver"

const LAYOUTS = [
  {
    id: "gatsby",
    name: "Gatsby",
    desc: "Múltiplos vídeos",
    preview: (
      <div className="w-full h-20 bg-[#1a1a1a] rounded overflow-hidden relative flex flex-col">
        <div className="flex-1 bg-gradient-to-r from-[#222] to-[#333] relative flex items-end p-2">
          <div>
            <div className="h-2 w-16 bg-white/60 rounded mb-1" />
            <div className="h-1.5 w-10 bg-white/30 rounded" />
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-[#111]">
          {[1,2,3].map(i => <div key={i} className="w-12 h-7 bg-white/10 rounded flex-shrink-0" />)}
        </div>
      </div>
    ),
  },
  {
    id: "solace",
    name: "Solace",
    desc: "Foco único",
    preview: (
      <div className="w-full h-20 bg-[#1a1a1a] rounded overflow-hidden flex">
        <div className="flex-1 bg-gradient-to-br from-[#222] to-[#2a2a2a] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
            <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-white/60 ml-0.5" />
          </div>
        </div>
        <div className="w-16 bg-[#111] p-1.5 flex flex-col gap-1">
          {[1,2,3].map(i => <div key={i} className="h-4 bg-white/10 rounded" />)}
        </div>
      </div>
    ),
  },
  {
    id: "cinema",
    name: "Cinema",
    desc: "Imersivo",
    preview: (
      <div className="w-full h-20 bg-black rounded overflow-hidden flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="text-white/40 text-xs tracking-widest uppercase z-10">PLAY</div>
      </div>
    ),
  },
]

// Grupos de fontes exibidos na aba Estilos → Tipografia
const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  {
    label: "Elegantes (Google Fonts)",
    fonts: ["Italiana", "Della Respira", "Cormorant Garamond", "Playfair Display", "Lora", "Merriweather"],
  },
  {
    label: "Modernas (Google Fonts)",
    fonts: ["Raleway", "Slabo 13px"],
  },
  {
    label: "Personalizadas (Amenic)",
    fonts: ["Ginger", "TheMacksen", "Bridamount", "Thimberly", "Shintia", "Housttely"],
  },
]

/* ── Sidebar nav icons ─────────────────────────────────────────── */
const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`flex flex-col items-center gap-1 py-3 w-full transition-all ${active ? "text-[#C9A84C]" : "text-white/35 hover:text-white/60"}`}>
    <div className={`w-5 h-5 ${active ? "opacity-100" : "opacity-60"}`}>{icon}</div>
    <span className="text-[9px] tracking-wider uppercase">{label}</span>
  </button>
)

/* ── Section header ─────────────────────────────────────────────── */
const SectionTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xs tracking-[0.2em] uppercase text-white/40 font-light mb-4 ${className ?? ""}`}>{children}</h3>
)

export function GalleryEditor({ gallery }: { gallery: GalleryWithAll }) {
  const [section, setSection] = useState<Section>("upload")
  const [videos, setVideos] = useState<Video[]>(gallery.videos)
  const [photos, setPhotos] = useState<Photo[]>(gallery.photos)
  const [published, setPublished] = useState(gallery.isPublished)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingVideo, setUploadingVideo] = useState("")
  const [uploadError, setUploadError] = useState("")
  const videoFileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)

  // Link Videos state
  const [linkTitle, setLinkTitle] = useState("")
  const [linkMp4, setLinkMp4] = useState("")
  const [linkHls, setLinkHls] = useState("")
  const [linkThumb, setLinkThumb] = useState("")

  // Heading state
  const [title, setTitle] = useState(gallery.title)
  const [subtitle, setSubtitle] = useState(gallery.subtitle || "")
  const [headingSaved, setHeadingSaved] = useState(false)

  // Background state
  const [coverUrl, setCoverUrl] = useState(gallery.coverImageUrl || "")
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverFileRef = useRef<HTMLInputElement>(null)

  // Music state
  const [musicUrl, setMusicUrl] = useState(gallery.musicUrl || "")
  const [musicSaved, setMusicSaved] = useState(false)

  // Styles state
  const [fontFamily, setFontFamily] = useState(gallery.fontFamily || "Playfair Display")
  const [primaryColor, setPrimaryColor] = useState(gallery.primaryColor || "#C9A84C")
  const [layout, setLayout] = useState(gallery.layout || "gatsby")

  // Settings state
  const [password, setPassword] = useState(gallery.password || "")
  const [slug, setSlug] = useState(gallery.slug)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Folders state
  const [folders, setFolders] = useState<FolderWithItems[]>(gallery.folders ?? [])
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState("")

  // Preview refresh key — increments to reload iframe when content changes
  const [previewKey, setPreviewKey] = useState(0)
  const refreshPreview = useCallback(() => setPreviewKey(k => k + 1), [])

  /* ── Folder CRUD ──────────────────────────────────────────────── */
  const createFolder = async () => {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    const res = await fetch(`/api/galleries/${gallery.id}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    })
    if (res.ok) {
      const folder = await res.json()
      setFolders(f => [...f, { ...folder, videos: [], photos: [] }])
      setNewFolderName("")
    }
    setCreatingFolder(false)
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm("Remover esta pasta? Os vídeos e fotos não serão apagados.")) return
    const res = await fetch(`/api/galleries/${gallery.id}/folders?folderId=${folderId}`, { method: "DELETE" })
    if (res.ok) setFolders(f => f.filter(x => x.id !== folderId))
  }

  const renameFolder = async (folderId: string) => {
    if (!renamingName.trim()) return
    const res = await fetch(`/api/galleries/${gallery.id}/folders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId, name: renamingName.trim() }),
    })
    if (res.ok) {
      setFolders(f => f.map(x => x.id === folderId ? { ...x, name: renamingName.trim() } : x))
      setRenamingFolderId(null)
    }
  }

  const assignVideoToFolder = async (videoId: string, folderId: string | null) => {
    await fetch(`/api/galleries/${gallery.id}/folders/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "video", itemId: videoId, folderId }),
    })
    // Update local state
    const video = videos.find(v => v.id === videoId)
    if (!video) return
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) return { ...f, videos: [...f.videos.filter(v => v.id !== videoId), video] }
      return { ...f, videos: f.videos.filter(v => v.id !== videoId) }
    }))
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  const patch = useCallback(async (data: Record<string, unknown>) => {
    await fetch(`/api/galleries/${gallery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }, [gallery.id])

  /* ── Upload video ───────────────────────────────────────────── */
  const handleVideoUpload = async (file: File) => {
    const name = file.name.replace(/\.[^.]+$/, "")
    setUploadingVideo(name)
    setUploading(true)
    setUploadProgress(0)
    setUploadError("")

    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = async () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (!data.url) {
            setUploadError(data.error || "Upload não retornou URL")
          } else {
            const res = await fetch(`/api/galleries/${gallery.id}/videos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: name,
                mp4Url: data.url,
                hlsUrl: data.hlsUrl || null,
                thumbnailUrl: data.thumbnailUrl || null,
              }),
            })
            if (res.ok) {
              const video = await res.json()
              setVideos(v => [...v, video])
              refreshPreview()
            } else {
              const err = await res.json().catch(() => ({}))
              setUploadError(err.error || `Erro ao salvar vídeo (${res.status})`)
            }
          }
        } catch {
          setUploadError("Erro ao processar resposta do upload")
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          setUploadError(err.error || `Upload falhou (${xhr.status})`)
        } catch {
          setUploadError(`Upload falhou (${xhr.status})`)
        }
      }
      setUploading(false)
      setUploadProgress(0)
      setUploadingVideo("")
    }
    xhr.onerror = () => {
      setUploadError("Erro de conexão durante o upload")
      setUploading(false)
      setUploadingVideo("")
    }
    xhr.send(form)
  }

  /* ── Link video ─────────────────────────────────────────────── */
  const handleLinkVideo = async () => {
    if (!linkTitle || (!linkMp4 && !linkHls)) return
    const res = await fetch(`/api/galleries/${gallery.id}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: linkTitle, mp4Url: linkMp4 || null, hlsUrl: linkHls || null, thumbnailUrl: linkThumb || null }),
    })
    if (res.ok) {
      const video = await res.json()
      setVideos(v => [...v, video])
      setLinkTitle(""); setLinkMp4(""); setLinkHls(""); setLinkThumb("")
      refreshPreview()
    }
  }

  /* ── Delete video ───────────────────────────────────────────── */
  const deleteVideo = async (videoId: string) => {
    if (!confirm("Remover este vídeo?")) return
    const res = await fetch(`/api/galleries/${gallery.id}/videos?videoId=${videoId}`, { method: "DELETE" })
    if (res.ok) setVideos(v => v.filter(x => x.id !== videoId))
  }

  /* ── Upload cover ───────────────────────────────────────────── */
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true)
    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    if (res.ok) {
      const data = await res.json()
      setCoverUrl(data.url)
      await patch({ coverImageUrl: data.url })
    }
    setUploadingCover(false)
  }

  /* ── Upload photo ───────────────────────────────────────────── */
  const handlePhotoUpload = async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    form.append("folder", gallery.id)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    if (res.ok) {
      const data = await res.json()
      const photoRes = await fetch(`/api/galleries/${gallery.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url }),
      })
      if (photoRes.ok) {
        const photo = await photoRes.json()
        setPhotos(p => [...p, photo])
      }
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm("Remover esta foto?")) return
    const res = await fetch(`/api/galleries/${gallery.id}/photos?photoId=${photoId}`, { method: "DELETE" })
    if (res.ok) setPhotos(p => p.filter(x => x.id !== photoId))
  }

  /* ── Publish ────────────────────────────────────────────────── */
  const togglePublish = async () => {
    if (!published) {
      await fetch(`/api/galleries/${gallery.id}/publish`, { method: "POST" })
      setPublished(true)
    } else {
      await patch({ isPublished: false })
      setPublished(false)
    }
  }

  const galleryLink = typeof window !== "undefined"
    ? `${window.location.origin}/g/${gallery.slug}`
    : `/g/${gallery.slug}`

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <nav className="h-12 border-b border-white/8 flex items-center justify-between px-4 flex-shrink-0 bg-[#111] z-30">
        <div className="flex items-center gap-3">
          <Link href="/studio/dashboard" className="flex items-center gap-1.5 text-white/35 hover:text-white/70 transition-colors text-xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>
            </svg>
            Dashboard
          </Link>
          <span className="text-white/15">·</span>
          <span className="text-white/55 text-xs truncate max-w-40">{gallery.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/g/${gallery.slug}`} target="_blank"
            className="text-xs text-white/35 hover:text-white/60 transition-colors px-3 py-1.5 rounded border border-white/10 hover:border-white/20">
            Visualizar
          </a>
          <button onClick={togglePublish}
            className={`text-xs px-4 py-1.5 rounded transition-all font-light tracking-wide ${
              published ? "bg-white/8 text-white/60 hover:bg-white/12 border border-white/10" : "bg-[#C9A84C] text-black hover:bg-[#d4b55a]"
            }`}>
            {published ? "✓ Publicada" : "Publicar"}
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Icon sidebar ─────────────────────────────────── */}
        <aside className="w-[62px] flex-shrink-0 border-r border-white/8 bg-[#0e0e0e] flex flex-col overflow-y-auto py-1">
          {/* Upload */}
          <NavItem active={section === "upload"} onClick={() => setSection("upload")} label="Upload"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>} />
          {/* Link de vídeo */}
          <NavItem active={section === "link"} onClick={() => setSection("link")} label="Vídeos"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              <polygon points="10 8 16 10.5 10 13" fill="currentColor" stroke="none" opacity="0.7"/>
            </svg>} />
          {/* Subpastas — item dedicado */}
          <NavItem active={section === "folders"} onClick={() => setSection("folders")} label="Pastas"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
            </svg>} />
          {/* Título */}
          <NavItem active={section === "heading"} onClick={() => setSection("heading")} label="Título"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
            </svg>} />
          {/* Capa */}
          <NavItem active={section === "background"} onClick={() => setSection("background")} label="Capa"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>} />
          {/* Música */}
          <NavItem active={section === "music"} onClick={() => setSection("music")} label="Música"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>} />
          {/* Estilos / Fonts / Layout */}
          <NavItem active={section === "styles"} onClick={() => setSection("styles")} label="Estilos"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>} />
          {/* Configurações */}
          <NavItem active={section === "settings"} onClick={() => setSection("settings")} label="Config"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>} />
          {/* Entrega */}
          <NavItem active={section === "deliver"} onClick={() => setSection("deliver")} label="Entrega"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>} />
        </aside>

        {/* ── Section panel ────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-white/8 bg-[#111] overflow-y-auto p-5">

          {/* UPLOAD */}
          {section === "upload" && (
            <div>
              <SectionTitle>Upload de Vídeo</SectionTitle>
              <input ref={videoFileRef} type="file" accept="video/*" multiple className="hidden"
                onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(handleVideoUpload) }} />

              {uploading ? (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                  <p className="text-xs text-white/60 mb-1 truncate">{uploadingVideo}</p>
                  <div className="flex justify-between text-xs text-white/40 mb-2">
                    <span>Enviando para Bunny.net…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-px bg-white/10 overflow-hidden rounded">
                    <div className="h-full bg-[#C9A84C] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <button onClick={() => videoFileRef.current?.click()}
                  className="w-full py-10 border border-dashed border-white/15 rounded-lg text-white/30 hover:text-white/50 hover:border-white/25 transition-all text-xs tracking-wider flex flex-col items-center gap-3 mb-5">
                  <svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Clique para selecionar vídeo</span>
                  <span className="text-white/20 text-[10px]">MP4, MOV, AVI — armazenado no Bunny.net</span>
                </button>
              )}

              {uploadError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                  <p className="text-xs text-red-400 leading-relaxed">{uploadError}</p>
                  <button onClick={() => setUploadError("")} className="text-[10px] text-red-400/60 mt-1 hover:text-red-400">Fechar</button>
                </div>
              )}

              <SectionTitle>Upload de Fotos</SectionTitle>
              <input ref={photoFileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(handlePhotoUpload) }} />
              <button onClick={() => photoFileRef.current?.click()}
                className="w-full py-6 border border-dashed border-white/15 rounded-lg text-white/30 hover:text-white/50 hover:border-white/25 transition-all text-xs tracking-wider flex flex-col items-center gap-2 mb-5">
                <svg className="w-6 h-6 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Upload de fotos (múltiplas)</span>
              </button>

              {/* Video list */}
              {videos.length > 0 && (
                <>
                  <SectionTitle>Vídeos ({videos.length})</SectionTitle>
                  <div className="flex flex-col gap-2">
                    {videos.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-2 p-2.5 bg-white/4 rounded-lg border border-white/8 group">
                        <span className="text-white/20 text-xs w-4 text-center flex-shrink-0">{i + 1}</span>
                        {v.thumbnailUrl
                          ? <img src={v.thumbnailUrl} className="w-12 h-7 object-cover rounded flex-shrink-0" alt="" />
                          : <div className="w-12 h-7 bg-white/8 rounded flex-shrink-0 flex items-center justify-center"><svg className="w-3 h-3 text-white/20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg></div>
                        }
                        <p className="text-xs text-white/60 flex-1 truncate font-light">{v.title}</p>
                        <button onClick={() => deleteVideo(v.id)} className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Photo grid */}
              {photos.length > 0 && (
                <>
                  <SectionTitle className="mt-4">Fotos ({photos.length})</SectionTitle>
                  <div className="grid grid-cols-3 gap-1.5">
                    {photos.map(p => (
                      <div key={p.id} className="relative group aspect-square rounded overflow-hidden bg-white/5">
                        <img src={p.url} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => deletePhoto(p.id)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* LINK VIDEOS */}
          {section === "link" && (
            <div>
              <SectionTitle>Vincular Vídeo por URL</SectionTitle>
              <div className="flex flex-col gap-3">
                <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Nome do vídeo"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                <input value={linkHls} onChange={e => setLinkHls(e.target.value)} placeholder="URL HLS (.m3u8) — recomendado"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                <input value={linkMp4} onChange={e => setLinkMp4(e.target.value)} placeholder="URL MP4"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                <input value={linkThumb} onChange={e => setLinkThumb(e.target.value)} placeholder="URL thumbnail (opcional)"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                <button onClick={handleLinkVideo} disabled={!linkTitle || (!linkMp4 && !linkHls)}
                  className="py-2.5 bg-[#C9A84C] text-black text-xs tracking-widest uppercase rounded font-medium hover:bg-[#d4b55a] disabled:opacity-30 transition-colors">
                  Adicionar Vídeo
                </button>
              </div>
              {videos.length > 0 && (
                <div className="mt-6 flex flex-col gap-2">
                  {videos.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-2 p-2.5 bg-white/4 rounded-lg border border-white/8 group">
                      <span className="text-white/20 text-xs w-4">{i + 1}</span>
                      <p className="text-xs text-white/60 flex-1 truncate font-light">{v.title}</p>
                      <button onClick={() => deleteVideo(v.id)} className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FOLDERS */}
          {section === "folders" && (
            <div>
              <SectionTitle>Subpastas da Galeria</SectionTitle>
              <p className="text-white/25 text-[11px] font-light mb-4 leading-relaxed">
                Organize os vídeos em capítulos — ex: &ldquo;Cerimônia&rdquo;, &ldquo;Festa&rdquo;, &ldquo;Making Of&rdquo;.
              </p>

              {/* Create folder */}
              <div className="flex gap-2 mb-5">
                <input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createFolder()}
                  placeholder="Nome da pasta…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/40"
                />
                <button
                  onClick={createFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-3 py-2 rounded-lg bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/20 text-[#C9A84C] hover:text-[#C9A84C] transition-all text-xs disabled:opacity-40"
                  title="Criar pasta"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>

              {folders.length === 0 && (
                <div className="text-center py-8 text-white/20 text-xs">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                  <p>Nenhuma pasta criada ainda</p>
                </div>
              )}

              {folders.map(folder => (
                <div key={folder.id} className="mb-3 rounded-lg border border-white/8 overflow-hidden">
                  {/* Folder header */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/5">
                    {renamingFolderId === folder.id ? (
                      <input
                        value={renamingName}
                        onChange={e => setRenamingName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") renameFolder(folder.id); if (e.key === "Escape") setRenamingFolderId(null) }}
                        onBlur={() => renameFolder(folder.id)}
                        autoFocus
                        className="flex-1 bg-transparent text-xs text-white border-b border-white/30 focus:outline-none mr-2"
                      />
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <svg className="w-3.5 h-3.5 text-[#C9A84C]/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                        <span className="text-xs text-white/80 truncate">{folder.name}</span>
                        <span className="text-[10px] text-white/25 flex-shrink-0 ml-1">
                          {folder.videos.length} vídeo{folder.videos.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => { setRenamingFolderId(folder.id); setRenamingName(folder.name) }}
                        className="p-1 text-white/25 hover:text-white/60 transition-colors"
                        title="Renomear"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className="p-1 text-white/25 hover:text-red-400 transition-colors"
                        title="Remover pasta"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Assign videos to folder */}
                  {videos.length > 0 ? (
                    <div className="px-3 py-2.5 flex flex-col gap-1.5">
                      {videos.map(v => {
                        const inFolder = folder.videos.some(fv => fv.id === v.id)
                        return (
                          <label key={v.id} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={inFolder}
                              onChange={() => assignVideoToFolder(v.id, inFolder ? null : folder.id)}
                              className="w-3.5 h-3.5 rounded accent-[#C9A84C] cursor-pointer"
                            />
                            {v.thumbnailUrl
                              ? <img src={v.thumbnailUrl} className="w-9 h-5 object-cover rounded flex-shrink-0" alt="" />
                              : <div className="w-9 h-5 bg-white/8 rounded flex-shrink-0" />
                            }
                            <span className="text-xs text-white/50 group-hover:text-white/75 transition-colors truncate flex-1">{v.title}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-[10px] text-white/20">Adicione vídeos para organizar em pastas</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* HEADING */}
          {section === "heading" && (
            <div>
              <SectionTitle>Título da Galeria</SectionTitle>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Título</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Subtítulo</label>
                  <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ex: Fazenda das Flores · 12 de Janeiro"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                </div>
                <button onClick={async () => {
                  await patch({ title, subtitle: subtitle || null })
                  setHeadingSaved(true); setTimeout(() => setHeadingSaved(false), 2000)
                }}
                  className="py-2.5 bg-[#C9A84C] text-black text-xs tracking-widest uppercase rounded font-medium hover:bg-[#d4b55a] transition-colors">
                  {headingSaved ? "✓ Salvo" : "Salvar"}
                </button>
              </div>
            </div>
          )}

          {/* BACKGROUND */}
          {section === "background" && (
            <div>
              <SectionTitle>Imagem de Capa</SectionTitle>
              <input ref={coverFileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />

              {coverUrl && (
                <div className="relative mb-4 rounded-lg overflow-hidden aspect-video bg-white/5">
                  <img src={coverUrl} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => { setCoverUrl(""); patch({ coverImageUrl: null }) }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              )}

              <button onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}
                className="w-full py-6 border border-dashed border-white/15 rounded-lg text-white/30 hover:text-white/50 hover:border-white/25 transition-all text-xs tracking-wider flex flex-col items-center gap-2 mb-4">
                {uploadingCover ? "Enviando…" : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Upload de imagem</span>
                  </>
                )}
              </button>

              <div>
                <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Ou cole uma URL</label>
                <div className="flex gap-2">
                  <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://…"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/12 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                  <button onClick={() => patch({ coverImageUrl: coverUrl || null })}
                    className="px-3 py-2 bg-white/8 hover:bg-white/15 rounded-lg text-xs text-white/60 border border-white/10 transition-colors">
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MUSIC */}
          {section === "music" && (
            <div>
              <SectionTitle>Música de Fundo</SectionTitle>
              <p className="text-white/30 text-xs font-light mb-4 leading-relaxed">
                Toca suavemente enquanto o cliente navega pela galeria. Cole a URL de um arquivo de áudio (MP3, AAC).
              </p>
              <div className="flex flex-col gap-3">
                <input value={musicUrl} onChange={e => setMusicUrl(e.target.value)} placeholder="URL do áudio (MP3, AAC…)"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                {musicUrl && (
                  <audio controls src={musicUrl} className="w-full h-8 opacity-70" />
                )}
                <button onClick={async () => {
                  await patch({ musicUrl: musicUrl || null })
                  setMusicSaved(true); setTimeout(() => setMusicSaved(false), 2000)
                }}
                  className="py-2.5 bg-[#C9A84C] text-black text-xs tracking-widest uppercase rounded font-medium hover:bg-[#d4b55a] transition-colors">
                  {musicSaved ? "✓ Salvo" : "Salvar Música"}
                </button>
                {musicUrl && (
                  <button onClick={() => { setMusicUrl(""); patch({ musicUrl: null }) }}
                    className="py-2 text-xs text-white/30 hover:text-red-400 transition-colors">
                    Remover música
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STYLES */}
          {section === "styles" && (
            <div>
              <SectionTitle>Layout</SectionTitle>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {LAYOUTS.map(l => (
                  <button key={l.id} onClick={async () => { setLayout(l.id); await patch({ layout: l.id }) }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${layout === l.id ? "border-[#C9A84C]/60 bg-[#C9A84C]/6" : "border-white/10 hover:border-white/20"}`}>
                    {l.preview}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-white/70 font-light">{l.name}</span>
                      <span className="text-[10px] text-white/30">{l.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <SectionTitle>Tipografia do Título</SectionTitle>
              <p className="text-[10px] text-white/25 mb-4 leading-relaxed">
                A fonte afeta apenas o <strong className="text-white/40">título principal</strong> da galeria.<br/>
                A logo e os textos da interface permanecem fixos.
              </p>
              <div className="flex flex-col gap-5 mb-6">
                {FONT_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-white/20 mb-2">{group.label}</p>
                    <div className="flex flex-col gap-1.5">
                      {group.fonts.map(font => (
                        <button key={font} onClick={async () => { setFontFamily(font); await patch({ fontFamily: font }) }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                            fontFamily === font ? "border-[#C9A84C]/60 bg-[#C9A84C]/6" : "border-white/10 hover:border-white/20"
                          }`}>
                          <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                            <span style={{ fontFamily: FONT_MAP[font], fontSize: "1.1rem", fontWeight: 300, lineHeight: 1.1 }}>
                              João &amp; Maria
                            </span>
                            <span className="text-[9px] text-white/25 tracking-wide">{font}</span>
                          </div>
                          {fontFamily === font && (
                            <span className="w-3 h-3 rounded-full bg-[#C9A84C] flex-shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <SectionTitle>Cor de Destaque</SectionTitle>
              <div className="flex items-center gap-3 mb-3">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} maxLength={7}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/12 text-sm text-white font-mono font-light focus:outline-none focus:border-[#C9A84C]/50" />
                <button onClick={() => patch({ primaryColor })}
                  className="px-3 py-2 bg-white/8 hover:bg-white/15 rounded-lg text-xs text-white/60 border border-white/10 transition-colors">OK</button>
              </div>
              <div className="flex gap-2">
                {["#C9A84C","#B8A89A","#8B7355","#D4C5B5","#1a1a1a"].map(c => (
                  <button key={c} onClick={() => { setPrimaryColor(c); patch({ primaryColor: c }) }}
                    className="w-7 h-7 rounded-full border-2 transition-all" style={{ backgroundColor: c, borderColor: primaryColor === c ? "white" : "transparent" }} />
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div>
              <SectionTitle>Controle de Acesso</SectionTitle>
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { value: "", label: "Link Direto", desc: "Qualquer pessoa com o link acessa" },
                  { value: "PROTECTED", label: "Com Senha", desc: "Exige senha para acessar" },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => { if (opt.value === "") { setPassword(""); patch({ password: null }) } }}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      (opt.value === "" ? !password : !!password) ? "border-[#C9A84C]/50 bg-[#C9A84C]/6" : "border-white/10 hover:border-white/18"
                    }`}>
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      (opt.value === "" ? !password : !!password) ? "border-[#C9A84C] bg-[#C9A84C]" : "border-white/30"
                    }`}>
                      {(opt.value === "" ? !password : !!password) && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <div>
                      <p className="text-xs text-white/70 font-light">{opt.label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Password input */}
              <div className="mb-6">
                <label className="text-[10px] tracking-widest uppercase text-white/30 block mb-1.5">Senha da galeria</label>
                <div className="flex gap-2">
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe vazio para sem senha"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 font-light" />
                  <button onClick={() => patch({ password: password || null })}
                    className="px-3 py-2 bg-white/8 hover:bg-white/15 rounded-lg text-xs text-white/60 border border-white/10 transition-colors">OK</button>
                </div>
              </div>

              <SectionTitle>URL da Galeria</SectionTitle>
              <div className="flex gap-2">
                <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/12 text-sm text-white font-light focus:outline-none focus:border-[#C9A84C]/50" />
                <button onClick={async () => { await patch({ slug }); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000) }}
                  className="px-3 py-2 bg-white/8 hover:bg-white/15 rounded-lg text-xs text-white/60 border border-white/10 transition-colors">
                  {settingsSaved ? "✓" : "Salvar"}
                </button>
              </div>
              <p className="text-[10px] text-white/25 mt-2 font-light">/g/{slug}</p>

              <div className="mt-6 p-3 bg-white/4 rounded-lg border border-white/8">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  <strong className="text-white/60">Domínio customizado</strong><br />
                  Para links como <span className="text-[#C9A84C]/70">galeria.amenicfilmes.com.br/{slug}</span>, adicione um CNAME <code className="text-white/50">galeria</code> apontando para o seu app Netlify e configure o domínio personalizado no painel da Netlify.
                </p>
              </div>
            </div>
          )}

          {/* DELIVER */}
          {section === "deliver" && (
            <div>
              <SectionTitle>Entrega ao Cliente</SectionTitle>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
                <p className="text-[10px] text-white/40 mb-1.5 tracking-wider uppercase">Link da galeria</p>
                <p className="text-xs text-white/75 font-light break-all mb-3">{galleryLink}</p>
                <button onClick={() => navigator.clipboard?.writeText(galleryLink)}
                  className="w-full py-2 border border-white/15 hover:border-white/30 rounded text-xs text-white/50 hover:text-white/80 tracking-widest uppercase transition-all">
                  Copiar Link
                </button>
              </div>

              {!published && (
                <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 mb-4">
                  <p className="text-[10px] text-amber-400/80 leading-relaxed">
                    A galeria ainda não está publicada. Publique antes de enviar o link ao cliente.
                  </p>
                </div>
              )}

              <button onClick={togglePublish}
                className={`w-full py-3 rounded text-xs tracking-widest uppercase font-medium transition-all mb-6 ${
                  published ? "bg-white/8 text-white/50 border border-white/15 hover:bg-white/12" : "bg-[#C9A84C] text-black hover:bg-[#d4b55a]"
                }`}>
                {published ? "✓ Publicada — Clique para despublicar" : "Publicar Galeria"}
              </button>

              <SectionTitle>Informações para o Cliente</SectionTitle>
              <div className="text-xs text-white/35 font-light leading-relaxed space-y-2">
                <p>• Envie o link acima por WhatsApp ou e-mail</p>
                <p>• O cliente acessa sem precisar criar conta</p>
                <p>• Para domínio próprio como <span className="text-[#C9A84C]/60">galeria.amenicfilmes.com.br/{slug}</span>, configure o CNAME no seu provedor DNS</p>
                <p>• Ative senha na aba Config para proteção adicional</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview area ──────────────────────────────────── */}
        <div className="flex-1 bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="w-[600px] h-[380px] bg-[#0a0a0a] rounded-lg border border-white/8 overflow-hidden relative shadow-2xl mx-auto">
              <iframe
                key={previewKey}
                src={`/g/${gallery.slug}`}
                className="w-full h-full border-0 pointer-events-none"
                style={{ transform: "scale(0.95)", transformOrigin: "center center" }}
                title="Preview"
              />
              {!published && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <p className="text-white/40 text-xs tracking-widest uppercase">Publique para ver o preview</p>
                </div>
              )}
            </div>
            <a href={`/g/${gallery.slug}`} target="_blank"
              className="mt-4 inline-block text-xs text-white/25 hover:text-white/50 tracking-widest uppercase transition-colors">
              Abrir em nova aba →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
