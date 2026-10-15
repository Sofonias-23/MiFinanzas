import type { Metadata } from 'next';
import GuideAdSlot from '@/components/GuideAdSlot';
import GuideTrustBlock from '@/components/GuideTrustBlock';

const description =
  'Método práctico para descubrir en qué se va tu dinero cada mes usando categorías, frecuencia, comercios y comparación entre meses.';

export const metadata: Metadata = {
  title: 'Cómo detectar en qué se va tu dinero cada mes',
  description,
  alternates: { canonical: '/guias/detectar-en-que-se-va-tu-dinero' },
  openGraph: {
    type: 'article',
    url: 'https://sfiq.app/guias/detectar-en-que-se-va-tu-dinero',
    title: 'Cómo detectar en qué se va tu dinero | SFIQ',
    description,
    siteName: 'SFIQ',
    locale: 'es_PE',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cómo detectar en qué se va tu dinero cada mes',
  description,
  mainEntityOfPage: 'https://sfiq.app/guias/detectar-en-que-se-va-tu-dinero',
  url: 'https://sfiq.app/guias/detectar-en-que-se-va-tu-dinero',
  inLanguage: 'es',
  datePublished: '2026-10-15',
  dateModified: '2026-10-15',
  author: { '@type': 'Organization', name: 'Equipo editorial de SFIQ', url: 'https://sfiq.app/politica-editorial' },
  publisher: { '@type': 'Organization', name: 'SFIQ', url: 'https://sfiq.app/' },
};

export default function DetectarGastoPage() {
  return (
    <main className="articlePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleHeader />
      <article className="articleWrap">
        <header className="articleHero">
          <p className="eyebrow">ANÁLISIS · HÁBITOS</p>
          <h1>Si el dinero “desaparece”, busca patrones, no una compra culpable.</h1>
          <p>La mayoría de los desbalances mensuales se explican mejor con categorías repetidas, frecuencia y hábitos que con una sola compra grande.</p>
        </header>

        <GuideTrustBlock />

        <div className="articleBody">
          <aside>
            <span>EN ESTA GUÍA</span>
            <a href="#periodo">1. Elige un periodo</a>
            <a href="#categorias">2. Agrupa categorías</a>
            <a href="#frecuencia">3. Mira frecuencia</a>
            <a href="#comercios">4. Revisa comercios</a>
            <a href="#comparar">5. Compara meses</a>
            <a href="#accion">6. Elige una acción</a>
          </aside>

          <div>
            <section id="periodo">
              <h2>1. Analiza al menos un mes completo</h2>
              <p>Mirar tres o cuatro días puede exagerar eventos puntuales. Un mes completo permite ver alquiler, servicios, fines de semana, compras recurrentes y cambios de ritmo.</p>
              <p>Si tienes datos de dos o tres meses, mejor todavía: podrás separar un gasto excepcional de un patrón persistente.</p>
            </section>

            <section id="categorias">
              <h2>2. Agrupa primero, investiga después</h2>
              <p>Ordena los gastos en categorías suficientemente amplias: vivienda, comida, transporte, compras, ocio, salud, servicios y otros. Identifica cuáles concentran más dinero antes de abrir cada transacción.</p>
              <div className="articleCallout"><b>Ejemplo</b><p>Si “Comida” representa S/ 900, recién después conviene separar supermercado, delivery, restaurantes y snacks para saber qué explica el total.</p></div>
            </section>

            <GuideAdSlot position="mid" />

            <section id="frecuencia">
              <h2>3. Busca gastos pequeños que se repiten muchas veces</h2>
              <p>Un gasto de S/ 8 parece irrelevante hasta que ocurre veinte veces. Cuenta frecuencia además de monto total. Las compras repetitivas suelen ser más fáciles de ajustar que un gasto fijo grande.</p>
              <p>La guía de <a href="/guias/gastos-hormiga">gastos hormiga</a> puede ayudarte a evaluar este tipo de patrón sin intentar eliminar todo lo que disfrutas.</p>
            </section>

            <section id="comercios">
              <h2>4. Observa también dónde gastas</h2>
              <p>Dos personas pueden tener la misma categoría “Comida”, pero patrones diferentes. Una puede concentrar el gasto en supermercado y otra en delivery. Registrar el comercio permite entender mejor el comportamiento.</p>
              <p>Si un mismo comercio aparece con mucha frecuencia, pregúntate qué necesidad cubre y si existe una alternativa más económica o planificada.</p>
            </section>

            <section id="comparar">
              <h2>5. Compara contra tu propio historial</h2>
              <p>Una categoría no es “alta” solo porque alguien más gaste menos. Compárala con tus ingresos, prioridades y meses anteriores. Un aumento de S/ 250 frente a tu promedio puede ser más relevante que una cifra absoluta grande pero estable.</p>
              <p>Busca cambios: más taxis, más salidas, una suscripción nueva o una compra extraordinaria. Explicar la diferencia es más útil que juzgar el total.</p>
            </section>

            <section id="accion">
              <h2>6. Elige una sola corrección para el próximo mes</h2>
              <p>No necesitas recortar todas las categorías a la vez. Elige la que tenga mayor impacto y una acción medible: reducir delivery de cuatro a dos veces por semana, fijar un límite de taxis o cancelar una suscripción que no usas.</p>
              <p>Al final del siguiente mes compara si esa acción cambió realmente el resultado. Si no, ajusta el método en lugar de abandonar el seguimiento.</p>
            </section>

            <GuideAdSlot position="end" />
            <div className="articleNext">
              <span>SIGUIENTE PASO</span>
              <h3>Convierte el patrón que encontraste en un límite mensual.</h3>
              <a href="/guias/controlar-gastos-variables">Ver cómo controlar gastos variables →</a>
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
