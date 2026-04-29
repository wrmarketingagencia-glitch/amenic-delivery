import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import archiver from "archiver"
import { Readable } from "stream"

// Force Node.js runtime (archiver uses Node streams)
export const runtime = "nodejs"

interface Ctx { params: Promise<{ id: string }> }

/**
 * GET /api/galleries/[id]/photos/download-zip
 * Streams all gallery photos as a ZIP file (full resolution originals).
 * Gallery must be published.  No auth required — public download for clients.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params

  const gallery = await db.gallery.findFirst({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!gallery.isPublished) return NextResponse.json({ error: "Galeria não disponível" }, { status: 403 })
  if (gallery.photos.length === 0) return NextResponse.json({ error: "Sem fotos" }, { status: 400 })

  const archive = archiver("zip", { zlib: { level: 4 } })

  // Fetch and append photos one by one (streaming — low server memory)
  const addAll = async () => {
    for (let i = 0; i < gallery.photos.length; i++) {
      const photo = gallery.photos[i]
      try {
        const res = await fetch(photo.url, { signal: AbortSignal.timeout(30_000) })
        if (!res.ok || !res.body) continue
        // Derive extension from URL, fallback jpg
        const ext = photo.url.split("?")[0].split(".").pop()?.toLowerCase()?.replace(/[^a-z0-9]/g, "") || "jpg"
        const safeName = (photo.caption || "foto").replace(/[^a-z0-9\-_\s]/gi, "").trim().slice(0, 60) || "foto"
        const filename = `${String(i + 1).padStart(3, "0")}_${safeName}.${ext}`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        archive.append(Readable.fromWeb(res.body as any), { name: filename })
      } catch {
        // Skip failed photos — don't abort the entire ZIP
      }
    }
    archive.finalize()
  }

  addAll()

  // Bridge archiver (Node Readable) to Web ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      archive.on("data",  (chunk) => controller.enqueue(new Uint8Array(chunk)))
      archive.on("end",   ()      => controller.close())
      archive.on("error", (err)   => controller.error(err))
    },
    cancel() {
      archive.abort()
    },
  })

  const safeTitleFilename = gallery.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s\-_]/gi, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "galeria"

  return new Response(stream, {
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="${safeTitleFilename}_fotos.zip"`,
      "Transfer-Encoding":   "chunked",
      "Cache-Control":       "no-store",
    },
  })
}
