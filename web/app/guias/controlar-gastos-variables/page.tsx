import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';
import GuideTrustBlock from '@/components/GuideTrustBlock';

const description =
  'Aprende a controlar gastos variables como comida, transporte, salidas y compras sin convertir tu presupuesto en una lista imposible de seguir.';

export const metadata: Metadata = {
  title: 'Cómo controlar gastos variables sin revisar cada compra',
  description,
  alternates: { canonical: '/guias/controlar-gastos-variables' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/controlar-gastos-variables',
    title: 'Cómo controlar gastos variables | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo controlar gastos variables sin revisar cada compra',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/controlar-gastos-variables',
  url: 'https://sfiq.app/guias/controlar-gastos-variables',
  inLanguage: 'es',
  datePublished: '2026-10-15',
  dateModified: '2026-10-15',
  author: { '@type': 'Organization', name: 'Equipo editorial de SFIQ', url: 'https://sfiq.app/politica-editorial' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function ControlarGastosVariablesPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">CONTROL · GASTOS VARIABLES</p>
          <h1>Controla los gastos variables sin perseguir cada sol.</h1>
          <p>Los gastos variables cambian semana a semana. La solución no es adivinar cada compra, sino darles un límite, revisar su ritmo y corregir antes de que termine el mes.</p>
        </header>

        <GuideTrustBlock />

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#identifica">1. Identifica categorías</a>
            <a href="#limites">2. Define límites</a>
            <a href="#ritmo">3. Revisa el ritmo</a>
            <a href="#semanal">4. Usa bloques semanales</a>
            <a href="#ajustes">5. Ajusta sin prohibir</a>
            <a href="#faq">6. Preguntas frecuentes</a>
          </aside>

          <div>
            <section id="identifica">
              <h2>1. Separa los gastos que realmente cambian</h2>
              <p>Comida fuera de casa, taxis, combustible, ocio, delivery y compras pequeñas suelen variar más que alquiler o internet. No necesitas clasificar todo con precisión extrema; basta con identificar las categorías que pueden crecer si no las observas.</p>
              <p>Empieza con cuatro o cinco categorías que representen la mayor parte de tu gasto flexible. Una estructura simple es más fácil de mantener durante varios meses.</p>
            </section>

            <section id="limites">
              <h2>2. Define un límite antes de empezar el mes</h2>
              <p>Revisa cuánto gastaste durante uno o dos meses anteriores y utiliza ese historial como referencia. Si normalmente gastas S/ 500 en comida fuera, fijar S/ 150 sin cambiar hábitos probablemente no sea realista.</p>
              <div className="articleCallout"><b>Ejemplo</b><p>Si asignas S/ 400 a una categoría, no necesitas repartir exactamente S/ 100 por semana. Solo necesitas detectar si al día 10 ya consumiste S/ 300.</p></div>
            </section>

            <GuideAdSlot position="mid" />

            <section id="ritmo">
              <h2>3. Mira la velocidad del gasto, no solo el total</h2>
              <p>El monto gastado tiene más sentido cuando lo comparas con el momento del mes. Haber usado 70% del presupuesto en la primera semana es muy distinto a usarlo en los últimos cinco días.</p>
              <p>Una revisión rápida cada pocos días ayuda a corregir temprano. No necesitas abrir cada transacción; observa total de categoría, presupuesto restante y días que faltan.</p>
            </section>

            <section id="semanal">
              <h2>4. Usa bloques semanales si el mes se te hace demasiado largo</h2>
              <p>Algunas personas controlan mejor un monto semanal que uno mensual. Puedes dividir una categoría flexible en cuatro bloques aproximados y dejar un pequeño margen para los últimos días del mes.</p>
              <p>Si una semana gastas menos, no estás obligado a gastar el saldo. Puedes conservarlo como margen para semanas más costosas o moverlo a ahorro.</p>
            </section>

            <section id="ajustes">
              <h2>5. Ajusta el sistema, no castigues cada compra</h2>
              <p>Un presupuesto sostenible permite ocio y compras personales dentro de un límite. El problema aparece cuando una categoría desplaza sistemáticamente a otras más importantes.</p>
              <p>Si te pasas todos los meses en la misma categoría, tienes dos opciones: reducir hábitos concretos o reconocer que el límite era demasiado bajo y reajustar otras áreas.</p>
            </section>

            <section id="faq">
              <h2>6. Preguntas frecuentes</h2>
              <h3>¿Qué hago con los gastos que solo aparecen algunos meses?</h3>
              <p>Puedes crear una categoría de gastos ocasionales y reservar un promedio mensual. Así una reparación o compra prevista no destruye el presupuesto de un solo mes.</p>
              <h3>¿Debo registrar cada compra pequeña?</h3>
              <p>Registrar ayuda, pero el nivel de detalle depende de tu objetivo. Si el sistema es tan pesado que dejas de usarlo, simplifica categorías y enfócate en los totales que cambian decisiones.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>RELACIONADO</span>
              <h3>Detecta qué categorías explican la mayor parte de tu gasto mensual.</h3>
              <a href="/guias/control-gastos-mensuales">Revisar control de gastos mensuales →</a>
            </div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}

function ArticleHeader(){return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><a href="/guias">← Guías</a></header>}
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a><a href="/acerca">Acerca</a><a href="/contacto">Contacto</a><a href="/politica-editorial">Política editorial</a></div><span>© 2026 SFIQ</span></footer>}
