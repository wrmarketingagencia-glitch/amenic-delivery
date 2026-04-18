"use client"

import { useState } from "react"

type Studio = {
  name: string
  email: string
  logoUrl: string | null
  primaryColor: string
  domain: string | null
}

export function SettingsForm({ studio }: { studio: Studio }) {
  const [form, setForm] = useState({
    name: studio.name,
    logoUrl: studio.logoUrl ?? "",
    primaryColor: studio.primaryColor,
    domain: studio.domain ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const res = await fetch("/api/studio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setSaving(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error || "Erro ao salvar")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="p-5 bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Conta</p>
        <div className="text-sm text-white/60">
          <span className="text-white/40">Email: </span>{studio.email}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-white/70 text-sm block mb-1.5">Nome do studio</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-1.5">URL do logo</label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
          />
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Logo preview" className="mt-2 h-10 object-contain rounded" />
          )}
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-1.5">Cor primária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="w-12 h-10 rounded cursor-pointer bg-transparent border border-white/20"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#C9A84C]/70 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-1.5">Domínio personalizado</label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
            placeholder="entregas.seustudio.com.br"
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
          />
          <p className="text-white/30 text-xs mt-1">Configure um CNAME apontando para o servidor para ativar.</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">Configurações salvas!</p>}

      <button
        type="submit"
        disabled={saving}
        className="py-3 rounded-lg bg-[#C9A84C] text-black font-semibold hover:bg-[#d4b55a] transition-colors disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  )
}
