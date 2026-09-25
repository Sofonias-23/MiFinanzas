export default function ReglaPage() {
  return (
    <main className="articlePage">
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">PRESUPUESTO · GUÍA</p>
          <h1>Regla 50/30/20: úsala como referencia, no como obligación.</h1>
          <p>Puede ayudarte a comparar tu distribución mensual, pero no necesita encajar exactamente con la realidad de todos los hogares.</p>
        </header>

        <div className="articleBody">
          <aside><span>EN ESTA GUÍA</span><a href="#bloques">1. Los tres bloques</a><a href="#comparar">2. Cómo compararte</a><a href="#adaptar">3. Cómo adaptarla</a><a href="#util">4. Cuándo es útil</a></aside>
          <div>
            <section id="bloques"><h2>1. Los tres bloques</h2><p>La referencia separa el ingreso en necesidades, deseos y ahorro o metas. El valor principal no está en memorizar los porcentajes, sino en distinguir gastos obligatorios de gastos flexibles y objetivos futuros.</p></section>
            <section id="comparar"><h2>2. Úsala para comparar, no para castigarte</h2><p>Si vivienda y transporte consumen más de la mitad de tus ingresos, el resultado no significa automáticamente que estés administrando mal. Te muestra qué parte de tu presupuesto tiene menos margen de maniobra.</p></section>
            <section id="adaptar"><h2>3. Ajusta los porcentajes a tu contexto</h2><p>Un mes con deuda prioritaria, ingresos variables o costos de vivienda elevados puede requerir otra distribución. Mantén las categorías y adapta los porcentajes.</p><div className="articleCallout"><b>Úsala como tablero</b><p>Compara tu distribución actual con una referencia y decide qué bloque quieres modificar.</p></div></section>
            <section id="util"><h2>4. Es especialmente útil al comenzar un presupuesto</h2><p>Si todavía no tienes categorías detalladas, tres bloques son suficientes para crear una primera lectura del mes y detectar dónde necesitas más detalle.</p></section>
            <div className="articleNext"><span>CALCULA</span><h3>Escribe tu ingreso y observa la distribución de referencia.</h3><a href="/calculadoras#503020">Abrir calculadora 50/30/20 →</a></div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}
function ArticleHeader(){return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><a href="/guias">← Guías</a></header>}
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a></div><span>© 2026 MiFinanzas</span></footer>}
