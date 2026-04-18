"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Erro ao criar conta")
      setLoading(false)
      return
    }

    // Auto-login após cadastro
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)
    if (login?.error) {
      router.push("/studio/login")
    } else {
      router.push("/studio/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-sm tracking-[0.3em] uppercase text-white/80">Amenic Filmes</span>
          </a>
          <p className="text-white/50 text-sm mt-2">Criar conta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/70 text-sm block mb-1.5">Nome do studio</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Seu Studio Fotográfico"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="studio@exemplo.com"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-1.5">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-[#C9A84C]/70"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#C9A84C] text-black font-semibold hover:bg-[#d4b55a] transition-colors disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Já tem conta?{" "}
          <Link href="/studio/login" className="text-[#C9A84C] hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
