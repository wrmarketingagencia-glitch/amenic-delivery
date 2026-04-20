import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { isBunnyStorageConfigured, uploadToStorage } from "@/lib/bunny"

/** Upload de imagem/arquivo genérico. Usa Bunny Storage se configurado, senão salva localmente. */
export async function uploadFile(
  file: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  if (isBunnyStorageConfigured()) {
    return uploadToStorage(file, filename, folder)
  }
  return uploadToLocal(file, filename, folder)
}

async function uploadToLocal(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/uploads/${folder}/${filename}`
}
