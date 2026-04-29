import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import https from "https"
import http from "http"

export const runtime = "nodejs"
export const maxDuration = 3600

interface Ctx { params: Promise<{ id: string }> }

// Resoluções tentadas em ordem decrescente de qualidade
const RESOLUTION_PRIORITY = ["2160p", "1440p", "1080p", "720p", "480p", "360p", "240p"]

const CDN_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; AmenicDownloader/1.0)",
  "Accept":     "*/*",
  // Bunny CDN tem hotlink protection — exige Referer do domínio autorizado
  "Referer":    "https://amenicfilmes.com.br",
}

/**
 * GET /api/galleries/[id]/videos/download?videoId=xxx
 *
 * Detecta a maior resolução MP4 disponível no Bunny CDN (HEAD rápido) e faz
 * proxy em full resolution via módulo nativo Node.js — evita o timeout interno
 * do Next.js e serve Content-Disposition: attachment para forçar download.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const videoId = req.nextUrl.searchParams.get("videoId")

  if (!videoId) return NextResponse.json({ error: "videoId obrigatório" }, { status: 400 })

  const gallery = await db.gallery.findFirst({
    where: { id },
    select: { isPublished: true },
  })
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!gallery.isPublished) return NextResponse.json({ error: "Galeria não disponível" }, { status: 403 })

  const video = await db.video.findFirst({
    where: { id: videoId, galleryId: id },
    select: { mp4Url: true, downloadEnabled: true, title: true },
  })
  if (!video)                 return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 })
  if (!video.mp4Url)          return NextResponse.json({ error: "Vídeo sem URL MP4" }, { status: 400 })
  if (!video.downloadEnabled) return NextResponse.json({ error: "Download desabilitado" }, { status: 403 })

  const safeName = (video.title || "video")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s\-_]/gi, "").replace(/\s+/g, "_")
    .slice(0, 100) || "video"

  // Detecta a maior resolução disponível (HEAD paralelo)
  const bestUrl = await findBestResolution(video.mp4Url)
  console.log(`[download] usando resolução: ${bestUrl}`)

  return fetchWithRedirects(bestUrl, safeName, 10)
}

/**
 * Testa primeiro o arquivo original (máxima qualidade, sem recompressão),
 * depois as resoluções MP4 em paralelo como fallback.
 * Retorna a melhor URL disponível.
 */
async function findBestResolution(mp4Url: string): Promise<string> {
  // Extrai base e GUID da URL armazenada:
  // https://vz-xxx.b-cdn.net/{guid}/play_720p.mp4
  const match = mp4Url.match(/^(https?:\/\/[^/]+)\/([^/]+)\/play_\w+\.mp4$/)
  if (!match) return mp4Url  // URL em formato desconhecido — usa como está

  const [, base, guid] = match

  // Prioridade 1: arquivo original (4K sem recompressão, hasOriginal: true no Bunny)
  const originalUrl = `${base}/${guid}/original`
  try {
    const status = await headRequest(originalUrl)
    if (status === 200) {
      console.log(`[download] arquivo original disponível: ${originalUrl}`)
      return originalUrl
    }
  } catch { /* ignora, tenta MP4 fallback */ }

  // Prioridade 2: maior resolução MP4 disponível (gerada pelo Bunny MP4 Fallback)
  const results = await Promise.all(
    RESOLUTION_PRIORITY.map(async (res) => {
      const url = `${base}/${guid}/play_${res}.mp4`
      try {
        const status = await headRequest(url)
        return { res, url, ok: status === 200 }
      } catch {
        return { res, url, ok: false }
      }
    })
  )

  const best = results.find(r => r.ok)
  return best ? best.url : mp4Url
}

/** Faz um HEAD request e retorna o status HTTP. */
function headRequest(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const reqUrl = new URL(url)
    const client = reqUrl.protocol === "https:" ? https : http
    const req = client.request(
      {
        hostname: reqUrl.hostname,
        port:     reqUrl.port || (reqUrl.protocol === "https:" ? 443 : 80),
        path:     reqUrl.pathname + reqUrl.search,
        method:   "HEAD",
        headers:  CDN_HEADERS,
      },
      (res) => { res.destroy(); resolve(res.statusCode ?? 0) }
    )
    req.setTimeout(5000, () => { req.destroy(); reject(new Error("timeout")) })
    req.on("error", reject)
    req.end()
  })
}

/** Faz GET em `url`, seguindo redirects 3xx até `maxRedirects` vezes. */
function fetchWithRedirects(url: string, safeName: string, maxRedirects: number): Promise<Response> {
  return new Promise<Response>((resolve) => {
    const reqUrl = new URL(url)
    const client = reqUrl.protocol === "https:" ? https : http

    const req = client.request(
      {
        hostname: reqUrl.hostname,
        port:     reqUrl.port || (reqUrl.protocol === "https:" ? 443 : 80),
        path:     reqUrl.pathname + reqUrl.search,
        method:   "GET",
        headers:  CDN_HEADERS,
      },
      (res) => {
        const status = res.statusCode ?? 0

        // Segue qualquer redirect 3xx
        if (status >= 300 && status < 400 && res.headers.location) {
          res.destroy()
          if (maxRedirects <= 0) {
            resolve(NextResponse.json({ error: "Muitos redirects" }, { status: 502 }) as Response)
            return
          }
          let nextUrl: string
          try {
            nextUrl = new URL(res.headers.location, url).toString()
          } catch {
            resolve(NextResponse.json({ error: "Redirect URL inválida" }, { status: 502 }) as Response)
            return
          }
          fetchWithRedirects(nextUrl, safeName, maxRedirects - 1).then(resolve)
          return
        }

        if (status === 0 || status >= 400) {
          res.destroy()
          resolve(NextResponse.json({ error: `CDN retornou ${status}` }, { status: 502 }) as Response)
          return
        }

        resolve(streamResponse(res, safeName))
      }
    )

    req.on("error", (err) => {
      console.error("[download] request error:", err.message, "url:", url)
      resolve(NextResponse.json({ error: "Falha ao conectar ao CDN" }, { status: 502 }) as Response)
    })

    req.end()
  })
}

function streamResponse(upstream: http.IncomingMessage, safeName: string): Response {
  const headers = new Headers()
  headers.set("Content-Disposition", `attachment; filename="${safeName}.mp4"`)
  // Bunny retorna "application/octet-stream" para o arquivo original — força video/mp4
  const ct = upstream.headers["content-type"] || ""
  headers.set("Content-Type", ct.startsWith("video/") ? ct : "video/mp4")
  headers.set("Cache-Control", "no-store")

  if (upstream.headers["content-length"])
    headers.set("Content-Length", upstream.headers["content-length"])
  if (upstream.headers["accept-ranges"])
    headers.set("Accept-Ranges", upstream.headers["accept-ranges"])

  const readable = new ReadableStream({
    start(controller) {
      upstream.on("data",  (chunk) => controller.enqueue(new Uint8Array(chunk)))
      upstream.on("end",   ()      => controller.close())
      upstream.on("error", (err)   => controller.error(err))
    },
    cancel() { upstream.destroy() },
  })

  return new Response(readable, { status: 200, headers })
}
