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
        <h2>2. Preferencia de publicidad</h2>
        <p>
          Cuando la integración publicitaria esté activa, SFIQ guardará localmente si el usuario aceptó o
          rechazó la carga de publicidad. Esta elección puede modificarse desde el botón de Cookies que aparece en
          el sitio cuando dicha integración está habilitada.
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
        <h2>5. Cómo retirar tu elección</h2>
        <p>
          Puedes volver a abrir las preferencias desde el control de Cookies del sitio cuando la publicidad esté
          habilitada. También puedes eliminar los datos del sitio desde la configuración de tu navegador.
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
