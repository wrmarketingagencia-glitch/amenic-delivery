import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { title, hlsUrl, mp4Url, thumbnailUrl, durationSeconds, downloadEnabled } = body

  if (!title) return NextResponse.json({ error: "title é obrigatório" }, { status: 400 })

  const count = await db.video.count({ where: { galleryId: id } })
  const video = await db.video.create({
    data: {
      galleryId: id,
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
