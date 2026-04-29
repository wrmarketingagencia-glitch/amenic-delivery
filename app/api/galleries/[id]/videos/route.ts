import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface Ctx { params: Promise<{ id: string }> }

const STREAM_KEY      = process.env.BUNNY_STREAM_API_KEY!
const STREAM_LIB      = process.env.BUNNY_STREAM_LIBRARY_ID!
const STREAM_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME!

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { title, hlsUrl, mp4Url, thumbnailUrl, durationSeconds, downloadEnabled, folderId } = body

  if (!title) return NextResponse.json({ error: "title é obrigatório" }, { status: 400 })

  // Validate folderId belongs to this gallery
  if (folderId) {
    const folder = await db.folder.findFirst({ where: { id: folderId, galleryId: id } })
    if (!folder) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 })
  }

  const count = await db.video.count({ where: { galleryId: id } })
  const video = await db.video.create({
    data: {
      galleryId: id,
      folderId: folderId || null,
      title,
      hlsUrl: hlsUrl || null,
      mp4Url: mp4Url || null,
      thumbnailUrl: thumbnailUrl || null,
      durationSeconds: durationSeconds || null,
      downloadEnabled: downloadEnabled ?? true,
      order: count,
    },
  })

  return NextResponse.json(video, { status: 201 })
}

/**
 * PATCH /api/galleries/[id]/videos
 * Handles two actions based on body:
 *
 * 1. Reorder:  { reorder: [{ id, order }, ...] }
 * 2. Rename:   { videoId, title }
 * 3. Thumbnail from frame: { videoId, thumbnailTime }  (seconds)
 * 4. Thumbnail custom URL: { videoId, thumbnailUrl }
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()

  /* ── 1. Reorder ─────────────────────────────────────────── */
  if (Array.isArray(body.reorder)) {
    await db.$transaction(
      body.reorder.map(({ id: videoId, order }: { id: string; order: number }) =>
        db.video.update({ where: { id: videoId, galleryId: id }, data: { order } })
      )
    )
    return NextResponse.json({ ok: true })
  }

  /* ── 2. Rename ──────────────────────────────────────────── */
  if (body.videoId && body.title !== undefined) {
    const video = await db.video.findFirst({ where: { id: body.videoId, galleryId: id } })
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 })

    await db.video.update({ where: { id: body.videoId }, data: { title: body.title } })

    // Also update title on Bunny Stream (best-effort)
    if (video.hlsUrl && STREAM_KEY && STREAM_LIB) {
      const guid = video.hlsUrl.split("/").slice(-2)[0]
      fetch(`https://video.bunnycdn.com/library/${STREAM_LIB}/videos/${guid}`, {
        method: "POST",
        headers: { AccessKey: STREAM_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ title: body.title }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  }

  /* ── 3. Thumbnail from video frame ─────────────────────── */
  if (body.videoId && body.thumbnailTime !== undefined) {
    const video = await db.video.findFirst({ where: { id: body.videoId, galleryId: id } })
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 })

    if (!video.hlsUrl || !STREAM_KEY || !STREAM_LIB)
      return NextResponse.json({ error: "Bunny Stream não configurado" }, { status: 500 })

    const guid = video.hlsUrl.split("/").slice(-2)[0]
    const bunnyRes = await fetch(
      `https://video.bunnycdn.com/library/${STREAM_LIB}/videos/${guid}/thumbnail?thumbnailTime=${body.thumbnailTime}`,
      { method: "POST", headers: { AccessKey: STREAM_KEY } }
    )
    if (!bunnyRes.ok) return NextResponse.json({ error: "Falha ao definir frame no Bunny" }, { status: 500 })

    // The thumbnail URL is the same CDN path — add cache-bust
    const thumbUrl = `https://${STREAM_HOSTNAME}/${guid}/thumbnail.jpg?t=${Date.now()}`
    await db.video.update({ where: { id: body.videoId }, data: { thumbnailUrl: thumbUrl } })

    return NextResponse.json({ thumbnailUrl: thumbUrl })
  }

  /* ── 4. Custom thumbnail URL ────────────────────────────── */
  if (body.videoId && body.thumbnailUrl !== undefined) {
    await db.video.update({
      where: { id: body.videoId, galleryId: id },
      data: { thumbnailUrl: body.thumbnailUrl || null },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const videoId = searchParams.get("videoId")
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.video.delete({ where: { id: videoId, galleryId: id } })
  return NextResponse.json({ deleted: true })
}
