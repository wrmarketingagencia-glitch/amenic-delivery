import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import pg from "pg"

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET ✓" : "UNDEFINED ✗")

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const db = new PrismaClient({ adapter })

  const email = process.env.SEED_STUDIO_EMAIL || "contato@amenicfilmes.com.br"
  const rawPassword = process.env.SEED_STUDIO_PASSWORD || "amenic123"
  const password = await bcrypt.hash(rawPassword, 10)

  const studio = await db.studio.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password,
      name: "Amenic Filmes",
      slug: "amenic",
      primaryColor: "#ffffff",
    },
  })

  console.log("Studio criado:", studio.email)

  const gallery = await db.gallery.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      studioId: studio.id,
      slug: "demo",
      title: "João & Maria",
      subtitle: "Fazenda das Flores | 12 de Janeiro",
      isPublished: true,
      coverImageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    },
  })

  const existingVideo = await db.video.findFirst({ where: { galleryId: gallery.id } })
  if (!existingVideo) {
    await db.video.create({
      data: {
        galleryId: gallery.id,
        title: "Filme Completo",
        mp4Url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
        durationSeconds: 596,
        order: 0,
      },
    })
  }

  console.log("\n✅ Seed concluído!")
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${rawPassword}`)
  console.log("   Galeria demo: /g/demo")

  await db.$disconnect()
}

main().catch(console.error)
