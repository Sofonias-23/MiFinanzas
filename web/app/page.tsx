const slides = [
  {
    kicker: "TU DINERO, MÁS CLARO",
    title: "Finanzas personales sin complicarte.",
    copy: "Registra tus gastos, identifica hábitos y toma mejores decisiones con una vista simple de tu dinero.",
    tag: "01",
  },
  {
    kicker: "EN PAREJA",
    title: "Compartido cuando tiene que ser compartido.",
    copy: "Cada uno mantiene sus gastos privados y ambos pueden ver los gastos que comparten.",
    tag: "02",
  },
  {
    kicker: "BALANCE AUTOMÁTICO",
    title: "Quién pagó y quién debe, siempre claro.",
    copy: "MiFinanzas calcula el balance entre ambos para que dividir gastos no se convierta en una discusión.",
    tag: "03",
  },
  {
    kicker: "ENTIENDE TUS HÁBITOS",
    title: "Estadísticas que sí se entienden.",
    copy: "Categorías, evolución del gasto y metas para saber exactamente a dónde está yendo tu dinero.",
    tag: "04",
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="MiFinanzas">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <nav className="navLinks" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#funciones">Funciones</a>
          <a href="#pareja">Pareja</a>
          <a href="#guias">Guías</a>
        </nav>

        <div className="navActions">
          <a className="textButton" href="/login">Entrar</a>
          <a className="primaryButton small" href="/login">Empezar gratis</a>
        </div>
      </header>

      <section id="inicio" className="hero">
        <div className="heroGlow heroGlowOne" />
        <div className="heroGlow heroGlowTwo" />

        <div className="heroCopy">
          <p className="eyebrow">FINANZAS PERSONALES Y EN PAREJA</p>
          <h1>Controla tu dinero, sin enredos.</h1>
          <p className="heroText">
            Lo privado sigue siendo privado. Lo compartido se organiza entre dos.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="/login">Empezar gratis →</a>
            <a className="ghostButton" href="#funciones">Ver cómo funciona</a>
          </div>
          <div className="trustRow">
            <span>◈ Privado</span>
            <span>♡ En pareja</span>
            <span>▥ Claro</span>
          </div>
        </div>

        <div className="heroScene" aria-label="Vista conceptual de MiFinanzas">
          <div className="orb orbOne" />
          <div className="orb orbTwo" />
          <div className="sceneCard mainCard">
            <div className="miniTop">
              <span>MiFinanzas</span>
              <span className="pill">Pareja</span>
            </div>
            <p className="muted">Gasto compartido del mes</p>
            <strong>S/ 1,480.00</strong>
            <div className="chartBars">
              <i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="balance">
              <span>Tú pagaste <b>S/ 780</b></span>
              <span>Pareja pagó <b>S/ 700</b></span>
            </div>
          </div>
          <div className="sceneCard floatingCard cardLeft">
            <small>Balance</small>
            <b>+ S/ 40</b>
          </div>
          <div className="sceneCard floatingCard cardRight">
            <small>Meta mensual</small>
            <b>75%</b>
          </div>
        </div>
      </section>

      <section id="funciones" className="story">
        {slides.map((slide, index) => (
          <article className="storySlide" key={slide.tag} id={index === 1 ? "pareja" : undefined}>
            <div className={"visual visual" + (index + 1)}>
              <div className="visualRing" />
              <div className="visualCore">
                <span>{slide.tag}</span>
              </div>
            </div>
            <div className="storyCopy">
              <span className="slideNumber">{slide.tag} — 04</span>
              <p className="eyebrow">{slide.kicker}</p>
              <h2>{slide.title}</h2>
              <p>{slide.copy}</p>
              <a href="/login" className="inlineLink">Conocer más →</a>
            </div>
          </article>
        ))}
      </section>

      <section id="guias" className="contentSection">
        <div>
          <p className="eyebrow">CONTENIDO ÚTIL</p>
          <h2>Aprende a manejar mejor tu dinero.</h2>
          <p>
            Guías, calculadoras y consejos prácticos para finanzas personales y en pareja.
          </p>
        </div>
        <div className="contentCards">
          <article>
            <span>AHORRO</span>
            <h3>Cómo crear un fondo de emergencia</h3>
            <a href="#">Leer guía →</a>
          </article>
          <article>
            <span>PAREJA</span>
            <h3>Cómo dividir gastos sin complicarse</h3>
            <a href="#">Leer guía →</a>
          </article>
          <article>
            <span>PLANIFICACIÓN</span>
            <h3>Regla 50/30/20 con ejemplos reales</h3>
            <a href="#">Leer guía →</a>
          </article>
        </div>
      </section>

      <section className="finalCta">
        <p className="eyebrow">MI FINANZAS</p>
        <h2>Empieza a tomar el control de tus finanzas.</h2>
        <a className="primaryButton" href="/login">Empezar gratis →</a>
      </section>

      <footer>
        <span>© 2026 MiFinanzas</span>
        <div>
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="#">Contacto</a>
        </div>
      </footer>
    </main>
  );
}
