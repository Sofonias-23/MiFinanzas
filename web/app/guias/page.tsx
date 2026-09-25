const guides = [
  {
    category: 'AHORRO',
    title: 'Cómo construir un fondo de emergencia sin descuidar tu mes actual',
    excerpt: 'Define una meta, sepárala por etapas y evita que el ahorro compita con todos tus gastos a la vez.',
    href: '/guias/fondo-emergencia',
    read: '6 min',
  },
  {
    category: 'PAREJA',
    title: 'Cómo dividir gastos en pareja sin asumir que todo debe ser 50/50',
    excerpt: 'Un marco simple para acordar porcentajes, registrar quién pagó y mantener un balance claro.',
    href: '/guias/gastos-pareja',
    read: '7 min',
  },
  {
    category: 'PRESUPUESTO',
    title: 'Regla 50/30/20: úsala como referencia, no como obligación',
    excerpt: 'Entiende qué representa cada bloque y cómo adaptarlo cuando tus gastos reales no encajan.',
    href: '/guias/regla-50-30-20',
    read: '5 min',
  },
  {
    category: 'CONTROL',
    title: 'Cómo revisar tus gastos mensuales sin analizar cada compra una por una',
    excerpt: 'Categorías, tendencias y una revisión corta al cierre de mes para detectar cambios que sí importan.',
    href: '/guias/control-gastos-mensuales',
    read: '6 min',
  },
];

export default function GuiasPage() {
  return (
    <main className="guidesPage">
      <header className="topbar publicTopbar">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>

        <nav className="navLinks">
          <a href="/">Inicio</a>
          <a href="/calculadoras">Calculadoras</a>
          <a href="/guias">Guías</a>
        </nav>

        <div className="navActions">
          <a className="textButton" href="/login">Entrar</a>
          <a className="primaryButton small" href="/login">Empezar</a>
        </div>
      </header>

      <section className="guidesHero">
        <div>
          <p className="eyebrow">BIBLIOTECA MIFINANZAS</p>
          <h1>Ideas simples para decisiones financieras cotidianas.</h1>
          <p>
            Guías prácticas sobre presupuesto, ahorro y dinero en pareja. Sin convertir cada tema en una clase de economía.
          </p>
        </div>

        <a className="guidesFeatured" href="/guias/fondo-emergencia">
          <small>GUÍA DESTACADA</small>
          <h2>Fondo de emergencia: empieza con una meta que puedas sostener.</h2>
          <p>Cómo organizarlo por etapas y evitar que se convierta en otra obligación imposible.</p>
          <span>Leer guía →</span>
        </a>
      </section>

      <section className="guidesIndex">
        <div className="guidesIndexHead">
          <p className="eyebrow">TODAS LAS GUÍAS</p>
          <span>{guides.length} contenidos</span>
        </div>

        <div className="guidesList">
          {guides.map((guide, index) => (
            <a className="guideListItem" href={guide.href} key={guide.href}>
              <span className="guideListNumber">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <small>{guide.category} · {guide.read}</small>
                <h2>{guide.title}</h2>
                <p>{guide.excerpt}</p>
              </div>
              <b>→</b>
            </a>
          ))}
        </div>
      </section>

      <section className="guideToolsBand">
        <div>
          <p className="eyebrow">PASA DE LEER A CALCULAR</p>
          <h2>Prueba los números con tus propios montos.</h2>
        </div>
        <a className="primaryButton" href="/calculadoras">Abrir calculadoras →</a>
      </section>

      <footer className="publicFooter">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <div><a href="/">Inicio</a><a href="/calculadoras">Calculadoras</a><a href="/login">Entrar</a></div>
        <span>© 2026 MiFinanzas</span>
      </footer>
    </main>
  );
}
