import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const galleries = await db.gallery.findMany({
    where: { studioId: session.user.id },
    include: { _count: { select: { videos: true, photos: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(galleries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, subtitle, slug, coverImageUrl, password } = body

  if (!title || !slug) {
    return NextResponse.json({ error: "title e slug são obrigatórios" }, { status: 400 })
  }

  const exists = await db.gallery.findUnique({ where: { slug } })
  if (exists) {
    return NextResponse.json({ error: "Este slug já está em uso" }, { status: 409 })
  }

  const gallery = await db.gallery.create({
    data: {
      studioId: session.user.id,
      title,
      subtitle: subtitle || null,
      slug,
      coverImageUrl: coverImageUrl || null,
      password: password || null,
    },
  })

  return NextResponse.json(gallery, { status: 201 })
}
