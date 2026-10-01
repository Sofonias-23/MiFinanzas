import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';

const description =
  'Qué son los gastos hormiga, cómo detectarlos y cómo reducirlos sin eliminar todos tus gustos. Aprende a medir su impacto mensual.';

export const metadata: Metadata = {
  title: 'Gastos hormiga: qué son, ejemplos y cómo controlarlos',
  description,
  alternates: { canonical: '/guias/gastos-hormiga' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/gastos-hormiga',
    title: 'Gastos hormiga: qué son, ejemplos y cómo controlarlos | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gastos hormiga: qué son, ejemplos y cómo controlarlos | SFIQ',
    description,
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Gastos hormiga: qué son, ejemplos y cómo controlarlos',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/gastos-hormiga',
  url: 'https://sfiq.app/guias/gastos-hormiga',
  inLanguage: 'es',
  author: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function GastosHormigaPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">CONTROL · HÁBITOS</p>
          <h1>Gastos hormiga: qué son y cómo controlarlos sin obsesionarte.</h1>
          <p>Son compras pequeñas y frecuentes que parecen poco importantes de forma aislada, pero pueden sumar una cantidad relevante cuando se repiten durante todo el mes.</p>
        </header>

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#definicion">1. Qué son</a>
            <a href="#ejemplos">2. Ejemplos comunes</a>
            <a href="#impacto">3. Calcula el impacto</a>
            <a href="#reducir">4. Cómo reducirlos</a>
            <a href="#seguimiento">5. Haz seguimiento</a>
          </aside>

          <div>
            <section id="definicion">
              <h2>1. Un gasto hormiga es pequeño, pero repetitivo</h2>
              <p>El problema no suele ser una compra concreta de bajo monto. Es la frecuencia. Un café, una comisión, un snack o una compra rápida pueden parecer insignificantes, pero repetidos muchas veces cambian el total de una categoría.</p>
            </section>

            <section id="ejemplos">
              <h2>2. Ejemplos frecuentes</h2>
              <p>Cafés fuera de casa, snacks, delivery por impulso, taxis evitables, comisiones, compras dentro de aplicaciones, suscripciones poco utilizadas o pequeñas compras diarias pueden convertirse en gastos hormiga.</p>
              <p>No significa que todos sean innecesarios. La clave es saber cuánto suman y decidir cuáles realmente disfrutas o necesitas.</p>
            </section>

            <GuideAdSlot position="mid" />
            <section id="impacto">
              <h2>3. Multiplica el gasto por su frecuencia</h2>
              <p>Un gasto de S/ 8 puede parecer pequeño. Si ocurre 20 veces en un mes, suma S/ 160. Al anualizarlo, la cifra ayuda a entender mejor el impacto del hábito.</p>
              <div className="articleCallout"><b>Haz visible la frecuencia</b><p>En lugar de preguntarte “¿S/ 8 es mucho?”, pregúntate “¿cuántas veces gasto S/ 8 en un mes?”.</p></div>
            </section>

            <section id="reducir">
              <h2>4. Reduce frecuencia antes que eliminar todo</h2>
              <p>Una estrategia práctica es elegir qué compras pequeñas quieres conservar y reducir las que aportan poco valor. Si compras algo cinco veces por semana, bajar a dos puede liberar dinero sin convertir el presupuesto en una lista de prohibiciones.</p>
            </section>

            <section id="seguimiento">
              <h2>5. Agrúpalos en una categoría y revisa el total</h2>
              <p>Registrar cada compra es útil, pero la decisión aparece cuando miras el total de la categoría. Revisa una vez por semana o al cierre del mes y compara con el límite que elegiste.</p>
              <p>Para una revisión más general, consulta la guía de <a href="/guias/control-gastos-mensuales">control de gastos mensuales</a>.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>SIGUIENTE PASO</span>
              <h3>Calcula cuánto margen te queda después de tus gastos principales.</h3>
              <a href="/calculadoras#presupuesto">Abrir calculadora →</a>
            </div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}

function ArticleHeader(){return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><a href="/guias">← Guías</a></header>}
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a></div><span>© 2026 SFIQ</span></footer>}
