// ─── Bunny Storage (fotos / imagens) ────────────────────────────────────────
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE
const STORAGE_KEY = process.env.BUNNY_STORAGE_API_KEY
const CDN_URL = process.env.BUNNY_CDN_URL

// ─── Bunny Stream (vídeos com transcodificação HLS) ─────────────────────────
const STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID
const STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY
const STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME

export function isBunnyStorageConfigured(): boolean {
  return !!(STORAGE_ZONE && STORAGE_KEY && CDN_URL)
}

export function isBunnyStreamConfigured(): boolean {
  return !!(STREAM_LIBRARY_ID && STREAM_API_KEY && STREAM_CDN_HOSTNAME)
}

/** Upload de imagem/arquivo para o Bunny Storage. Retorna a URL pública do CDN. */
export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  const remotePath = `${folder}/${filename}`
  const res = await fetch(
    `https://storage.bunnycdn.com/${STORAGE_ZONE}/${remotePath}`,
    {
      method: "PUT",
      headers: {
        AccessKey: STORAGE_KEY!,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    }
  )
  if (!res.ok) {
    throw new Error(`Bunny Storage upload falhou: ${res.status} ${res.statusText}`)
  }
  return `${CDN_URL}/${remotePath}`
}

export interface BunnyStreamResult {
  videoId: string
  hlsUrl: string
  mp4Url: string
  thumbnailUrl: string
}

/**
 * Upload de vídeo para o Bunny Stream.
 * O Bunny transcodifica automaticamente para HLS após o upload.
 * Retorna as URLs prontas para uso.
 */
export async function uploadToStream(
  buffer: Buffer,
  title: string
): Promise<BunnyStreamResult> {
  // 1. Cria a entrada do vídeo na biblioteca
  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: STREAM_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  )
  if (!createRes.ok) {
    throw new Error(`Bunny Stream criar vídeo falhou: ${createRes.status}`)
  }
  const { guid: videoId } = await createRes.json()

  // 2. Envia os bytes do vídeo
  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: STREAM_API_KEY!,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    }
  )
  if (!uploadRes.ok) {
    throw new Error(`Bunny Stream upload falhou: ${uploadRes.status}`)
  }

  const cdn = STREAM_CDN_HOSTNAME!
  return {
    videoId,
    hlsUrl: `https://${cdn}/${videoId}/playlist.m3u8`,
    mp4Url: `https://${cdn}/${videoId}/play_720p.mp4`,
    thumbnailUrl: `https://${cdn}/${videoId}/thumbnail.jpg`,
  }
}
