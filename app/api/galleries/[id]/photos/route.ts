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
  const { url, thumbnailUrl, caption } = body

  if (!url) return NextResponse.json({ error: "url é obrigatório" }, { status: 400 })

  const count = await db.photo.count({ where: { galleryId: id } })
  const photo = await db.photo.create({
    data: {
      galleryId: id,
      url,
      thumbnailUrl: thumbnailUrl || null,
      caption: caption || null,
      order: count,
    },
  })

  return NextResponse.json(photo, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const photoId = searchParams.get("photoId")
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.photo.delete({ where: { id: photoId, galleryId: id } })
  return NextResponse.json({ deleted: true })
}
