import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';
import GuideTrustBlock from '@/components/GuideTrustBlock';

const description =
  'Aprende a crear un fondo de emergencia por etapas, separar tu reserva del gasto cotidiano y definir una meta sostenible.';

export const metadata: Metadata = {
  title: 'Fondo de emergencia: cómo empezar y cuánto ahorrar',
  description,
  alternates: {
    canonical: '/guias/fondo-emergencia',
  },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/fondo-emergencia',
    title: 'Fondo de emergencia: cómo empezar y cuánto ahorrar | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fondo de emergencia: cómo empezar y cuánto ahorrar | SFIQ',
    description,
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo construir un fondo de emergencia sin descuidar tu mes actual.',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/fondo-emergencia',
  url: 'https://sfiq.app/guias/fondo-emergencia',
  inLanguage: 'es',
  datePublished: '2026-10-01',
  dateModified: '2026-10-15',
  author: {
    '@type': 'Organization',
    name: 'Equipo editorial de SFIQ',
    url: 'https://sfiq.app/politica-editorial',
  },
  publisher: {
    '@type': 'Organization',
    name: 'SFIQ',
    url: 'https://sfiq.app/',
  },
};

export default function FondoEmergenciaPage() {
  return (
    <main className="articlePage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">AHORRO · GUÍA PRÁCTICA</p>
          <h1>Cómo construir un fondo de emergencia sin descuidar tu mes actual.</h1>
          <p>La meta no es ahorrar una cifra enorme de inmediato. Es crear una reserva separada del dinero que usas todos los meses.</p>
        </header>

        <GuideTrustBlock />

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#objetivo">1. Define el objetivo</a>
            <a href="#etapas">2. Trabaja por etapas</a>
            <a href="#separado">3. Mantenlo separado</a>
            <a href="#reponer">4. Repón después de usarlo</a>
          </aside>

          <div>
            <section id="objetivo">
              <h2>1. Define para qué existe ese dinero</h2>
              <p>Un fondo de emergencia sirve para absorber gastos imprevistos importantes sin depender de crédito o desordenar por completo tu presupuesto del mes.</p>
              <p>Ejemplos típicos pueden ser una reparación urgente, un gasto de salud no previsto o un periodo temporal sin ingresos. Una compra planificada o unas vacaciones pertenecen a otra meta de ahorro.</p>
              <div className="articleCallout"><b>Idea clave</b><p>No mezcles “ahorro para vacaciones” con “dinero para una emergencia”. Son objetivos distintos.</p></div>
            </section>

            <section id="etapas">
              <h2>2. Divide la meta en etapas</h2>
              <p>En lugar de pensar solo en una meta final, empieza con una primera reserva pequeña y concreta. Después aumenta el objetivo progresivamente según tus gastos esenciales y estabilidad de ingresos.</p>
              <p>Ese enfoque reduce la fricción inicial y permite ajustar la meta con información real de tus gastos mensuales.</p>
              <p>Una forma práctica es crear primero una reserva inicial y, una vez alcanzada, ampliar progresivamente la cobertura según tus gastos esenciales. La cifra final depende de tu contexto y de la estabilidad de tus ingresos.</p>
            </section>
            <GuideAdSlot position="mid" />

            <section id="separado">
              <h2>3. Mantenlo fuera del gasto cotidiano</h2>
              <p>Si el dinero está mezclado con el saldo que utilizas para compras diarias, es más fácil consumirlo sin darte cuenta. Una separación clara ayuda a tratarlo como reserva, no como saldo disponible.</p>
              <p>La separación puede ser física o simplemente contable, pero debe permitirte saber cuánto corresponde a emergencias sin confundirlo con el presupuesto habitual.</p>
            </section>

            <section id="reponer">
              <h2>4. Si lo usas, vuelve a construirlo</h2>
              <p>Usar el fondo para una emergencia real no significa que el plan falló. Significa que cumplió su función. Después del evento, incorpora su reposición como una nueva meta del presupuesto.</p>
              <p>Si necesitas reconstruirlo, puedes reducir temporalmente otros objetivos y volver a aportar de forma gradual. La prioridad es recuperar una reserva que vuelva a darte margen ante el siguiente imprevisto.</p>
            </section>


            <section id="revision">
              <h2>5. Revisa la meta cuando cambie tu realidad</h2>
              <p>El fondo no necesita quedarse en la misma cifra para siempre. Si cambian tus gastos esenciales, personas a cargo o estabilidad laboral, vuelve a calcular qué nivel de reserva te daría margen suficiente.</p>
              <p>Evita usarlo para gastos previsibles como regalos, vacaciones o renovaciones anuales. Para esos objetivos conviene crear ahorros separados.</p>
              <h3>¿Dónde debería guardar el fondo?</h3>
              <p>Prioriza disponibilidad y bajo riesgo. La decisión concreta depende del producto financiero que utilices y de sus condiciones; revisa costos, acceso y protección aplicable antes de elegir.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>SIGUIENTE PASO</span>
              <h3>Calcula cuánto margen tienes cada mes antes de fijar tu aporte.</h3>
              <a href="/calculadoras#presupuesto">Abrir calculadora de presupuesto →</a>
            </div>
          </div>
        </div>
      </article>
      <ArticleFooter />
    </main>
  );
}

function ArticleHeader() {
  return <header className="articleTop"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><a href="/guias">← Guías</a></header>;
}
function ArticleFooter() {
  return <footer className="publicFooter"><a className="brand" href="/"><span className="brandMark"><span className="brandDollar">$</span></span><span>SFIQ</span></a><div><a href="/guias">Guías</a><a href="/calculadoras">Calculadoras</a><a href="/acerca">Acerca</a><a href="/contacto">Contacto</a><a href="/politica-editorial">Política editorial</a></div><span>© 2026 SFIQ</span></footer>;
}