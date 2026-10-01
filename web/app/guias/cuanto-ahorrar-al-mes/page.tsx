import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';

const description =
  'Descubre cómo definir cuánto ahorrar al mes según tus ingresos, gastos, deudas y objetivos, sin depender de un porcentaje rígido.';

export const metadata: Metadata = {
  title: 'Cuánto ahorrar al mes: cómo definir una meta realista',
  description,
  alternates: { canonical: '/guias/cuanto-ahorrar-al-mes' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/cuanto-ahorrar-al-mes',
    title: 'Cuánto ahorrar al mes: cómo definir una meta realista | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cuánto ahorrar al mes: cómo definir una meta realista | SFIQ',
    description,
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cuánto ahorrar al mes: cómo definir una meta realista',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/cuanto-ahorrar-al-mes',
  url: 'https://sfiq.app/guias/cuanto-ahorrar-al-mes',
  inLanguage: 'es',
  author: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function CuantoAhorrarPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">AHORRO · PLANIFICACIÓN</p>
          <h1>¿Cuánto deberías ahorrar al mes?</h1>
          <p>No existe un porcentaje que funcione igual para todos. Una meta sostenible depende de tus ingresos, gastos esenciales, deudas y del objetivo para el que estás ahorrando.</p>
        </header>

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#margen">1. Calcula tu margen</a>
            <a href="#porcentaje">2. Usa porcentajes como referencia</a>
            <a href="#objetivo">3. Define el objetivo</a>
            <a href="#automatico">4. Automatiza</a>
            <a href="#ajuste">5. Ajusta la meta</a>
          </aside>

          <div>
            <section id="margen">
              <h2>1. Calcula primero cuánto margen tienes</h2>
              <p>Antes de elegir una cifra de ahorro, resta de tus ingresos los gastos necesarios, pagos de deuda y compromisos del mes. El resultado muestra cuánto espacio existe realmente para ahorro, ocio y otras metas.</p>
              <p>Si tu margen es muy pequeño o negativo, forzar una meta alta puede provocar que termines usando crédito para cubrir gastos básicos.</p>
            </section>

            <section id="porcentaje">
              <h2>2. Usa porcentajes como referencia, no como obligación</h2>
              <p>Reglas como 50/30/20 pueden ayudarte a comparar tu distribución, pero no necesitan coincidir exactamente con tu situación. Si hoy puedes ahorrar 5% y mantenerlo durante meses, esa constancia puede ser más útil que proponerte 20% y abandonarlo rápidamente.</p>
              <div className="articleCallout"><b>Ejemplo</b><p>Con ingresos de S/ 3,000, ahorrar 10% equivale a S/ 300. Si esa cifra afecta pagos esenciales, puedes empezar con una cantidad menor y aumentar después.</p></div>
            </section>

            <GuideAdSlot position="mid" />
            <section id="objetivo">
              <h2>3. Una meta concreta ayuda a elegir la cantidad</h2>
              <p>No es lo mismo ahorrar para un fondo de emergencia que para unas vacaciones o una compra. Divide el objetivo total entre el número de meses disponibles para obtener una referencia mensual.</p>
              <p>Si necesitas S/ 1,200 dentro de seis meses, una referencia simple sería S/ 200 al mes. Después comprueba si ese monto cabe dentro de tu presupuesto real.</p>
            </section>

            <section id="automatico">
              <h2>4. Separa el ahorro antes de que se mezcle con el gasto</h2>
              <p>Reservar el dinero al inicio del ciclo puede reducir la probabilidad de gastarlo accidentalmente. Puedes tratar el ahorro como otra categoría del presupuesto y registrar su avance cada mes.</p>
            </section>

            <section id="ajuste">
              <h2>5. Revisa la meta cuando cambien tus ingresos o gastos</h2>
              <p>Una buena meta de ahorro no tiene que ser idéntica todo el año. Si aumentan tus ingresos, puedes elevarla. Si aparece una obligación importante, puedes reducirla temporalmente sin abandonar el hábito.</p>
              <p>Si todavía no tienes una reserva para imprevistos, revisa también la guía de <a href="/guias/fondo-emergencia">fondo de emergencia</a>.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>CALCULA</span>
              <h3>Compara tus ingresos, gastos y margen disponible antes de elegir una meta.</h3>
              <a href="/calculadoras#presupuesto">Abrir calculadora de presupuesto →</a>
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
