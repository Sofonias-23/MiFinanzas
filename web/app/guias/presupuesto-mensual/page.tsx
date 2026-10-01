import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';

const description =
  'Aprende cómo hacer un presupuesto mensual paso a paso, ordenar ingresos y gastos, fijar límites y revisar tu dinero sin complicarte.';

export const metadata: Metadata = {
  title: 'Cómo hacer un presupuesto mensual paso a paso',
  description,
  alternates: { canonical: '/guias/presupuesto-mensual' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/presupuesto-mensual',
    title: 'Cómo hacer un presupuesto mensual paso a paso | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cómo hacer un presupuesto mensual paso a paso | SFIQ',
    description,
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo hacer un presupuesto mensual paso a paso',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/presupuesto-mensual',
  url: 'https://sfiq.app/guias/presupuesto-mensual',
  inLanguage: 'es',
  author: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function PresupuestoMensualPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">PRESUPUESTO · GUÍA PRÁCTICA</p>
          <h1>Cómo hacer un presupuesto mensual paso a paso.</h1>
          <p>Un presupuesto útil no intenta predecir cada compra. Organiza tus ingresos, compromisos y prioridades para que sepas cuánto puedes gastar antes de llegar a fin de mes.</p>
        </header>

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#ingresos">1. Calcula tus ingresos</a>
            <a href="#gastos">2. Separa tus gastos</a>
            <a href="#limites">3. Define límites</a>
            <a href="#ahorro">4. Reserva una meta</a>
            <a href="#revision">5. Revisa el resultado</a>
          </aside>

          <div>
            <section id="ingresos">
              <h2>1. Empieza por el dinero que realmente entra</h2>
              <p>Usa el ingreso neto que tienes disponible para gastar, no una cifra teórica. Si cobras un sueldo fijo, toma el monto habitual que llega a tu cuenta. Si tus ingresos cambian, puedes trabajar con un promedio conservador de los últimos meses.</p>
              <p>El objetivo es partir de una cifra realista. Un presupuesto construido sobre ingresos que todavía no existen suele dejar poco margen cuando aparece un gasto inesperado.</p>
            </section>

            <section id="gastos">
              <h2>2. Divide tus gastos en fijos y variables</h2>
              <p>Los gastos fijos son aquellos que suelen repetirse con montos similares: alquiler, servicios, cuotas, internet o suscripciones. Los variables cambian según el mes: alimentación fuera de casa, transporte adicional, ocio o compras personales.</p>
              <div className="articleCallout"><b>Ejemplo simple</b><p>Si ingresan S/ 3,000 y tus gastos fijos suman S/ 1,500, todavía no tienes S/ 1,500 libres: faltan los gastos variables, ahorro y obligaciones ocasionales.</p></div>
            </section>

            <GuideAdSlot position="mid" />
            <section id="limites">
              <h2>3. Define límites por categoría antes de gastar</h2>
              <p>Un presupuesto funciona mejor cuando decides un límite antes de que termine el mes. En lugar de revisar después cuánto gastaste en comida o salidas, asigna un monto máximo y compara tu avance durante el mes.</p>
              <p>No necesitas crear veinte categorías. Empieza por las que más pesan en tu economía: vivienda, alimentación, transporte, deudas, ahorro y ocio.</p>
            </section>

            <section id="ahorro">
              <h2>4. Trata el ahorro como una parte del presupuesto</h2>
              <p>Ahorrar únicamente lo que sobra puede funcionar algunos meses y desaparecer en otros. Una alternativa es reservar una cantidad desde el principio, aunque sea pequeña, y considerarla parte de tu planificación mensual.</p>
              <p>Si estás construyendo una reserva, puedes complementar este paso con la guía de <a href="/guias/fondo-emergencia">fondo de emergencia</a>.</p>
            </section>

            <section id="revision">
              <h2>5. Cierra el mes con una revisión corta</h2>
              <p>Compara lo presupuestado con lo realmente gastado. Busca diferencias importantes y decide una sola corrección para el siguiente mes: ajustar un límite, reducir una categoría o cambiar una meta.</p>
              <p>No necesitas que cada monto coincida de forma exacta. Lo importante es que el presupuesto te permita anticipar decisiones y detectar rápidamente cuándo una categoría se está desviando.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>PRUÉBALO</span>
              <h3>Calcula cuánto te queda después de tus gastos fijos y variables.</h3>
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
