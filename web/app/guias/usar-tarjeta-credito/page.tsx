import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';
import GuideTrustBlock from '@/components/GuideTrustBlock';

const description =
  'Cómo usar una tarjeta de crédito sin confundir línea disponible con dinero propio: fecha de cierre, pago total, cuotas y control del gasto mensual.';

export const metadata: Metadata = {
  title: 'Cómo usar una tarjeta de crédito sin perder el control',
  description,
  alternates: { canonical: '/guias/usar-tarjeta-credito' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/usar-tarjeta-credito',
    title: 'Cómo usar una tarjeta de crédito sin perder el control | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo usar una tarjeta de crédito sin perder el control',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/usar-tarjeta-credito',
  url: 'https://sfiq.app/guias/usar-tarjeta-credito',
  inLanguage: 'es',
  datePublished: '2026-10-15',
  dateModified: '2026-10-15',
  author: { '@type': 'Organization', name: 'Equipo editorial de SFIQ', url: 'https://sfiq.app/politica-editorial' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function TarjetaCreditoPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">CRÉDITO · CONTROL</p>
          <h1>La línea de crédito no es dinero disponible para gastar.</h1>
          <p>Una tarjeta puede ser útil para pagos y organización, pero cada compra debe entrar en tu presupuesto desde el día en que la haces, aunque el banco la cobre después.</p>
        </header>

        <GuideTrustBlock />

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#presupuesto">1. Registra la compra</a>
            <a href="#fechas">2. Entiende las fechas</a>
            <a href="#pago">3. Diferencia pagos</a>
            <a href="#cuotas">4. Evalúa cuotas</a>
            <a href="#limite">5. Usa un límite propio</a>
            <a href="#faq">6. Preguntas frecuentes</a>
          </aside>

          <div>
            <section id="presupuesto">
              <h2>1. Registra el gasto cuando compras, no cuando pagas la tarjeta</h2>
              <p>Si compras S/ 250 hoy con tarjeta, tu presupuesto debería reflejar S/ 250 hoy. Cuando pagues el estado de cuenta, estás cancelando una obligación que ya registraste; no creando un gasto nuevo.</p>
              <p>Este criterio evita contar dos veces una compra o pensar que todavía tienes dinero libre porque el cargo bancario llegará el siguiente mes.</p>
            </section>

            <section id="fechas">
              <h2>2. Distingue fecha de cierre y fecha de pago</h2>
              <p>La fecha de cierre determina qué consumos entran en un estado de cuenta. La fecha de pago es el límite para cumplir con ese estado de cuenta. Ambas dependen de tu emisor y deben revisarse directamente en tu contrato o aplicación bancaria.</p>
              <div className="articleCallout"><b>Importante</b><p>No bases una compra en “recién la pagaré el próximo mes”. Pregúntate si ya puedes reservar hoy el dinero que necesitarás para pagarla.</p></div>
            </section>

            <GuideAdSlot position="mid" />

            <section id="pago">
              <h2>3. Pago mínimo y pago total no significan lo mismo</h2>
              <p>El pago mínimo mantiene la cuenta dentro de las condiciones definidas por el emisor, pero normalmente deja saldo financiado y puede generar intereses. El pago total del estado de cuenta evita financiar ese saldo, salvo condiciones particulares de tu producto.</p>
              <p>Revisa siempre la información de tu banco para conocer tasas, seguros, comisiones y reglas específicas. No asumas que todas las tarjetas funcionan igual.</p>
            </section>

            <section id="cuotas">
              <h2>4. Mira el costo total de una compra en cuotas</h2>
              <p>Una cuota pequeña puede parecer manejable, pero varias cuotas simultáneas reducen tu margen de meses futuros. Antes de aceptar, calcula cuánto de tu ingreso mensual ya está comprometido.</p>
              <p>Cuando existan intereses o comisiones, compara el precio final financiado con el precio al contado. Si una promoción ofrece cuotas sin intereses, verifica sus condiciones y mantén igualmente el monto dentro de tu presupuesto.</p>
            </section>

            <section id="limite">
              <h2>5. Define un límite personal menor que la línea bancaria</h2>
              <p>El banco puede darte una línea mayor a lo que puedes pagar cómodamente. Tu límite real debería estar definido por tu presupuesto, no por el máximo autorizado.</p>
              <p>Una referencia útil es saber cuánto podrías pagar al cierre sin sacrificar gastos esenciales ni usar otra deuda. Ese monto puede ser muy inferior a tu línea disponible.</p>
            </section>

            <section id="faq">
              <h2>6. Preguntas frecuentes</h2>
              <h3>¿Conviene comprar todo con tarjeta para acumular beneficios?</h3>
              <p>Solo si puedes mantener el mismo control que tendrías pagando con débito o efectivo y entiendes las condiciones del programa. Una recompensa pequeña no compensa intereses por financiar saldo.</p>
              <h3>¿Debo cancelar una tarjeta que no uso?</h3>
              <p>Depende de costos, antigüedad, historial y tus necesidades. Revisa condiciones del emisor y efectos relevantes para tu situación antes de cerrar un producto.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>SI YA HAY SALDO PENDIENTE</span>
              <h3>Convierte tus deudas en un plan de pagos mensual.</h3>
              <a href="/guias/salir-de-deudas">Ver guía para ordenar deudas →</a>
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
