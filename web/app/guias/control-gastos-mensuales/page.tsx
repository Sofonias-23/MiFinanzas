export default function ControlGastosPage() {
  return (
    <main className="articlePage">
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">CONTROL · GUÍA</p>
          <h1>Cómo revisar tus gastos mensuales sin analizar cada compra una por una.</h1>
          <p>Una revisión útil busca patrones: cuánto gastaste, dónde cambió el comportamiento y qué categoría merece atención.</p>
        </header>

        <div className="articleBody">
          <aside><span>EN ESTA GUÍA</span><a href="#total">1. Mira el total</a><a href="#categorias">2. Revisa categorías</a><a href="#cambios">3. Busca cambios</a><a href="#accion">4. Define una acción</a></aside>
          <div>
            <section id="total"><h2>1. Empieza por el total del mes</h2><p>Antes de entrar al detalle, compara ingresos, gastos y saldo. Esa vista general te dice si necesitas investigar más o si el mes está dentro de lo esperado.</p></section>
            <section id="categorias"><h2>2. Ordena las categorías por impacto</h2><p>Concentrarte primero en las categorías de mayor monto evita gastar tiempo revisando decenas de compras pequeñas que no cambian el resultado general.</p></section>
            <section id="cambios"><h2>3. Busca variaciones, no perfección</h2><p>Una categoría que normalmente es estable y sube de forma importante merece más atención que una categoría variable que se mantiene dentro de su rango habitual.</p></section>
            <section id="accion"><h2>4. Termina con una sola acción concreta</h2><p>Una buena revisión mensual puede terminar con una decisión tan simple como ajustar un presupuesto, reducir una categoría o aumentar una meta de ahorro.</p></section>
            <div className="articleNext"><span>SIGUIENTE PASO</span><h3>Calcula tu margen mensual con tus cifras actuales.</h3><a href="/calculadoras#presupuesto">Abrir calculadora →</a></div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}
function ArticleHeader(){return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><a href="/guias">← Guías</a></header>}
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a></div><span>© 2026 MiFinanzas</span></footer>}
