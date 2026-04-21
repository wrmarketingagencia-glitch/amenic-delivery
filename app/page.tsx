"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

const HERO_VIDEO = "https://AMENICFOTOS.b-cdn.net/landing/trailer-hero.mp4"
const WHATSAPP = "https://api.whatsapp.com/send?phone=5561993265625&text=Ol%C3%A1%21+Vim+pelo+site+da+Amenic+Filmes."
const INSTAGRAM = "https://www.instagram.com/amenicfilmes"

const FOTOS = [
  "/landing/fotos/3B9A0361.jpg",
  "/landing/fotos/3B9A9557.jpg",
  "/landing/fotos/3B9A9618.jpg",
  "/landing/fotos/3B9A9709.jpg",
  "/landing/fotos/Dominique  (1).jpg",
  "/landing/fotos/Dominique .jpg",
]

export default function Home() {
  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <Hero />
      <Portfolio />
      <Experiencia />
      <ComoFunciona />
      <Contato />
      <Footer />
    </main>
  )
}

/* ── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-16 py-4 sm:py-5"
      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
    >
      <Image
        src="/landing/logo/logo-branco.png"
        alt="Amenic Filmes"
        width={120}
        height={36}
        className="object-contain w-[100px] sm:w-[120px] lg:w-[140px]"
      />
      <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
        <a href="#portfolio" className="hover:text-white transition-colors">Nossa Visão</a>
        <a href="#experiencia" className="hover:text-white transition-colors">A Experiência</a>
      </div>
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 sm:px-5 py-2 sm:py-2.5 border border-white/30 text-white text-[10px] sm:text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all"
      >
        Agendar Reunião
      </a>
    </nav>
  )
}

/* ── Hero com vídeo de fundo ────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-end overflow-hidden">
      {/* Vídeo fundo */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={HERO_VIDEO}
      />
      {/* Gradientes */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60" />

      {/* Conteúdo */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-16 pb-16 sm:pb-20 max-w-4xl">
        <p className="text-white/40 text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-4 sm:mb-6">
          Cinema Documental · Brasília
        </p>
        <h1
          className="text-4xl sm:text-5xl lg:text-7xl font-light leading-tight mb-6 sm:mb-8"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Transformamos o seu{" "}
          <em className="italic">&quot;sim&quot;</em>{" "}
          em cinema.
        </h1>
        <p className="text-white/55 text-base sm:text-lg max-w-xl leading-relaxed mb-8 sm:mb-10">
          Registros com estética de cinema, focados na emoção e na verdade do seu grande dia.
          Sem atuações — apenas a sua história imortalizada.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-black text-xs sm:text-sm tracking-widest uppercase font-medium hover:bg-white/90 transition-colors"
          >
            <WhatsAppIcon /> Entre em Contato
          </a>
          <a
            href="/studio/login"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border border-white/25 text-white/70 text-xs sm:text-sm tracking-wider hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 10l-4 4L7 10M12 3v11M5 21h14" />
            </svg>
            Acessar Galeria
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-12 bg-white animate-pulse" />
      </div>
    </section>
  )
}

/* ── Portfolio ──────────────────────────────────────────────────── */
function Portfolio() {
  const galleryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const items = galleryRef.current?.querySelectorAll<HTMLElement>(".gallery-item")
    if (!items) return

    // Mobile: reveal photos as they scroll into view (IntersectionObserver)
    const isMobile = () => window.innerWidth < 768

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (isMobile()) {
            if (entry.isIntersecting) {
              entry.target.classList.add("gallery-active-mobile")
            } else {
              entry.target.classList.remove("gallery-active-mobile")
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="portfolio" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <p className="text-white/30 text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-3">Obras</p>
          <h2
            className="text-3xl sm:text-4xl font-light"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nossa Visão
          </h2>
          <p className="text-white/30 text-xs sm:text-sm mt-3">Passe o mouse para revelar a emoção</p>
        </div>

        {/* Gallery — 3 cols desktop, 2 cols mobile */}
        <div
          ref={galleryRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5"
        >
          {FOTOS.map((src, i) => (
            <div
              key={i}
              className="gallery-item relative overflow-hidden rounded-sm aspect-[4/5] bg-black cursor-pointer"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              {/* Photo: starts grayscale dark, reveals on hover (desktop) or scroll (mobile) */}
              <img
                src={src}
                alt={`Casamento ${i + 1}`}
                className="gallery-img w-full h-full object-cover"
                style={{
                  filter: "grayscale(100%) brightness(0.4)",
                  transform: "scale(1.05)",
                  transition: "filter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              />
              {/* Inset shadow overlay */}
              <div
                className="gallery-overlay absolute inset-0"
                style={{
                  boxShadow: "inset 0 0 50px rgba(0,0,0,0.8)",
                  transition: "opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Inline styles for hover/active-mobile effects */}
      <style>{`
        .gallery-item:hover .gallery-img,
        .gallery-item.gallery-active-mobile .gallery-img {
          filter: grayscale(0%) brightness(1) !important;
          transform: scale(1) !important;
        }
        .gallery-item:hover .gallery-overlay,
        .gallery-item.gallery-active-mobile .gallery-overlay {
          opacity: 0 !important;
        }
      `}</style>
    </section>
  )
}

/* ── Experiência ────────────────────────────────────────────────── */
function Experiencia() {
  return (
    <section id="experiencia" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-16 bg-white/[0.02] border-t border-white/5">
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-light leading-snug mb-8 sm:mb-10"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Não gravamos um evento.<br />
          Documentamos um <em className="italic">legado</em>.
        </h2>

        <Image
          src="/landing/logo/logo-branco.png"
          alt="Amenic Filmes"
          width={200}
          height={60}
          className="mx-auto my-8 sm:my-10 opacity-80 object-contain"
        />

        <p className="text-white/45 leading-relaxed mb-8 sm:mb-10">
          Nossa abordagem é silenciosa e observadora. Trabalhamos com equipamentos de cinema para entregar
          cores reais, som perfeito e cortes dinâmicos que fazem você reviver o frio na barriga anos depois,
          percebendo detalhes que passaram despercebidos.
        </p>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 sm:px-10 py-3 sm:py-4 bg-white text-black text-xs sm:text-sm tracking-widest uppercase font-medium hover:bg-white/90 transition-colors"
        >
          <WhatsAppIcon /> Consultar Disponibilidade
        </a>
      </div>
    </section>
  )
}

/* ── Como funciona ──────────────────────────────────────────────── */
function ComoFunciona() {
  const steps = [
    { n: "01", title: "Reserva", desc: "Você entra em contato, confirmamos a data e assinamos o contrato." },
    { n: "02", title: "Filmagem", desc: "Chegamos silenciosos e observamos. Capturamos sem interferir no seu momento." },
    { n: "03", title: "Edição", desc: "Cada frame é tratado com color grading cinematográfico e áudio profissional." },
    { n: "04", title: "Entrega", desc: "Você recebe o link da sua galeria exclusiva. Assiste, compartilha e baixa." },
  ]
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-16 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <p className="text-white/30 text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-12 sm:mb-16">Como funciona</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="text-white/10 text-5xl font-light">{s.n}</span>
              <h3 className="text-white font-light mt-3 mb-3">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Contato ────────────────────────────────────────────────────── */
function Contato() {
  return (
    <section id="contato" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-16 border-t border-white/5 bg-white/[0.02]">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-white/30 text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-6">Vamos conversar</p>
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-light mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Sua data merece um cinema.
        </h2>
        <p className="text-white/45 text-base sm:text-lg mb-10 sm:mb-12">
          Datas são limitadas. Entre em contato para verificar disponibilidade.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3 sm:py-4 bg-white text-black text-xs sm:text-sm tracking-wider hover:bg-white/90 transition-colors"
          >
            <WhatsAppIcon /> (61) 99326-5625
          </a>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3 sm:py-4 border border-white/20 text-white/70 text-xs sm:text-sm tracking-wider hover:bg-white/5 transition-colors"
          >
            <InstagramIcon /> @amenicfilmes
          </a>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 sm:px-6 lg:px-16 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Image
          src="/landing/logo/logo-branco.png"
          alt="Amenic Filmes"
          width={100}
          height={30}
          className="opacity-50 object-contain"
        />
        <p className="text-white/20 text-xs">© 2026 Amenic Filmes · Brasília, DF</p>
        <a href="/studio/login" className="text-white/15 text-xs hover:text-white/40 transition-colors">
          Área restrita
        </a>
      </div>
    </footer>
  )
}

/* ── Icons ──────────────────────────────────────────────────────── */
function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}
