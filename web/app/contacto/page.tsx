import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PublicLegalShell from '@/components/PublicLegalShell';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contacta a SFIQ para consultas, soporte, privacidad o correcciones de contenido.',
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage() {
  return (
    <PublicLegalShell
      kicker="SFIQ · CONTACTO"
      title="¿En qué podemos ayudarte?"
      intro="Utiliza este formulario para consultas sobre SFIQ, soporte, privacidad o correcciones de nuestras guías."
    >
      <article>
        <h2>Antes de escribir</h2>
        <p>
          Describe el problema con el mayor contexto posible, pero evita compartir contraseñas, números
          completos de tarjetas, claves bancarias u otra información de autenticación.
        </p>
      </article>

      <ContactForm />

      <article>
        <h2>Correcciones editoriales</h2>
        <p>
          Si reportas un dato o explicación que consideras incorrecta, indica la guía y la sección. Revisaremos
          el contenido siguiendo nuestra <a href="/politica-editorial">política editorial</a>.
        </p>
      </article>

      <article>
        <h2>Privacidad</h2>
        <p>
          Para consultas relacionadas con tus datos, selecciona “Privacidad y datos”. Consulta también nuestra
          <a href="/privacidad"> Política de privacidad</a> para conocer cómo SFIQ trata la información.
        </p>
      </article>
    </PublicLegalShell>
  );
}
