"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function NewGalleryPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    slug: "",
    password: "",
    coverImageUrl: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const autoSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")

  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: f.slug || autoSlug(v) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || "Erro ao criar galeria")
    } else {
      router.push(`/studio/galleries/${data.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/studio/dashboard" className="text-white/50 hover:text-white text-sm">
          ← Dashboard
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white/70 text-sm">Nova Galeria</span>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8">Nova Galeria</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-white/70 text-sm block mb-1.5">
              Nome do casal / evento <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="João & Maria"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1.5">Subtítulo / local</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Fazenda das Flores | 12 de Janeiro"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1.5">
              Slug da URL <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center rounded-lg bg-white/10 border border-white/20 focus-within:border-[#C9A84C]/70 overflow-hidden">
              <span className="px-3 text-white/30 text-sm border-r border-white/10 py-3 whitespace-nowrap">/g/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                required
                placeholder="joao-e-maria"
                className="flex-1 px-3 py-3 bg-transparent text-white placeholder-white/30 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1.5">
              URL da imagem de capa
            </label>
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1.5">
              Senha de acesso (opcional)
            </label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Deixe em branco para galeria aberta"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Link
              href="/studio/dashboard"
              className="flex-1 py-3 text-center border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#C9A84C] text-black font-semibold rounded-lg hover:bg-[#d4b55a] transition-colors disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar Galeria"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
