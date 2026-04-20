import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isBunnyStreamConfigured, uploadToStream } from "@/lib/bunny"
import { uploadFile } from "@/lib/storage"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  const folder = (form.get("folder") as string) || session.user.id
  const type = (form.get("type") as string) || "file" // "video" | "file"

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  const MAX = 2 * 1024 * 1024 * 1024
  if (file.size > MAX) return NextResponse.json({ error: "Arquivo muito grande (máx 2GB)" }, { status: 413 })

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4"
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // Vídeos → Bunny Stream (transcodifica para HLS automaticamente)
  if (type === "video" && isBunnyStreamConfigured()) {
    const title = (form.get("title") as string) || file.name.replace(/\.[^.]+$/, "")
    const result = await uploadToStream(buffer, title)
    return NextResponse.json({
      url: result.mp4Url,
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      videoId: result.videoId,
      filename: safeName,
    })
  }

  // Imagens e fallback → Bunny Storage ou local
  const url = await uploadFile(buffer, safeName, folder)
  return NextResponse.json({ url, filename: safeName })
}

export const config = {
  api: { bodyParser: false },
}
