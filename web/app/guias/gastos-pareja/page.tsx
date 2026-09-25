export default function GastosParejaPage() {
  return (
    <main className="articlePage">
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero articleHeroPink">
          <p className="eyebrow">PAREJA · GUÍA PRÁCTICA</p>
          <h1>Cómo dividir gastos en pareja sin asumir que todo debe ser 50/50.</h1>
          <p>El objetivo no es encontrar una fórmula universal. Es acordar una regla comprensible, consistente y fácil de revisar.</p>
        </header>

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#clasificar">1. Define qué es compartido</a>
            <a href="#regla">2. Elijan una regla</a>
            <a href="#pago">3. Registren quién pagó</a>
            <a href="#revision">4. Revisen el balance</a>
          </aside>

          <div>
            <section id="clasificar"><h2>1. Primero definan qué gastos son compartidos</h2><p>Alquiler, compras del hogar o una salida juntos pueden entrar al espacio compartido. Un gasto personal no necesita convertirse en un gasto de pareja solo porque ambos conocen su existencia.</p></section>
            <section id="regla"><h2>2. Elijan una regla que puedan repetir</h2><p>50/50 es simple, pero no es la única opción. También pueden usar porcentajes distintos o montos específicos. Lo importante es que ambos entiendan cómo se calcula cada parte.</p><div className="articleCallout pink"><b>Ejemplo</b><p>En un gasto de S/ 200 con reparto 60/40, una parte sería S/ 120 y la otra S/ 80.</p></div></section>
            <section id="pago"><h2>3. Registrar quién pagó evita confundir reparto con desembolso</h2><p>Que un gasto sea 50/50 no significa que ambos hayan pagado en el momento. Si una persona cubre el total, el balance debe reflejar cuánto le corresponde recuperar de la otra.</p></section>
            <section id="revision"><h2>4. Revisen el balance, no cada operación aislada</h2><p>Compensar varios gastos entre sí suele ser más claro que realizar un pago por cada compra. Un balance acumulado reduce movimientos innecesarios y facilita cerrar cuentas cuando ambos quieran.</p></section>

            <div className="articleNext"><span>PRUÉBALO</span><h3>Divide un gasto con 50/50 o con porcentajes personalizados.</h3><a href="/calculadoras#pareja">Abrir calculadora de pareja →</a></div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}
function ArticleHeader(){return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><a href="/guias">← Guías</a></header>}
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>MiFinanzas</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a></div><span>© 2026 MiFinanzas</span></footer>}
