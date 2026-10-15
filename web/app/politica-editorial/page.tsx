import type { Metadata } from 'next';
import PublicLegalShell from '@/components/PublicLegalShell';

export const metadata: Metadata = {
  title: 'Política editorial',
  description:
    'Cómo SFIQ prepara, revisa, actualiza y corrige sus guías y contenidos de educación financiera.',
  alternates: { canonical: '/politica-editorial' },
};

export default function PoliticaEditorialPage() {
  return (
    <PublicLegalShell
      kicker="SFIQ · EDITORIAL"
      title="Política editorial"
      intro="Esta política explica cómo elaboramos, revisamos y corregimos el contenido educativo publicado por SFIQ."
    >
      <article>
        <h2>1. Propósito del contenido</h2>
        <p>
          Las guías de SFIQ buscan ayudar a comprender decisiones financieras cotidianas: organizar un
          presupuesto, revisar gastos, definir metas de ahorro o repartir gastos compartidos. Priorizamos
          explicaciones prácticas, ejemplos claros y límites explícitos sobre lo que una guía puede resolver.
        </p>
      </article>

      <article>
        <h2>2. Contenido educativo, no asesoría personalizada</h2>
        <p>
          El contenido de SFIQ es informativo y educativo. No constituye asesoría financiera, contable,
          tributaria, legal ni de inversión. Una recomendación general puede no ser adecuada para la situación,
          obligaciones o tolerancia al riesgo de una persona concreta.
        </p>
      </article>

      <article>
        <h2>3. Cómo preparamos una guía</h2>
        <p>
          Partimos de una pregunta concreta del usuario, delimitamos conceptos, revisamos cálculos y ejemplos,
          eliminamos afirmaciones que no podamos sostener y conectamos la explicación con herramientas útiles
          del sitio. Cuando una cifra depende del contexto, evitamos presentarla como una regla universal.
        </p>
      </article>

      <article>
        <h2>4. Fuentes y actualidad</h2>
        <p>
          Para temas que dependen de normas, tasas, productos, instituciones o información cambiante, buscamos
          fuentes oficiales o primarias y revisamos la fecha de la información. En temas conceptuales evitamos
          añadir referencias decorativas que no aporten al lector.
        </p>
      </article>

      <article>
        <h2>5. Herramientas automáticas e IA</h2>
        <p>
          Podemos utilizar herramientas automáticas o inteligencia artificial para apoyar tareas de estructura,
          edición, síntesis o detección de inconsistencias. El contenido no se publica por el solo hecho de haber
          sido generado automáticamente: se revisa su coherencia, utilidad, cálculos y adecuación al propósito de
          SFIQ antes de publicarlo.
        </p>
      </article>

      <article>
        <h2>6. Actualizaciones y correcciones</h2>
        <p>
          Las guías muestran información de publicación o actualización. Si encontramos un error material,
          corregimos el contenido y actualizamos su fecha cuando el cambio modifica de forma relevante la
          explicación. Puedes reportar errores desde la <a href="/contacto">página de contacto</a>.
        </p>
      </article>

      <article>
        <h2>7. Publicidad e independencia editorial</h2>
        <p>
          La presencia de publicidad no determina las conclusiones de una guía. Los anuncios se presentan
          separados del contenido editorial y no implican que SFIQ recomiende, garantice o haya evaluado el
          producto o servicio anunciado.
        </p>
      </article>

      <article>
        <h2>8. Autoría</h2>
        <p>
          Las guías se publican bajo la firma “Equipo editorial de SFIQ”. Esta firma identifica el proceso
          editorial del proyecto y no pretende presentar a SFIQ como una entidad regulada ni atribuir
          credenciales profesionales que no se indiquen expresamente.
        </p>
      </article>
    </PublicLegalShell>
  );
}
