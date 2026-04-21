import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface Ctx { params: Promise<{ id: string }> }

/**
 * POST /api/galleries/[id]/folders/assign
 * Body: { type: "video"|"photo", itemId: string, folderId: string|null }
 * Moves a video or photo into a folder (or out of all folders when folderId is null)
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { type, itemId, folderId } = await req.json()

  if (type === "video") {
    const video = await db.video.update({
      where: { id: itemId, galleryId: id },
      data: { folderId: folderId ?? null },
    })
    return NextResponse.json(video)
  }

  if (type === "photo") {
    const photo = await db.photo.update({
      where: { id: itemId, galleryId: id },
      data: { folderId: folderId ?? null },
    })
    return NextResponse.json(photo)
  }

  return NextResponse.json({ error: "type deve ser 'video' ou 'photo'" }, { status: 400 })
}
