import PublicLegalShell from '@/components/PublicLegalShell';

export const metadata = {
  title: 'Política de privacidad | MiFinanzas',
  description: 'Cómo MiFinanzas trata la información de sus usuarios.',
};

export default function PrivacidadPage() {
  return (
    <PublicLegalShell
      kicker="LEGAL · PRIVACIDAD"
      title="Política de privacidad"
      intro="Esta política explica qué información utiliza MiFinanzas, para qué se usa y qué controles tiene el usuario."
    >
      <article>
        <h2>1. Información que puede tratar MiFinanzas</h2>
        <p>
          Para prestar el servicio podemos tratar datos de cuenta como correo electrónico, nombre de perfil y
          avatar; información financiera que el usuario registra voluntariamente, como gastos, ingresos,
          presupuestos, categorías, métodos de pago, deudas y movimientos compartidos; además de datos técnicos
          necesarios para mantener la sesión y operar el sitio.
        </p>
      </article>

      <article>
        <h2>2. Finalidades</h2>
        <p>
          Utilizamos esta información para autenticar usuarios, guardar y mostrar sus registros, calcular saldos,
          presupuestos y estadísticas, habilitar funciones de pareja, conservar preferencias y mantener la
          seguridad y estabilidad de la plataforma.
        </p>
      </article>

      <article>
        <h2>3. Espacio de pareja</h2>
        <p>
          Los movimientos personales se mantienen separados de los movimientos compartidos. Cuando el usuario
          registra información en el espacio Pareja, determinados datos del gasto, división, balance, comentarios
          o reacciones pueden ser visibles para la otra persona vinculada a ese espacio.
        </p>
      </article>

      <article>
        <h2>4. Proveedores tecnológicos</h2>
        <p>
          MiFinanzas utiliza proveedores de infraestructura para prestar el servicio. Actualmente se usa Supabase
          para autenticación, base de datos y almacenamiento, y Railway para alojar la aplicación web. Estos
          proveedores pueden procesar información técnica necesaria para operar sus servicios.
        </p>
      </article>

      <article>
        <h2>5. Cookies y publicidad</h2>
        <p>
          MiFinanzas puede utilizar almacenamiento local o cookies necesarias para mantener preferencias y sesión.
          Si en el futuro se habilita Google AdSense, los componentes publicitarios solo se cargarán después de la
          elección de consentimiento implementada en el sitio. Consulta la <a href="/cookies">Política de cookies</a>.
        </p>
      </article>

      <article>
        <h2>6. Conservación y eliminación</h2>
        <p>
          La información se conserva mientras la cuenta o los registros correspondientes permanezcan activos,
          salvo que exista una obligación técnica o legal de conservar determinados datos durante un periodo
          adicional. Las funciones de la cuenta permiten modificar o eliminar distintos registros financieros.
        </p>
      </article>

      <article>
        <h2>7. Seguridad</h2>
        <p>
          Se aplican controles de autenticación y políticas de acceso a los datos. Ningún sistema es completamente
          infalible, por lo que también es responsabilidad del usuario proteger sus credenciales y evitar compartir
          el acceso a su cuenta.
        </p>
      </article>

      <article>
        <h2>8. Consultas y cambios</h2>
        <p>
          Esta política puede actualizarse cuando cambien las funciones, proveedores o requisitos aplicables. La
          fecha de actualización se mostrará al inicio de esta página. Para consultas de privacidad, utiliza el
          canal de contacto que MiFinanzas publique en el sitio.
        </p>
      </article>
    </PublicLegalShell>
  );
}
