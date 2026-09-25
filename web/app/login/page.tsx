export default function LoginPage() {
  return (
    <main className="authPage">
      <a className="brand authBrand" href="/">
        <span className="brandMark" aria-hidden="true">
          <span className="brandDollar">$</span>
        </span>
        <span>MiFinanzas</span>
      </a>

      <section className="authCard">
        <p className="eyebrow">BIENVENIDO</p>
        <h1>Iniciar sesión</h1>
        <p className="authIntro">
          Usa la misma cuenta de MiFinanzas que utilizas en la app.
        </p>

        <form>
          <label>
            Correo
            <input type="email" placeholder="correo@ejemplo.com" />
          </label>
          <label>
            Contraseña
            <input type="password" placeholder="••••••••" />
          </label>
          <a className="primaryButton authSubmit" href="/dashboard">
            Ingresar
          </a>
        </form>

        <p className="authFoot">
          En la siguiente etapa conectaremos este formulario con Supabase Auth.
        </p>
      </section>
    </main>
  );
}
