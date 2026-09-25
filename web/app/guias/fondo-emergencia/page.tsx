export default function FondoEmergenciaPage() {
  return (
    <main className="articlePage">
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">AHORRO · GUÍA PRÁCTICA</p>
          <h1>Cómo construir un fondo de emergencia sin descuidar tu mes actual.</h1>
          <p>La meta no es ahorrar una cifra enorme de inmediato. Es crear una reserva separada del dinero que usas todos los meses.</p>
        </header>

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#objetivo">1. Define el objetivo</a>
            <a href="#etapas">2. Trabaja por etapas</a>
            <a href="#separado">3. Mantenlo separado</a>
            <a href="#reponer">4. Repón después de usarlo</a>
          </aside>

          <div>
            <section id="objetivo">
              <h2>1. Define para qué existe ese dinero</h2>
              <p>Un fondo de emergencia sirve para absorber gastos imprevistos importantes sin depender de crédito o desordenar por completo tu presupuesto del mes.</p>
              <div className="articleCallout"><b>Idea clave</b><p>No mezcles “ahorro para vacaciones” con “dinero para una emergencia”. Son objetivos distintos.</p></div>
            </section>

            <section id="etapas">
              <h2>2. Divide la meta en etapas</h2>
              <p>En lugar de pensar solo en una meta final, empieza con una primera reserva pequeña y concreta. Después aumenta el objetivo progresivamente según tus gastos esenciales y estabilidad de ingresos.</p>
              <p>Ese enfoque reduce la fricción inicial y permite ajustar la meta con información real de tus gastos mensuales.</p>
            </section>

            <section id="separado">
              <h2>3. Mantenlo fuera del gasto cotidiano</h2>
              <p>Si el dinero está mezclado con el saldo que utilizas para compras diarias, es más fácil consumirlo sin darte cuenta. Una separación clara ayuda a tratarlo como reserva, no como saldo disponible.</p>
            </section>

            <section id="reponer">
              <h2>4. Si lo usas, vuelve a construirlo</h2>
              <p>Usar el fondo para una emergencia real no significa que el plan falló. Significa que cumplió su función. Después del evento, incorpora su reposición como una nueva meta del presupuesto.</p>
            </section>

            <div className="articleNext">
              <span>SIGUIENTE PASO</span>
              <h3>Calcula cuánto margen tienes cada mes antes de fijar tu aporte.</h3>
              <a href="/calculadoras#presupuesto">Abrir calculadora de presupuesto →</a>
            </div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}

function ArticleHeader() {
  return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><a href="/guias">← Guías</a></header>;
}
function ArticleFooter() {
  return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a></div><span>© 2026 MiFinanzas</span></footer>;
}