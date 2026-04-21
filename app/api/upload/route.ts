import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/storage"
import { uploadToStream, isBunnyStreamConfigured } from "@/lib/bunny"

export const maxDuration = 300

const VIDEO_EXTS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv", "flv", "mts", "m2ts"])

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  return VIDEO_EXTS.has(ext)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Falha ao ler o arquivo enviado" }, { status: 400 })
  }

  const file = form.get("file") as File | null
  const folder = (form.get("folder") as string) || session.user.id

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  const MAX = 4 * 1024 * 1024 * 1024 // 4 GB
  if (file.size > MAX) return NextResponse.json({ error: "Arquivo muito grande (máx 4GB)" }, { status: 413 })

  const buffer = Buffer.from(await file.arrayBuffer())

  // Route video files through Bunny Stream for HLS + thumbnail
  if (isVideoFile(file) && isBunnyStreamConfigured()) {
    try {
      const title = file.name.replace(/\.[^.]+$/, "")
      const { videoId, hlsUrl, mp4Url, thumbnailUrl } = await uploadToStream(buffer, title)
      return NextResponse.json({ url: mp4Url, hlsUrl, thumbnailUrl, videoId, filename: videoId })
    } catch (err) {
      console.error("[upload] Bunny Stream falhou, tentando storage:", err)
      // Fall through to storage fallback below
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4"
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    const url = await uploadFile(buffer, safeName, folder)
    return NextResponse.json({ url, filename: safeName })
  } catch (err) {
    console.error("[upload] erro:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha no upload" },
      { status: 500 }
    )
  }
}
