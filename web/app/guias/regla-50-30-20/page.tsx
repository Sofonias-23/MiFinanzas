import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';

const description =
  'Entiende cómo funciona la regla 50/30/20, calcula necesidades, deseos y ahorro, y adapta los porcentajes a tu realidad financiera.';

export const metadata: Metadata = {
  title: 'Regla 50/30/20: cómo calcular y adaptar tu presupuesto',
  description,
  alternates: {
    canonical: '/guias/regla-50-30-20',
  },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/regla-50-30-20',
    title: 'Regla 50/30/20: cómo calcular y adaptar tu presupuesto | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regla 50/30/20: cómo calcular y adaptar tu presupuesto | SFIQ',
    description,
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Regla 50/30/20: úsala como referencia, no como obligación.',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/regla-50-30-20',
  url: 'https://sfiq.app/guias/regla-50-30-20',
  inLanguage: 'es',
  author: {
    '@type': 'Organization',
    name: 'SFIQ',
    url: 'https://sfiq.app/',
  },
  publisher: {
    '@type': 'Organization',
    name: 'SFIQ',
    url: 'https://sfiq.app/',
  },
};

export default function ReglaPage() {
  return (
    <main className="articlePage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
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
            <section id="bloques"><h2>1. Los tres bloques</h2><p>La referencia separa el ingreso en necesidades, deseos y ahorro o metas. El valor principal no está en memorizar los porcentajes, sino en distinguir gastos obligatorios de gastos flexibles y objetivos futuros.</p><p>Con un ingreso mensual de S/ 3,000, la referencia sería S/ 1,500 para necesidades, S/ 900 para deseos y S/ 600 para ahorro o metas. Es un punto de comparación, no una obligación contable.</p></section>
            <section id="comparar"><h2>2. Úsala para comparar, no para castigarte</h2><p>Si vivienda y transporte consumen más de la mitad de tus ingresos, el resultado no significa automáticamente que estés administrando mal. Te muestra qué parte de tu presupuesto tiene menos margen de maniobra.</p><p>También puede revelar el problema contrario: si tus gastos flexibles crecen cada mes, la comparación permite detectar cuánto espacio están quitando al ahorro o a otras metas.</p></section>
            <GuideAdSlot position="mid" />
            <section id="adaptar"><h2>3. Ajusta los porcentajes a tu contexto</h2><p>Un mes con deuda prioritaria, ingresos variables o costos de vivienda elevados puede requerir otra distribución. Mantén las categorías y adapta los porcentajes.</p><p>Por ejemplo, una distribución 60/20/20 o 55/25/20 puede ser más representativa para determinadas situaciones. Lo importante es que el reparto ayude a tomar decisiones y no que coincida exactamente con una fórmula.</p><div className="articleCallout"><b>Úsala como tablero</b><p>Compara tu distribución actual con una referencia y decide qué bloque quieres modificar.</p></div></section>
            <section id="util"><h2>4. Es especialmente útil al comenzar un presupuesto</h2><p>Si todavía no tienes categorías detalladas, tres bloques son suficientes para crear una primera lectura del mes y detectar dónde necesitas más detalle.</p><p>Después puedes pasar a un presupuesto más específico por categorías y usar la regla únicamente como una referencia general de equilibrio entre obligaciones, consumo y objetivos.</p></section>
            <GuideAdSlot position="end" />
            <div className="articleNext"><span>CALCULA</span><h3>Escribe tu ingreso y observa la distribución de referencia.</h3><a href="/calculadoras#503020">Abrir calculadora 50/30/20 →</a></div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}
function ArticleHeader(){return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><a href="/guias">← Guías</a></header>}
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a></div><span>© 2026 SFIQ</span></footer>}
