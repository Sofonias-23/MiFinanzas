import PublicLegalShell from '@/components/PublicLegalShell';

export const metadata = {
  title: 'Términos de uso | MiFinanzas',
  description: 'Condiciones generales para utilizar MiFinanzas.',
};

export default function TerminosPage() {
  return (
    <PublicLegalShell
      kicker="LEGAL · TÉRMINOS"
      title="Términos de uso"
      intro="Estas condiciones regulan el uso de la web, las herramientas públicas y las funciones privadas de MiFinanzas."
    >
      <article>
        <h2>1. Uso del servicio</h2>
        <p>
          MiFinanzas permite registrar y organizar información financiera personal y compartida, consultar
          estadísticas, utilizar calculadoras y acceder a contenidos educativos. El usuario debe utilizar el
          servicio de manera lícita y proporcionar información sobre la que tenga derecho de uso.
        </p>
      </article>

      <article>
        <h2>2. Cuenta y credenciales</h2>
        <p>
          El usuario es responsable de mantener seguras sus credenciales y de las acciones realizadas desde su
          cuenta. Si detecta un acceso no autorizado, debe cambiar sus credenciales y tomar las medidas de seguridad
          disponibles.
        </p>
      </article>

      <article>
        <h2>3. Información financiera</h2>
        <p>
          MiFinanzas es una herramienta de organización y educación financiera. Los cálculos, estadísticas,
          presupuestos y contenidos no constituyen asesoría financiera, contable, tributaria, legal o de inversión.
          Las decisiones finales corresponden al usuario.
        </p>
      </article>

      <article>
        <h2>4. Funciones compartidas</h2>
        <p>
          En el espacio Pareja, determinados registros pueden ser visibles para las personas vinculadas. Cada
          usuario es responsable de registrar información correcta y de respetar los acuerdos que tenga con la otra
          persona.
        </p>
      </article>

      <article>
        <h2>5. Disponibilidad</h2>
        <p>
          Podemos realizar mantenimiento, correcciones o cambios de funcionalidad. Aunque buscamos mantener el
          servicio disponible, no garantizamos funcionamiento ininterrumpido ni ausencia total de errores.
        </p>
      </article>

      <article>
        <h2>6. Contenido y publicidad</h2>
        <p>
          Las páginas públicas pueden incluir contenidos educativos y, cuando se habilite, espacios publicitarios.
          La presencia de un anuncio no implica que MiFinanzas recomiende o garantice el producto o servicio
          anunciado.
        </p>
      </article>

      <article>
        <h2>7. Modificaciones</h2>
        <p>
          Estos términos pueden actualizarse para reflejar cambios del producto o del marco aplicable. La versión
          vigente será la publicada en esta página junto con su fecha de actualización.
        </p>
      </article>
    </PublicLegalShell>
  );
}
