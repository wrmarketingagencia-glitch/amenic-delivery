import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  const exists = await db.studio.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })
  }

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)

  const slugExists = await db.studio.findUnique({ where: { slug } })
  const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug

  const hashed = await bcrypt.hash(password, 10)

  const studio = await db.studio.create({
    data: {
      name,
      email,
      password: hashed,
      slug: finalSlug,
    },
  })

  return NextResponse.json({ id: studio.id, email: studio.email }, { status: 201 })
}
