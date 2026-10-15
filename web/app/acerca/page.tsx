import type { Metadata } from 'next';
import PublicLegalShell from '@/components/PublicLegalShell';

export const metadata: Metadata = {
  title: 'Acerca de SFIQ',
  description:
    'Conoce qué es SFIQ, para quién está creado y cómo aborda la organización de finanzas personales y gastos en pareja.',
  alternates: { canonical: '/acerca' },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SFIQ',
  url: 'https://sfiq.app/',
  description:
    'Proyecto independiente de organización de finanzas personales y gastos compartidos.',
};

export default function AcercaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <PublicLegalShell
        kicker="SFIQ · ACERCA"
        title="Finanzas cotidianas, con menos fricción."
        intro="SFIQ es un proyecto independiente creado para ayudar a personas y parejas a registrar, entender y conversar mejor sobre su dinero."
      >
        <article>
          <h2>Qué es SFIQ</h2>
          <p>
            SFIQ reúne en un mismo espacio ingresos, gastos, presupuestos, categorías, métodos de pago,
            estadísticas y gastos compartidos. El objetivo es convertir movimientos cotidianos en información
            clara sin obligarte a mantener hojas de cálculo complejas.
          </p>
        </article>

        <article>
          <h2>Por qué existe</h2>
          <p>
            Muchas decisiones financieras no requieren modelos complicados: requieren saber cuánto entró,
            cuánto salió, qué parte corresponde a cada persona y cómo cambió el mes. SFIQ se diseña alrededor
            de esas preguntas concretas.
          </p>
        </article>

        <article>
          <h2>Personal y Pareja son espacios distintos</h2>
          <p>
            Los movimientos personales se mantienen separados del espacio compartido. En Pareja solo se
            reflejan los registros que se crean expresamente como compartidos, junto con su división, quién
            pagó y el balance entre ambas personas.
          </p>
        </article>

        <article>
          <h2>Herramientas y contenido público</h2>
          <p>
            Además de la aplicación, SFIQ publica calculadoras y guías sobre presupuesto, ahorro, control de
            gastos y organización del dinero en pareja. Estos contenidos son educativos y se preparan bajo
            nuestra <a href="/politica-editorial">política editorial</a>.
          </p>
        </article>

        <article>
          <h2>Independencia y publicidad</h2>
          <p>
            SFIQ no es un banco, una financiera ni una plataforma de inversión. Algunas páginas públicas
            pueden mostrar publicidad para ayudar a sostener el proyecto. La publicidad se mantiene separada
            de las principales pantallas privadas que contienen información financiera personal.
          </p>
        </article>

        <article>
          <h2>Contacto y correcciones</h2>
          <p>
            Si detectas un error, tienes una consulta sobre privacidad o quieres proponer una corrección de
            contenido, utiliza nuestra <a href="/contacto">página de contacto</a>. Preferimos corregir una
            explicación antes que mantener una afirmación ambigua o desactualizada.
          </p>
        </article>
      </PublicLegalShell>
    </>
  );
}
