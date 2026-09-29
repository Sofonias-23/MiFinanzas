import type { ReactNode } from 'react';

type Props = {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export default function PublicLegalShell({ kicker, title, intro, children }: Props) {
  return (
    <main className="legalPage">
      <header className="topbar publicTopbar">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>SFIQ</span>
        </a>

        <nav className="navLinks" aria-label="Navegación legal">
          <a href="/">Inicio</a>
          <a href="/calculadoras">Calculadoras</a>
          <a href="/guias">Guías</a>
        </nav>

        <div className="navActions">
          <a className="textButton" href="/login">Entrar</a>
          <a className="primaryButton small" href="/login">Empezar</a>
        </div>
      </header>

      <section className="legalHero">
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <span>Última actualización: 29 de septiembre de 2026</span>
      </section>

      <section className="legalContent">
        {children}
      </section>

      <footer className="publicFooter legalFooter">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>SFIQ</span>
        </a>
        <div>
          <a href="/privacidad">Privacidad</a>
          <a href="/cookies">Cookies</a>
          <a href="/terminos">Términos</a>
          <a href="/login">Entrar</a>
        </div>
        <span>© 2026 SFIQ</span>
      </footer>
    </main>
  );
}
