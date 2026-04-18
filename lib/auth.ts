import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "./db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const studio = await db.studio.findUnique({
          where: { email: credentials.email as string },
        })

        if (!studio) return null

        const valid = await bcrypt.compare(credentials.password as string, studio.password)
        if (!valid) return null

        return {
          id: studio.id,
          email: studio.email,
          name: studio.name,
          slug: studio.slug,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/studio/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.slug = (user as { slug?: string }).slug
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as { slug?: string }).slug = token.slug as string
      }
      return session
    },
  },
})
