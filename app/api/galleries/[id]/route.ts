import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const gallery = await db.gallery.findFirst({
    where: { id, studioId: session.user.id },
    include: {
      videos: { orderBy: { order: "asc" } },
      photos: { orderBy: { order: "asc" } },
    },
  })

  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(gallery)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const gallery = await db.gallery.updateMany({
    where: { id, studioId: session.user.id },
    data: body,
  })

  return NextResponse.json({ updated: gallery.count })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.gallery.deleteMany({ where: { id, studioId: session.user.id } })
  return NextResponse.json({ deleted: true })
}
