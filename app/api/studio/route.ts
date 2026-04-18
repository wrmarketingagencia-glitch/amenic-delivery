import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const studio = await db.studio.findUnique({
    where: { id: session.user.id },
    select: { name: true, slug: true, logoUrl: true, primaryColor: true, domain: true, email: true },
  })

  if (!studio) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(studio)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, logoUrl, primaryColor, domain } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })

  const studio = await db.studio.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      logoUrl: logoUrl?.trim() || null,
      primaryColor: primaryColor || "#C9A84C",
      domain: domain?.trim() || null,
    },
    select: { name: true, logoUrl: true, primaryColor: true, domain: true },
  })

  return NextResponse.json(studio)
}
