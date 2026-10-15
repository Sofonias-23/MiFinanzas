import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';
import GuideTrustBlock from '@/components/GuideTrustBlock';

const description =
  'Cómo organizar un presupuesto cuando recibes un sueldo fijo: separa compromisos, gastos variables, ahorro y dinero disponible desde el día de pago.';

export const metadata: Metadata = {
  title: 'Cómo organizar tu presupuesto si tienes sueldo fijo',
  description,
  alternates: { canonical: '/guias/presupuesto-con-sueldo-fijo' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/presupuesto-con-sueldo-fijo',
    title: 'Presupuesto con sueldo fijo | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo organizar tu presupuesto si tienes sueldo fijo',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/presupuesto-con-sueldo-fijo',
  url: 'https://sfiq.app/guias/presupuesto-con-sueldo-fijo',
  inLanguage: 'es',
  datePublished: '2026-10-15',
  dateModified: '2026-10-15',
  author: { '@type': 'Organization', name: 'Equipo editorial de SFIQ', url: 'https://sfiq.app/politica-editorial' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function PresupuestoSueldoFijoPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">PRESUPUESTO · SUELDO FIJO</p>
          <h1>Haz que tu sueldo tenga un plan antes de empezar a gastarlo.</h1>
          <p>Cuando el ingreso llega una vez al mes, el reto no suele ser calcularlo: es evitar que el dinero disponible al inicio se confunda con dinero realmente libre.</p>
        </header>

        <GuideTrustBlock />

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#neto">1. Usa el sueldo neto</a>
            <a href="#compromisos">2. Separa compromisos</a>
            <a href="#variables">3. Reserva variables</a>
            <a href="#ahorro">4. Aparta ahorro</a>
            <a href="#disponible">5. Calcula lo libre</a>
            <a href="#faq">6. Preguntas frecuentes</a>
          </aside>

          <div>
            <section id="neto">
              <h2>1. Trabaja con el monto que realmente recibes</h2>
              <p>Tu presupuesto debe partir del ingreso neto depositado, no del sueldo bruto ni de bonos que todavía no están confirmados. Si recibes comisiones variables, puedes registrarlas cuando entren y decidir después cómo repartirlas.</p>
              <p>Esto evita comprometer gastos con dinero que puede cambiar por descuentos, ausencias, adelantos u otras variaciones de planilla.</p>
            </section>

            <section id="compromisos">
              <h2>2. Separa primero los compromisos que no puedes ignorar</h2>
              <p>Alquiler, servicios, cuotas, apoyo familiar, seguros y pagos mínimos de deuda deben identificarse antes de considerar ocio o compras. No significa que todos sean inamovibles, sino que tienen una fecha y una consecuencia si no se pagan.</p>
              <div className="articleCallout"><b>Orden útil</b><p>Ingreso neto → compromisos esenciales → gastos variables necesarios → ahorro/meta → dinero flexible.</p></div>
            </section>

            <GuideAdSlot position="mid" />

            <section id="variables">
              <h2>3. Reserva dinero para vivir el resto del mes</h2>
              <p>Después de pagar lo fijo todavía necesitas alimentación, transporte, combustible u otros gastos cotidianos. Estima un monto realista para estas categorías antes de decidir cuánto puedes gastar libremente.</p>
              <p>Si un gasto variable ocurre casi todos los meses, trátalo como parte estructural del presupuesto aunque su importe cambie.</p>
            </section>

            <section id="ahorro">
              <h2>4. Aparta el ahorro antes de que compita con todo lo demás</h2>
              <p>No hace falta fijar un porcentaje universal. Elige una cantidad compatible con tu situación y, si es posible, sepárala cerca del día de pago. Una meta pequeña y constante es más útil que una cifra alta que obligue a retirarla cada mes.</p>
              <p>Si todavía no tienes una reserva, revisa la guía de <a href="/guias/fondo-emergencia">fondo de emergencia</a>.</p>
            </section>

            <section id="disponible">
              <h2>5. Llama “disponible” solo a lo que realmente queda</h2>
              <p>El saldo de tu cuenta bancaria no siempre es dinero libre. Parte de ese saldo puede estar reservado para recibos que vencen dentro de diez días. Tu disponible real es ingreso menos todas las reservas del mes.</p>
              <p>Una práctica útil es revisar ese número cada vez que registras un gasto importante. Así una compra se compara con tu plan, no solo con el saldo bancario.</p>
            </section>

            <section id="faq">
              <h2>6. Preguntas frecuentes</h2>
              <h3>¿Qué hago si cobro quincenalmente?</h3>
              <p>Puedes mantener un presupuesto mensual y repartir pagos entre ambas fechas. Lo importante es reservar desde la primera quincena lo que vencerá antes del siguiente depósito.</p>
              <h3>¿Y si recibo un bono?</h3>
              <p>Regístralo como ingreso extraordinario cuando llegue. Decide por separado cuánto irá a deuda, ahorro, compras o gasto libre en lugar de incorporarlo automáticamente a tu estilo de vida mensual.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>PRUÉBALO</span>
              <h3>Compara tu sueldo con gastos fijos, variables y ahorro.</h3>
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
function ArticleFooter(){return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a><a href="/acerca">Acerca</a><a href="/contacto">Contacto</a><a href="/politica-editorial">Política editorial</a></div><span>© 2026 SFIQ</span></footer>}
