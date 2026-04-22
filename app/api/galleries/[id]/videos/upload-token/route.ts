import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const STREAM_LIBRARY_ID  = process.env.BUNNY_STREAM_LIBRARY_ID
const STREAM_API_KEY     = process.env.BUNNY_STREAM_API_KEY
const STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME

interface Ctx { params: Promise<{ id: string }> }

/**
 * POST /api/galleries/[id]/videos/upload-token
 * Body: { title: string }
 *
 * Cria uma entrada de vídeo no Bunny Stream e retorna credenciais
 * para o cliente fazer o PUT direto, evitando o proxy do Hostinger (413).
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gallery = await db.gallery.findFirst({ where: { id, studioId: session.user.id } })
  if (!gallery) return NextResponse.json({ error: "Galeria não encontrada" }, { status: 404 })

  if (!STREAM_LIBRARY_ID || !STREAM_API_KEY || !STREAM_CDN_HOSTNAME) {
    return NextResponse.json({ error: "Bunny Stream não configurado no servidor" }, { status: 500 })
  }

  const body = await req.json()
  const title = (body.title ?? "").trim()
  if (!title) return NextResponse.json({ error: "title é obrigatório" }, { status: 400 })

  // 1. Cria a entrada do vídeo na biblioteca Bunny Stream
  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: { AccessKey: STREAM_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  )
  if (!createRes.ok) {
    const txt = await createRes.text()
    return NextResponse.json(
      { error: `Bunny Stream recusou criar vídeo: ${createRes.status} — ${txt}` },
      { status: 502 }
    )
  }

  const { guid: videoId } = await createRes.json()
  const cdn = STREAM_CDN_HOSTNAME

  // 2. Devolve as credenciais de upload para o cliente
  return NextResponse.json({
    videoId,
    uploadUrl: `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${videoId}`,
    apiKey:    STREAM_API_KEY,   // seguro: só usuários autenticados chegam aqui
    hlsUrl:         `https://${cdn}/${videoId}/playlist.m3u8`,
    mp4Url:         `https://${cdn}/${videoId}/play_720p.mp4`,
    thumbnailUrl:   `https://${cdn}/${videoId}/thumbnail.jpg`,
  })
}
