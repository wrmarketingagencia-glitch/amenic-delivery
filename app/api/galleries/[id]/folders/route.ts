import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface Ctx { params: Promise<{ id: string }> }

/* ── GET — list folders ────────────────────────────────────────── */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const folders = await db.folder.findMany({
    where: { galleryId: id },
    orderBy: { order: "asc" },
    include: {
      videos: { orderBy: { order: "asc" } },
      photos: { orderBy: { order: "asc" } },
    },
  })

  return NextResponse.json(folders)
}

/* ── POST — create folder ──────────────────────────────────────── */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 })

  const count = await db.folder.count({ where: { galleryId: id } })
  const folder = await db.folder.create({
    data: { galleryId: id, name: name.trim(), order: count },
  })

  return NextResponse.json(folder, { status: 201 })
}

/* ── PATCH — rename folder ─────────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { folderId, name } = await req.json()
  if (!folderId) return NextResponse.json({ error: "folderId é obrigatório" }, { status: 400 })

  const folder = await db.folder.update({
    where: { id: folderId, galleryId: id },
    data: { name: name?.trim() },
  })

  return NextResponse.json(folder)
}

/* ── DELETE — remove folder ────────────────────────────────────── */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get("folderId")
  if (!folderId) return NextResponse.json({ error: "folderId required" }, { status: 400 })

  // Unlink all videos/photos from folder before deleting
  await db.video.updateMany({ where: { folderId }, data: { folderId: null } })
  await db.photo.updateMany({ where: { folderId }, data: { folderId: null } })
  await db.folder.delete({ where: { id: folderId, galleryId: id } })

  return NextResponse.json({ deleted: true })
}
