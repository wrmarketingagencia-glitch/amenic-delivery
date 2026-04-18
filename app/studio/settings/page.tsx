import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { SettingsForm } from "./SettingsForm"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/studio/login")

  const studio = await db.studio.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, logoUrl: true, primaryColor: true, domain: true },
  })

  if (!studio) redirect("/studio/login")

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <a href="/studio/dashboard" className="text-white/50 hover:text-white text-sm transition-colors">
          ← Dashboard
        </a>
        <span className="text-white/30">/</span>
        <span className="text-white/70 text-sm">Configurações</span>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8">Configurações do Studio</h1>
        <SettingsForm studio={studio} />
      </main>
    </div>
  )
}
