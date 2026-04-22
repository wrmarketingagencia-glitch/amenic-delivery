import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const STORAGE_KEY  = process.env.BUNNY_STORAGE_API_KEY
const CDN_URL      = process.env.BUNNY_CDN_URL

interface Ctx { params: Promise<{ id: string }> }

/**
 * POST /api/galleries/[id]/cover-upload-token
 * Body: { filename: string }
 *
 * Gera URL de upload direto ao Bunny Storage para a imagem de capa.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 })

  if (!STORAGE_ZONE || !STORAGE_KEY || !CDN_URL) {
    return NextResponse.json({ error: "Bunny Storage não configurado" }, { status: 500 })
  }

  const body = await req.json()
  const filename = (body.filename ?? "").trim()
  if (!filename) return NextResponse.json({ error: "filename é obrigatório" }, { status: 400 })

  const ext      = filename.split(".").pop()?.toLowerCase() || "jpg"
  const safeName = `cover-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const remotePath = `${id}/${safeName}`

  return NextResponse.json({
    uploadUrl: `https://storage.bunnycdn.com/${STORAGE_ZONE}/${remotePath}`,
    apiKey:    STORAGE_KEY,
    cdnUrl:    `${CDN_URL}/${remotePath}`,
  })
}
