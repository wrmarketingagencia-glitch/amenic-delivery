import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white" style={{ fontFamily: "'Georgia', serif" }}>
      <Navbar />
      <Hero />
      <Services />
      <DeliverySection />
      <HowItWorks />
      <ContactSection />
      <Footer />
    </div>
  )
}

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 lg:px-16 py-6 border-b border-white/5">
      <span className="text-xl tracking-widest font-light text-white uppercase">Amenic Filmes</span>
      <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
        <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
        <a href="#entrega" className="hover:text-white transition-colors">Entrega</a>
        <a href="#contato" className="hover:text-white transition-colors">Contato</a>
      </div>
      <a
        href="https://wa.me/5561993265625"
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 rounded-sm border border-white/30 text-white text-sm tracking-wider hover:bg-white hover:text-black transition-colors"
      >
        Reservar data
      </a>
    </nav>
  )
}

function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-16 py-32 lg:py-44">
      <p className="text-white/30 text-xs font-light tracking-[0.3em] uppercase mb-8">
        Cinema documental — Brasília
      </p>
      <h1 className="text-5xl lg:text-7xl font-light leading-tight mb-8 text-white/95">
        Transformamos o seu{" "}
        <span className="italic">"sim"</span>{" "}
        em cinema.
      </h1>
      <p className="text-white/45 text-lg max-w-xl leading-relaxed mb-12">
        Silenciosos e observadores, captamos os momentos reais do seu dia — não performances para a câmera.
        O resultado: um filme que você vai querer ver e rever por décadas.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="https://wa.me/5561993265625"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-light tracking-wider text-sm hover:bg-white/90 transition-colors"
        >
          Falar pelo WhatsApp
        </a>
        <a
          href="/g/demo"
          className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white/70 text-sm tracking-wider hover:bg-white/5 transition-colors"
        >
          Ver galeria de entrega →
        </a>
      </div>
    </section>
  )
}

function Services() {
  const services = [
    {
      tag: "Casamento",
      title: "Filme de casamento",
      desc: "Do making of ao baile, capturamos a emoção real do seu dia — sem pausas artificiais, sem encenação. Apenas o que aconteceu de verdade.",
    },
    {
      tag: "Corporativo",
      title: "Evento corporativo",
      desc: "Palestras, premiações e convenções empresariais filmados com estética cinematográfica. Material que comunica profissionalismo e eleva sua marca.",
    },
    {
      tag: "Família",
      title: "Ensaio & família",
      desc: "Registros íntimos de momentos que passam rápido. Estilo documental, luz natural, sem artificialidade.",
    },
  ]
  return (
    <section id="servicos" className="border-t border-white/5 py-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-16">
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-16">O que filmamos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {services.map((s) => (
            <div key={s.tag}>
              <span className="text-white/30 text-xs tracking-widest uppercase">{s.tag}</span>
              <h3 className="text-xl font-light text-white mt-3 mb-4">{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DeliverySection() {
  return (
    <section id="entrega" className="border-t border-white/5 py-28 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-6">A entrega</p>
            <h2 className="text-4xl font-light leading-snug mb-6">
              Seu filme entregue com a experiência que ele merece.
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-8">
              Após a edição, você recebe um link exclusivo para sua galeria privada.
              Assista, compartilhe com a família e baixe os arquivos originais — tudo em um só lugar,
              sem anúncios, sem complicação.
            </p>
            <a
              href="/g/demo"
              className="inline-flex items-center gap-2 text-white/70 text-sm tracking-wider hover:text-white transition-colors border-b border-white/20 pb-0.5"
            >
              Abrir galeria de exemplo →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "▶", label: "Streaming em alta qualidade" },
              { icon: "⬇", label: "Download do arquivo original" },
              { icon: "🔒", label: "Galeria privada com senha" },
              { icon: "📱", label: "Funciona em qualquer dispositivo" },
            ].map((item) => (
              <div key={item.label} className="p-5 rounded-sm border border-white/8 bg-white/3">
                <div className="text-xl mb-3 opacity-60">{item.icon}</div>
                <p className="text-white/60 text-sm leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Reserva", desc: "Você entra em contato, confirmamos a data e assinamos o contrato." },
    { n: "02", title: "Filmagem", desc: "Chegamos silenciosos e observamos. Capturamos sem interferir no seu momento." },
    { n: "03", title: "Edição", desc: "Cada frame é tratado com color grading cinematográfico e áudio profissional." },
    { n: "04", title: "Entrega", desc: "Você recebe o link da sua galeria exclusiva. Assiste, compartilha e baixa." },
  ]
  return (
    <section className="border-t border-white/5 py-28">
      <div className="max-w-5xl mx-auto px-6 lg:px-16">
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-16">Como funciona</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="text-white/15 text-4xl font-light">{s.n}</span>
              <h3 className="text-white text-base font-light mt-3 mb-3">{s.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contato" className="border-t border-white/5 py-28 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto px-6 lg:px-16 text-center">
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-6">Vamos conversar</p>
        <h2 className="text-4xl lg:text-5xl font-light mb-6">
          Sua data merece um cinema.
        </h2>
        <p className="text-white/45 text-lg mb-12 max-w-md mx-auto">
          Datas são limitadas. Entre em contato para verificar disponibilidade.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/5561993265625"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-black font-light tracking-wider text-sm hover:bg-white/90 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            (61) 99326-5625
          </a>
          <a
            href="https://instagram.com/amenicfilmes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 border border-white/20 text-white/70 text-sm tracking-wider hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @amenicfilmes
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 lg:px-16 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-white/20 text-xs tracking-widest uppercase">Amenic Filmes</span>
        <p className="text-white/20 text-xs">© 2026 Amenic Filmes · Brasília, DF</p>
        <a
          href="/studio/login"
          className="text-white/15 text-xs hover:text-white/40 transition-colors"
        >
          Área restrita
        </a>
      </div>
    </footer>
  )
}
