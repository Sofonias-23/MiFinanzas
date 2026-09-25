'use client';

import { useEffect } from 'react';

const scenes = [
  {
    number: '01',
    kicker: 'ORDEN PERSONAL',
    title: 'Tu dinero deja de sentirse disperso.',
    copy: 'Gastos, ingresos, presupuestos y hábitos en una sola vista. Lo importante aparece primero.',
    accent: 'blue',
  },
  {
    number: '02',
    kicker: 'ESPACIO PRIVADO',
    title: 'Lo personal sigue siendo solo tuyo.',
    copy: 'Tus movimientos personales no se mezclan con el espacio compartido. Tú decides qué pertenece a Pareja.',
    accent: 'violet',
  },
  {
    number: '03',
    kicker: 'EN PAREJA',
    title: 'Dos personas. Un balance claro.',
    copy: 'Registra quién pagó, divide 50/50 o con porcentajes personalizados y mantén el saldo actualizado.',
    accent: 'pink',
  },
  {
    number: '04',
    kicker: 'DECISIONES',
    title: 'Mira el patrón, no solo el gasto.',
    copy: 'Presupuestos y estadísticas convierten tus movimientos del día a día en una lectura simple del mes.',
    accent: 'cyan',
  },
];

export default function HomePage() {
  useEffect(() => {
    const root = document.documentElement;

    const updateScroll = () => {
      root.style.setProperty('--home-scroll', String(window.scrollY));
    };

    const updatePointer = (event: PointerEvent) => {
      const x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
      const y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;

      root.style.setProperty('--home-pointer-x', x.toFixed(4));
      root.style.setProperty('--home-pointer-y', y.toFixed(4));
      root.style.setProperty('--home-parallax-x', (x * 24).toFixed(2) + 'px');
      root.style.setProperty('--home-parallax-y', (y * 18).toFixed(2) + 'px');
      root.style.setProperty('--home-parallax-x-reverse', (x * -15).toFixed(2) + 'px');
      root.style.setProperty('--home-parallax-y-reverse', (y * -12).toFixed(2) + 'px');
    };

    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.publicStoryScene, .toolkitCards > a, .guideEditorialFeature, .guideEditorialSide > a',
      ),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-visible');
          }
        });
      },
      { threshold: 0.18 },
    );

    revealTargets.forEach((target) => observer.observe(target));

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', updatePointer, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', updatePointer);
      observer.disconnect();
    };
  }, []);

  return (
    <main className="publicHome">
      <header className="topbar publicTopbar">
        <a className="brand" href="#inicio" aria-label="MiFinanzas">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <nav className="navLinks" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#historia">Funciones</a>
          <a href="/calculadoras">Calculadoras</a>
          <a href="/guias">Guías</a>
        </nav>

        <div className="navActions">
          <a className="textButton" href="/login">Entrar</a>
          <a className="primaryButton small" href="/login">Empezar</a>
        </div>
      </header>

      <section id="inicio" className="cinemaHero">
        <div className="cinemaSky cinemaSkyOne" />
        <div className="cinemaSky cinemaSkyTwo" />
        <div className="cinemaGrid" />

        <div className="cinemaCopy">
          <p className="eyebrow">MI FINANZAS · PERSONAL + PAREJA</p>
          <h1>
            Ordena tu dinero.
            <span>Ve lo que antes se perdía.</span>
          </h1>
          <p>
            Una experiencia financiera simple para registrar, dividir, entender y decidir sin convertir tu día a día en una hoja de cálculo.
          </p>

          <div className="cinemaActions">
            <a className="primaryButton" href="/login">Entrar a MiFinanzas →</a>
            <a className="ghostButton" href="#historia">Explorar</a>
          </div>

          <div className="cinemaFacts">
            <span>Privado</span>
            <i />
            <span>Compartido cuando tú decides</span>
            <i />
            <span>Sin enredos</span>
          </div>
        </div>

        <div className="cinemaWorld" aria-hidden="true">
          <div className="cinemaPlanet">
            <div className="planetGlow" />
            <div className="planetSurface" />
          </div>

          <div className="cinemaOrbit orbitOne">
            <span>S/ 480</span>
          </div>
          <div className="cinemaOrbit orbitTwo">
            <span>50 / 50</span>
          </div>

          <div className="cinemaGlass glassOne">
            <small>Saldo del mes</small>
            <strong>S/ 1,240</strong>
            <div><span>Ingresos</span><b>+ 2,800</b></div>
            <div><span>Gastos</span><b>- 1,560</b></div>
          </div>

          <div className="cinemaGlass glassTwo">
            <small>Pareja</small>
            <strong>Todo al día</strong>
            <span>Balance S/ 0.00</span>
          </div>
        </div>

        <a className="cinemaScroll" href="#historia">
          <span>SCROLL</span>
          <i />
        </a>
      </section>

      <section id="historia" className="publicStory">
        {scenes.map((scene, index) => (
          <article className={'publicStoryScene story-' + scene.accent} key={scene.number}>
            <div className="publicStoryVisual">
              <div className="storyHalo" />
              <div className="storyObject">
                <span>{scene.number}</span>
                {index === 0 ? (
                  <div className="storyLedger">
                    <i /><i /><i /><i />
                  </div>
                ) : null}
                {index === 1 ? <div className="storyLock">⌁</div> : null}
                {index === 2 ? (
                  <div className="storyPair">
                    <i />
                    <b>+</b>
                    <i />
                  </div>
                ) : null}
                {index === 3 ? (
                  <div className="storyBars">
                    <i /><i /><i /><i /><i />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="publicStoryCopy">
              <span className="slideNumber">{scene.number} — 04</span>
              <p className="eyebrow">{scene.kicker}</p>
              <h2>{scene.title}</h2>
              <p>{scene.copy}</p>

              {index === 2 ? (
                <a href="/calculadoras" className="inlineLink">Probar calculadora de pareja →</a>
              ) : (
                <a href="/login" className="inlineLink">Entrar a la app →</a>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="publicToolkit">
        <div className="toolkitIntro">
          <p className="eyebrow">ANTES DE REGISTRARTE</p>
          <h2>Herramientas que puedes usar ahora mismo.</h2>
          <p>Calcula, compara y entiende tus números sin iniciar sesión.</p>
        </div>

        <div className="toolkitCards">
          <a href="/calculadoras#presupuesto">
            <span>01</span>
            <small>PRESUPUESTO</small>
            <h3>¿Cuánto te queda al mes?</h3>
            <p>Ingresos menos gastos fijos y variables.</p>
            <b>Calcular →</b>
          </a>

          <a href="/calculadoras#503020">
            <span>02</span>
            <small>PLANIFICACIÓN</small>
            <h3>Regla 50/30/20</h3>
            <p>Distribuye un ingreso mensual en tres bloques.</p>
            <b>Calcular →</b>
          </a>

          <a href="/calculadoras#pareja">
            <span>03</span>
            <small>PAREJA</small>
            <h3>Dividir un gasto</h3>
            <p>50/50 o por porcentaje entre dos personas.</p>
            <b>Calcular →</b>
          </a>
        </div>
      </section>

      <section className="publicGuidesPreview">
        <div className="guidesPreviewHead">
          <div>
            <p className="eyebrow">GUÍAS</p>
            <h2>Menos teoría. Más decisiones útiles.</h2>
          </div>
          <a href="/guias">Ver todas →</a>
        </div>

        <div className="guideEditorialGrid">
          <a className="guideEditorialFeature" href="/guias/fondo-emergencia">
            <small>AHORRO · GUÍA</small>
            <h3>Cómo construir un fondo de emergencia sin descuidar el mes actual.</h3>
            <p>Una forma práctica de definir una meta, separarla por etapas y mantenerla fuera del gasto cotidiano.</p>
            <span>Leer guía →</span>
          </a>

          <div className="guideEditorialSide">
            <a href="/guias/gastos-pareja">
              <small>PAREJA</small>
              <h3>Cómo dividir gastos sin convertir todo en 50/50.</h3>
              <span>Leer →</span>
            </a>
            <a href="/guias/regla-50-30-20">
              <small>PRESUPUESTO</small>
              <h3>Regla 50/30/20: cómo usarla como referencia, no como obligación.</h3>
              <span>Leer →</span>
            </a>
          </div>
        </div>
      </section>

      <section className="publicFinalCta">
        <div>
          <p className="eyebrow">TU SIGUIENTE MES</p>
          <h2>Más visible. Más ordenado. Más fácil de conversar.</h2>
        </div>
        <a className="primaryButton" href="/login">Abrir MiFinanzas →</a>
      </section>

      <footer className="publicFooter">
        <a className="brand" href="#inicio">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>

        <div>
          <a href="/calculadoras">Calculadoras</a>
          <a href="/guias">Guías</a>
          <a href="/login">Entrar</a>
        </div>

        <span>© 2026 MiFinanzas</span>
      </footer>
    </main>
  );
}
