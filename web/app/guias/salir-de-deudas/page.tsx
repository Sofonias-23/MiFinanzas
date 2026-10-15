import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';
import GuideTrustBlock from '@/components/GuideTrustBlock';

const description =
  'Una guía práctica para ordenar deudas, priorizar pagos, evitar nuevas obligaciones y construir un plan mensual que puedas sostener.';

export const metadata: Metadata = {
  title: 'Cómo salir de deudas paso a paso sin desordenar tu mes',
  description,
  alternates: { canonical: '/guias/salir-de-deudas' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/salir-de-deudas',
    title: 'Cómo salir de deudas paso a paso | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo salir de deudas paso a paso sin desordenar tu mes',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/salir-de-deudas',
  url: 'https://sfiq.app/guias/salir-de-deudas',
  inLanguage: 'es',
  datePublished: '2026-10-15',
  dateModified: '2026-10-15',
  author: { '@type': 'Organization', name: 'Equipo editorial de SFIQ', url: 'https://sfiq.app/politica-editorial' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function SalirDeDeudasPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">DEUDAS · PLAN DE ACCIÓN</p>
          <h1>Cómo salir de deudas sin desordenar todo tu presupuesto.</h1>
          <p>El objetivo no es pagar “lo máximo posible” un solo mes. Es crear un plan que reduzca deuda de forma constante sin obligarte a volver a endeudarte para cubrir gastos básicos.</p>
        </header>

        <GuideTrustBlock />

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#inventario">1. Haz un inventario</a>
            <a href="#capacidad">2. Calcula tu capacidad</a>
            <a href="#prioridad">3. Elige una prioridad</a>
            <a href="#plan">4. Construye el plan</a>
            <a href="#errores">5. Evita recaídas</a>
            <a href="#faq">6. Preguntas frecuentes</a>
          </aside>

          <div>
            <section id="inventario">
              <h2>1. Empieza por saber exactamente qué debes</h2>
              <p>Haz una lista con cada deuda: saldo pendiente, cuota mensual, fecha de pago, tasa o costo financiero si lo conoces y si existe algún atraso. No mezcles la deuda con gastos futuros; registra únicamente obligaciones que ya existen.</p>
              <p>Si tienes varias tarjetas o préstamos, ver el total puede incomodar, pero evita tomar decisiones a ciegas. Una deuda que parece pequeña puede ser costosa si tiene intereses altos o penalidades.</p>
              <div className="articleCallout"><b>Regla práctica</b><p>Antes de adelantar pagos, confirma que alquiler, alimentos, transporte básico y servicios esenciales del mes estén cubiertos.</p></div>
            </section>

            <section id="capacidad">
              <h2>2. Calcula cuánto puedes destinar sin crear otra deuda</h2>
              <p>Resta de tu ingreso neto los gastos esenciales y compromisos mínimos. Lo que queda es el margen disponible para ahorro, ocio y pagos adicionales. No uses una cifra optimista: trabaja con dinero que realmente suele quedar disponible.</p>
              <p>Si tu margen es muy pequeño, el primer objetivo puede ser dejar de aumentar la deuda y estabilizar el mes. Reducir una suscripción o ajustar una categoría variable puede liberar un monto pequeño pero recurrente.</p>
            </section>

            <GuideAdSlot position="mid" />

            <section id="prioridad">
              <h2>3. Decide cómo priorizar las deudas</h2>
              <p>Existen dos enfoques comunes. El primero prioriza la deuda con mayor costo financiero; suele reducir intereses totales. El segundo prioriza el saldo más pequeño; puede darte avances visibles más rápido. Ambos requieren mantener al día los pagos mínimos del resto.</p>
              <p>Si existe una deuda atrasada, con riesgo legal, corte de un servicio esencial o consecuencias importantes, esa situación puede necesitar prioridad antes que cualquier método estándar.</p>
            </section>

            <section id="plan">
              <h2>4. Convierte la prioridad en un monto mensual concreto</h2>
              <p>Define una cantidad adicional fija para la deuda prioritaria y trátala como parte del presupuesto. Cuando termines esa deuda, mueve ese mismo monto a la siguiente en lugar de absorberlo inmediatamente en nuevos gastos.</p>
              <p>Por ejemplo, si pagabas S/ 180 de cuota más S/ 100 adicionales y terminas esa obligación, los S/ 280 pueden pasar a la siguiente deuda. Así aumenta la capacidad de pago sin exigir más ingreso.</p>
              <p>Si tus ingresos cambian cada mes, trabaja con una base conservadora y utiliza ingresos extraordinarios solo cuando realmente hayan ingresado.</p>
            </section>

            <section id="errores">
              <h2>5. Evita que el plan te obligue a endeudarte otra vez</h2>
              <p>Pagar deuda con todo tu efectivo y luego financiar comida o transporte con tarjeta puede dejarte en el mismo punto. Mantén un pequeño colchón operativo y revisa qué situaciones te llevan a usar crédito de forma repetida.</p>
              <p>También conviene separar “deuda” de “gasto corriente”. Una compra con tarjeta no deja de ser gasto por pagarse después; debe entrar en tu presupuesto desde el momento en que la realizas.</p>
            </section>

            <section id="faq">
              <h2>6. Preguntas frecuentes</h2>
              <h3>¿Debo usar todos mis ahorros para pagar deuda?</h3>
              <p>No necesariamente. Vaciar completamente tu reserva puede dejarte sin margen ante una emergencia y empujarte a usar crédito otra vez. Evalúa costo de la deuda, liquidez mínima y estabilidad de ingresos.</p>
              <h3>¿Conviene consolidar deudas?</h3>
              <p>Puede simplificar pagos si el nuevo costo total es menor y no extiende excesivamente el plazo. Compara tasa, comisiones, seguros y costo total; no solo la cuota mensual.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>SIGUIENTE PASO</span>
              <h3>Ordena el resto de tu mes para saber cuánto puedes destinar a deuda.</h3>
              <a href="/guias/presupuesto-mensual">Ver guía de presupuesto mensual →</a>
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
