import PublicLegalShell from '@/components/PublicLegalShell';

export const metadata = {
  title: 'Política de cookies | SFIQ',
  description: 'Información sobre cookies, almacenamiento local y publicidad en SFIQ.',
};

export default function CookiesPage() {
  return (
    <PublicLegalShell
      kicker="LEGAL · COOKIES"
      title="Política de cookies"
      intro="Aquí explicamos qué tecnologías de almacenamiento puede usar SFIQ y cómo puedes controlar la publicidad."
    >
      <article>
        <h2>1. Cookies y almacenamiento esencial</h2>
        <p>
          Algunas funciones necesitan guardar información en el navegador para mantener sesión, preferencias o
          decisiones del usuario. Este almacenamiento es necesario para que determinadas partes de la aplicación
          funcionen correctamente.
        </p>
      </article>

      <article>
        <h2>2. Consentimiento para publicidad</h2>
        <p>
          SFIQ utiliza la plataforma de gestión de consentimiento de Google para mostrar, cuando corresponda,
          mensajes de privacidad y publicidad a visitantes del Espacio Económico Europeo, Reino Unido y Suiza.
          Las opciones disponibles dependen de la configuración publicada en Google AdSense y de la región del usuario.
        </p>
      </article>

      <article>
        <h2>3. Google AdSense</h2>
        <p>
          SFIQ está preparado para utilizar Google AdSense en páginas públicas como guías y calculadoras.
          Cuando esté habilitado, Google puede utilizar cookies u otras tecnologías para medir, limitar o
          personalizar anuncios de acuerdo con sus propias políticas y la elección de consentimiento del usuario.
        </p>
      </article>

      <article>
        <h2>4. Dónde no mostraremos anuncios</h2>
        <p>
          La implementación está diseñada para mantener la publicidad fuera de las principales pantallas privadas:
          dashboard, movimientos, gastos, deudas, espacio Pareja, perfil, ajustes y otras zonas que muestran
          información financiera personal.
        </p>
      </article>

      <article>
        <h2>5. Cómo gestionar tu elección</h2>
        <p>
          Cuando Google muestre un mensaje de consentimiento, podrás usar las opciones incluidas en ese mensaje
          para aceptar, rechazar o administrar tus preferencias. También puedes eliminar cookies y datos del sitio
          desde la configuración de tu navegador.
        </p>
      </article>

      <article>
        <h2>6. Cambios</h2>
        <p>
          Esta política puede ajustarse cuando incorporemos nuevos proveedores, tipos de almacenamiento o
          funcionalidades. La versión vigente será la publicada en esta página.
        </p>
      </article>
    </PublicLegalShell>
  );
}
