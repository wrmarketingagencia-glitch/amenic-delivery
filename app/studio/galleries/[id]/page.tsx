import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { GalleryEditor } from "./GalleryEditor"

interface Props { params: Promise<{ id: string }> }

export default async function GalleryEditPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/studio/login")

  const { id } = await params
  const gallery = await db.gallery.findFirst({
    where: { id, studioId: session.user.id },
    include: {
      videos: { orderBy: { order: "asc" } },
      photos: { orderBy: { order: "asc" } },
    },
  })

  if (!gallery) notFound()

  return <GalleryEditor gallery={gallery} />
}
