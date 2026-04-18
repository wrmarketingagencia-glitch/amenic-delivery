import { writeFile, mkdir } from "fs/promises"
import path from "path"

const BUNNY_ZONE = process.env.BUNNY_STORAGE_ZONE
const BUNNY_KEY = process.env.BUNNY_STORAGE_API_KEY
const BUNNY_CDN = process.env.BUNNY_CDN_URL

export async function uploadFile(
  file: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  if (BUNNY_ZONE && BUNNY_KEY && BUNNY_CDN) {
    return uploadToBunny(file, filename, folder)
  }
  return uploadToLocal(file, filename, folder)
}

async function uploadToBunny(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const remotePath = `${folder}/${filename}`
  const res = await fetch(
    `https://storage.bunnycdn.com/${BUNNY_ZONE}/${remotePath}`,
    {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_KEY!,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    }
  )

  if (!res.ok) {
    throw new Error(`BunnyCDN upload failed: ${res.statusText}`)
  }

  return `${BUNNY_CDN}/${remotePath}`
}

async function uploadToLocal(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/uploads/${folder}/${filename}`
}
