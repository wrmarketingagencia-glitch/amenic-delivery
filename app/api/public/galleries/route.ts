import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/public/galleries
 * Retorna galerias marcadas como showInPortfolio = true.
 * Endpoint público — sem autenticação.
 */
export async function GET() {
  const galleries = await db.gallery.findMany({
    where: { showInPortfolio: true },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      coverImageUrl: true,
      _count: { select: { videos: true, photos: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(galleries)
}
