'use client';

import { useEffect, useState } from 'react';

const demos = [
  {
    label: 'DEMO · MI DINERO',
    title: 'Registrar un gasto y verlo reflejado al instante.',
    amount: 'S/ 86.00',
    accent: 'blue',
    steps: [
      { title: 'Monto', detail: 'S/ 86.00 · Almuerzo' },
      { title: 'Categoría y pago', detail: '🍽️ Comida · 📱 Yape' },
      { title: 'Resultado', detail: 'Saldo y estadísticas actualizados' },
    ],
  },
  {
    label: 'DEMO · PRIVACIDAD',
    title: 'Tus movimientos personales permanecen fuera de Pareja.',
    amount: 'Privado',
    accent: 'violet',
    steps: [
      { title: 'Gasto personal', detail: 'Solo visible en Mi dinero' },
      { title: 'Separación', detail: 'No aparece en el espacio Pareja' },
      { title: 'Control', detail: 'Tú decides qué compartes' },
    ],
  },
  {
    label: 'DEMO · PAREJA',
    title: 'Un gasto compartido se divide y actualiza el balance.',
    amount: 'S/ 120.00',
    accent: 'pink',
    steps: [
      { title: 'Quién pagó', detail: 'Tú pagaste S/ 120.00' },
      { title: 'División', detail: '50 / 50 · S/ 60 cada uno' },
      { title: 'Balance', detail: 'Tu pareja te debe S/ 60.00' },
    ],
  },
  {
    label: 'DEMO · ESTADÍSTICAS',
    title: 'Cada movimiento alimenta una lectura más clara del mes.',
    amount: '+12%',
    accent: 'cyan',
    steps: [
      { title: 'Movimientos', detail: 'Se agrupan por categoría' },
      { title: 'Tendencia', detail: 'Comparas gasto y presupuesto' },
      { title: 'Decisión', detail: 'Detectas dónde ajustar' },
    ],
  },
];

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

const sceneLiveData = [
  {
    label: 'MOVIMIENTO PERSONAL',
    metrics: [
      { value: '+ S/ 2,800', text: 'Sueldo', tone: 'positive' },
      { value: '- S/ 86', text: 'Almuerzo · Yape', tone: 'negative' },
      { value: '68%', text: 'Presupuesto comida', tone: 'blue' },
    ],
  },
  {
    label: 'PRIVACIDAD EN VIVO',
    metrics: [
      { value: 'Solo tú', text: 'Gasto personal', tone: 'violet' },
      { value: 'No visible', text: 'En espacio Pareja', tone: 'muted' },
      { value: '100%', text: 'Control de privacidad', tone: 'blue' },
    ],
  },
  {
    label: 'BALANCE COMPARTIDO',
    metrics: [
      { value: 'S/ 120', text: 'Cena', tone: 'pink' },
      { value: '50 / 50', text: 'S/ 60 cada uno', tone: 'violet' },
      { value: '+ S/ 60', text: 'A tu favor', tone: 'positive' },
    ],
  },
  {
    label: 'LECTURA DEL MES',
    metrics: [
      { value: 'S/ 1,314', text: 'Gasto mensual', tone: 'cyan' },
      { value: '+12%', text: 'Variación', tone: 'positive' },
      { value: '38%', text: 'Comida', tone: 'blue' },
    ],
  },
];

function KineticWords({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={'kineticLine ' + className}>
      {text.split(' ').map((word, index) => (
        <span className={'kineticWord word-' + (index % 6)} key={word + index}>
          {word}
        </span>
      ))}
    </span>
  );
}

export default function HomePage() {
  const [activeDemo, setActiveDemo] = useState<number | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [showcaseStep, setShowcaseStep] = useState(0);

  useEffect(() => {
    const root = document.documentElement;

    const updateScroll = () => {
      const y = window.scrollY;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(100, Math.max(0, (y / max) * 100));

      root.style.setProperty('--home-scroll', String(y));
      root.style.setProperty('--home-scroll-shift', (y * 0.035).toFixed(2) + 'px');
      root.style.setProperty('--home-scroll-shift-reverse', (y * -0.028).toFixed(2) + 'px');
      root.style.setProperty('--scroll-progress', progress.toFixed(2) + '%');
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
      root.style.setProperty('--type-x', (x * 34).toFixed(2) + 'px');
      root.style.setProperty('--type-y', (y * 25).toFixed(2) + 'px');
      root.style.setProperty('--type-x-reverse', (x * -28).toFixed(2) + 'px');
      root.style.setProperty('--type-y-reverse', (y * -20).toFixed(2) + 'px');
      root.style.setProperty('--cursor-x', event.clientX.toFixed(1) + 'px');
      root.style.setProperty('--cursor-y', event.clientY.toFixed(1) + 'px');
    };

    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.publicStoryScene, .toolkitCards > a, .guideEditorialFeature, .guideEditorialSide > a',
      ),
    );

    const kineticTargets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.kineticButton, .kineticSurface, .toolkitCards > a, .guideEditorialFeature, .guideEditorialSide > a, .kineticShowcaseCard',
      ),
    );

    const cleanupKinetic = kineticTargets.map((target) => {
      const move = (event: PointerEvent) => {
        const rect = target.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2);
        const y = event.clientY - (rect.top + rect.height / 2);
        target.style.setProperty('--kinetic-x', (x * 0.08).toFixed(2) + 'px');
        target.style.setProperty('--kinetic-y', (y * 0.1).toFixed(2) + 'px');
        target.style.setProperty('--kinetic-rx', (y * -0.035).toFixed(2) + 'deg');
        target.style.setProperty('--kinetic-ry', (x * 0.035).toFixed(2) + 'deg');
      };

      const leave = () => {
        target.style.setProperty('--kinetic-x', '0px');
        target.style.setProperty('--kinetic-y', '0px');
        target.style.setProperty('--kinetic-rx', '0deg');
        target.style.setProperty('--kinetic-ry', '0deg');
        target.classList.remove('kineticPress');
      };

      const down = (event: PointerEvent) => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--press-x', event.clientX - rect.left + 'px');
        target.style.setProperty('--press-y', event.clientY - rect.top + 'px');
        target.classList.remove('kineticPress');
        void target.offsetWidth;
        target.classList.add('kineticPress');
      };

      target.addEventListener('pointermove', move);
      target.addEventListener('pointerleave', leave);
      target.addEventListener('pointerdown', down);

      return () => {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerleave', leave);
        target.removeEventListener('pointerdown', down);
      };
    });

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
    window.addEventListener('resize', updateScroll, { passive: true });
    window.addEventListener('pointermove', updatePointer, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      window.removeEventListener('pointermove', updatePointer);
      observer.disconnect();
      cleanupKinetic.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    if (activeDemo === null) return;

    setDemoStep(0);
    const timer = window.setInterval(() => {
      setDemoStep((current) => (current + 1) % demos[activeDemo].steps.length);
    }, 1700);

    return () => window.clearInterval(timer);
  }, [activeDemo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setShowcaseStep((current) => (current + 1) % 4);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="publicHome">
      <div className="motionCursor" aria-hidden="true"><i /><span>MOVE</span></div>
      <div className="motionProgress" aria-hidden="true"><i /></div>
      <div className="motionGrain" aria-hidden="true" />

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
          <a className="primaryButton small kineticButton" href="/login">Empezar</a>
        </div>
      </header>

      <section id="inicio" className="cinemaHero">
        <div className="cinemaSky cinemaSkyOne" />
        <div className="cinemaSky cinemaSkyTwo" />
        <div className="cinemaGrid" />

        <div className="cinemaCopy">
          <p className="eyebrow">MI FINANZAS · PERSONAL + PAREJA</p>
          <h1 className="kineticTitle kineticHeroTitle">
            <KineticWords text="Ordena tu dinero." />
            <KineticWords className="accentLine" text="Ve lo que antes se perdía." />
          </h1>
          <p>
            Una experiencia financiera simple para registrar, dividir, entender y decidir sin convertir tu día a día en una hoja de cálculo.
          </p>

          <div className="cinemaActions">
            <a className="primaryButton kineticButton" href="/login">Entrar a MiFinanzas →</a>
            <a className="ghostButton kineticButton" href="#historia">Explorar</a>
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
            <div className="worldSpinLayer">
              <i className="worldLongitude worldLongitudeOne" />
              <i className="worldLongitude worldLongitudeTwo" />
              <i className="worldLatitude worldLatitudeOne" />
              <i className="worldLatitude worldLatitudeTwo" />
              <i className="worldEquator" />
            </div>
            <div className="planetSurface" />
            <span className="heroFinanceGlyph heroGlyphDollar">$</span>
            <span className="heroFinanceGlyph heroGlyphSol">S/</span>
            <span className="heroFinanceGlyph heroGlyphPercent">%</span>
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

      <section className="motionNarrative">
        <div className="motionNarrativeCopy">
          <p className="eyebrow">MOTION NARRATIVE</p>
          <h2 className="kineticTitle motionNarrativeTitle">
            <KineticWords text="Movimiento que cuenta la historia de tu dinero." />
          </h2>

          <div className="motionNarrativeBullets">
            <div><span>01</span><p>Los datos aparecen, cambian y se conectan sin esperar un clic.</p></div>
            <div><span>02</span><p>El cursor empuja tipografía, paneles, cifras y objetos financieros.</p></div>
            <div><span>03</span><p>El scroll transforma la lectura en una secuencia visual continua.</p></div>
          </div>
        </div>

        <div className="motionNarrativeFrame kineticSurface">
          <div className="motionFrameTop">
            <span className="livePulse" />
            <small>LIVE FINANCE STORY</small>
            <b>{showcaseStep + 1}/4</b>
          </div>

          <div className="motionFinanceStage">
            <div className="motionOrb">
              <span className="motionOrbDollar">$</span>
              <i className="motionOrbRing ringA" />
              <i className="motionOrbRing ringB" />
              <i className="motionOrbRing ringC" />
            </div>

            <div className="motionPhone">
              <div className="motionPhoneHeader"><span>$</span><b>MiFinanzas</b><i /></div>
              <div className="motionPhoneBalance">
                <small>Saldo del mes</small>
                <strong>{showcaseStep === 0 ? 'S/ 1,240' : showcaseStep === 1 ? 'S/ 1,154' : showcaseStep === 2 ? 'S/ 1,136' : 'S/ 1,196'}</strong>
                <span>{showcaseStep === 0 ? '+ S/ 2,800 ingreso' : showcaseStep === 1 ? '- S/ 86 almuerzo' : showcaseStep === 2 ? '- S/ 18 taxi' : '+ S/ 60 pareja'}</span>
              </div>
              <div className="motionPhoneChart">
                <i /><i /><i /><i /><i />
              </div>
              <div className="motionPhoneRows">
                <span><b>Comida</b><small>38%</small></span>
                <span><b>Transporte</b><small>21%</small></span>
                <span><b>Pareja</b><small>S/ 0</small></span>
              </div>
            </div>

            <span className="motionBadge badgeOne">+ S/ 240</span>
            <span className="motionBadge badgeTwo">50 / 50</span>
            <span className="motionBadge badgeThree">+12%</span>
            <span className="motionBadge badgeFour">S/ 60</span>
          </div>

          <div className="motionNarrativeCaption">
            <span>01 / EXPERIENCIA</span>
            <b>Los números también pueden contar una historia.</b>
          </div>
        </div>
      </section>

      <section className="motionTicker" aria-hidden="true">
        <div>
          <span>$ CONTROL</span><i>•</i><span>S/ PERSONAL</span><i>•</i><span>50/50 PAREJA</span><i>•</i><span>% PRESUPUESTO</span><i>•</i><span>+12% TENDENCIA</span><i>•</i>
          <span>$ CONTROL</span><i>•</i><span>S/ PERSONAL</span><i>•</i><span>50/50 PAREJA</span><i>•</i><span>% PRESUPUESTO</span><i>•</i><span>+12% TENDENCIA</span><i>•</i>
        </div>
      </section>

      <section id="historia" className="publicStory">
        {scenes.map((scene, index) => (
          <article className={'publicStoryScene story-' + scene.accent} key={scene.number}>
            <div className="storySceneTop">
              <div className="storySceneLiveLabel">
                <span className="storyLiveDot" />
                <b>{sceneLiveData[index].label}</b>
              </div>

              <div className="storyMetricRail">
                {sceneLiveData[index].metrics.map((metric, metricIndex) => (
                  <div className={'storyMetricChip tone-' + metric.tone} key={metric.text}>
                    <span>{metric.value}</span>
                    <small>{metric.text}</small>
                    <i style={{ animationDelay: metricIndex * 0.45 + 's' }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="storyAmbientLayer" aria-hidden="true">
              <span className="storyAmbient ambientOne">$</span>
              <span className="storyAmbient ambientTwo">S/</span>
              <span className="storyAmbient ambientThree">%</span>
              <span className="storyAmbient ambientFour">{scene.number}</span>
            </div>

            <div className="publicStoryVisual kineticSurface">
              <div className="storyHalo" />
              <div className="storyObject">
                <span>{scene.number}</span>
                {index === 0 ? (
                  <div className="financeWalletScene">
                    <div className="financeWallet">
                      <span className="financeWalletLine" />
                      <span className="financeWalletChip">$</span>
                      <span className="financeWalletAmount">S/ 1,240</span>
                    </div>
                    <span className="financeFloat financeFloatIn">+ S/240</span>
                    <span className="financeFloat financeFloatOut">- S/80</span>
                    <span className="financeCoin financeCoinOne">$</span>
                    <span className="financeCoin financeCoinTwo">S/</span>
                  </div>
                ) : null}

                {index === 1 ? (
                  <div className="financePrivacyScene">
                    <div className="financeShield">
                      <span className="financeLockShackle" />
                      <span className="financeLockBody">$</span>
                    </div>
                    <span className="securityOrbitCoin">$</span>
                    <span className="securityOrbitCoin second">S/</span>
                    <span className="securityLabel">PRIVADO</span>
                  </div>
                ) : null}

                {index === 2 ? (
                  <div className="financeCoupleScene">
                    <div className="financeWalletMini financeWalletBlue">
                      <span>$</span>
                    </div>
                    <div className="financeTransfer">
                      <i>→</i>
                      <b>50 / 50</b>
                      <i>←</i>
                    </div>
                    <div className="financeWalletMini financeWalletPink">
                      <span>S/</span>
                    </div>
                    <span className="sharedCoin">$</span>
                  </div>
                ) : null}

                {index === 3 ? (
                  <div className="financeAnalyticsScene">
                    <div className="financeChartBars">
                      <i /><i /><i /><i /><i />
                    </div>
                    <svg className="financeTrendLine" viewBox="0 0 180 90" role="presentation">
                      <polyline points="6,74 40,58 72,64 108,31 142,40 174,12" />
                    </svg>
                    <span className="financeGrowth">+12%</span>
                    <span className="financeChartDollar">$</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="publicStoryCopy">
              <span className="slideNumber">{scene.number} — 04</span>
              <p className="eyebrow">{scene.kicker}</p>
              <h2 className="kineticTitle storyKineticTitle"><KineticWords text={scene.title} /></h2>
              <p>{scene.copy}</p>

              <div className="storyActions">
                <button
                  type="button"
                  className="storyDemoButton kineticButton"
                  onClick={() => setActiveDemo(index)}
                >
                  ▶ Ver demo interactiva
                </button>
                {index === 2 ? (
                  <a href="/calculadoras" className="inlineLink">Probar calculadora →</a>
                ) : (
                  <a href="/login" className="inlineLink">Entrar a la app →</a>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="kineticShowcase">
        <div className="kineticShowcaseTop">
          <div>
            <p className="eyebrow">KINETIC INTERACTION DESIGN</p>
            <h2>Las funciones se muestran solas, como pequeños videos en movimiento.</h2>
          </div>
          <span>MOVE · HOVER · SCROLL · LIVE</span>
        </div>

        <div className="kineticShowcaseScenes">
          <article className="kineticScene kineticScenePersonal">
            <div className="kineticScenePoster kineticSurface">
              <div className="liveDemoTopline">
                <span className="livePulse" />
                <small>DEMO EN VIVO · MI DINERO</small>
                <b>01 / 03</b>
              </div>

              <div className="livePersonalFrame">
                <div className="liveBalanceBlock">
                  <span>Saldo disponible</span>
                  <strong>
                    {showcaseStep === 0 ? 'S/ 1,240' : showcaseStep === 1 ? 'S/ 1,154' : showcaseStep === 2 ? 'S/ 1,136' : 'S/ 1,136'}
                  </strong>
                  <small>{showcaseStep === 3 ? 'Actualizado hace un instante' : 'Septiembre'}</small>
                </div>

                <div className="liveTransactionFeed">
                  <div className={showcaseStep === 0 ? 'liveTransaction active income' : 'liveTransaction income'}>
                    <span>＋</span>
                    <div><b>Sueldo</b><small>Ingreso personal</small></div>
                    <strong>+ S/ 2,800</strong>
                  </div>
                  <div className={showcaseStep === 1 ? 'liveTransaction active expense' : 'liveTransaction expense'}>
                    <span>🍽️</span>
                    <div><b>Almuerzo</b><small>Comida · Yape</small></div>
                    <strong>- S/ 86</strong>
                  </div>
                  <div className={showcaseStep === 2 ? 'liveTransaction active expense' : 'liveTransaction expense'}>
                    <span>🚕</span>
                    <div><b>Taxi</b><small>Transporte · Efectivo</small></div>
                    <strong>- S/ 18</strong>
                  </div>
                </div>

                <div className="livePersonalFooter">
                  <div><span>Presupuesto comida</span><b>{showcaseStep < 2 ? '62%' : '68%'}</b></div>
                  <div className="liveBudgetTrack"><i style={{ width: showcaseStep < 2 ? '62%' : '68%' }} /></div>
                </div>
              </div>

              <div className="liveStepDots">
                {[0,1,2,3].map((item) => <i className={showcaseStep === item ? 'active' : ''} key={item} />)}
              </div>
            </div>

            <div className="kineticSceneMeta">
              <strong>PR.01</strong>
              <span>/ PERSONAL</span>
              <p>Un ejemplo realista: entra un ingreso, aparece un gasto y el saldo cambia sin que el usuario tenga que abrir nada.</p>
            </div>

            <span className="kineticShowcasePill">01 · DEMO AUTOMÁTICA</span>
          </article>

          <article className="kineticScene kineticSceneCouple">
            <div className="kineticSceneMeta">
              <strong>PR.02</strong>
              <span>/ PAREJA</span>
              <p>El ejemplo avanza solo desde “quién pagó” hasta la división, la deuda y finalmente el saldo en cero.</p>
            </div>

            <div className="kineticScenePoster kineticSurface">
              <div className="liveDemoTopline">
                <span className="livePulse pink" />
                <small>DEMO EN VIVO · PAREJA</small>
                <b>02 / 03</b>
              </div>

              <div className="liveCoupleFrame">
                <div className="liveCouplePeople">
                  <div className={showcaseStep === 0 ? 'liveCouplePerson blue active' : 'liveCouplePerson blue'}>
                    <span>$</span><b>Tú</b><small>Pagaste</small>
                  </div>
                  <div className="liveCoupleCenter">
                    <span className="liveSharedCoin">$</span>
                    <b>{showcaseStep === 0 ? 'S/ 120' : showcaseStep === 1 ? '50 / 50' : showcaseStep === 2 ? 'S/ 60' : 'S/ 0'}</b>
                    <small>
                      {showcaseStep === 0 ? 'Cena' : showcaseStep === 1 ? 'S/ 60 cada uno' : showcaseStep === 2 ? 'Tu pareja te debe' : 'Balance saldado'}
                    </small>
                  </div>
                  <div className={showcaseStep === 2 ? 'liveCouplePerson pink active' : 'liveCouplePerson pink'}>
                    <span>S/</span><b>Pareja</b><small>{showcaseStep === 3 ? 'Pagó S/ 60' : 'Parte compartida'}</small>
                  </div>
                </div>

                <div className="liveTransferPath">
                  <i className={showcaseStep >= 1 ? 'active' : ''} />
                  <span>{showcaseStep === 0 ? 'Registrando gasto...' : showcaseStep === 1 ? 'Dividiendo automáticamente...' : showcaseStep === 2 ? 'Actualizando balance...' : 'Pago recibido ✓'}</span>
                </div>

                <div className="liveCoupleSummary">
                  <div><span>Pagaste tú</span><b>S/ 120</b></div>
                  <div><span>Tu parte</span><b>S/ 60</b></div>
                  <div><span>Balance</span><b className={showcaseStep === 3 ? 'zero' : ''}>{showcaseStep === 3 ? 'S/ 0' : 'S/ 60'}</b></div>
                </div>
              </div>

              <div className="liveStepDots pink">
                {[0,1,2,3].map((item) => <i className={showcaseStep === item ? 'active' : ''} key={item} />)}
              </div>
            </div>

            <span className="kineticShowcasePill">02 · DEMO AUTOMÁTICA</span>
          </article>

          <article className="kineticScene kineticSceneStats">
            <div className="kineticScenePoster kineticSurface">
              <div className="liveDemoTopline">
                <span className="livePulse cyan" />
                <small>DEMO EN VIVO · ESTADÍSTICAS</small>
                <b>03 / 03</b>
              </div>

              <div className="liveStatsFrame">
                <div className="liveStatsHeadline">
                  <span>Gasto del mes</span>
                  <strong>{showcaseStep === 0 ? 'S/ 1,210' : showcaseStep === 1 ? 'S/ 1,296' : showcaseStep === 2 ? 'S/ 1,314' : 'S/ 1,314'}</strong>
                  <b>+12%</b>
                </div>

                <div className="liveStatsChart">
                  <div className="liveStatsBars">
                    <i style={{ height: showcaseStep === 0 ? '34%' : '46%' }} />
                    <i style={{ height: showcaseStep <= 1 ? '54%' : '62%' }} />
                    <i style={{ height: showcaseStep <= 2 ? '48%' : '58%' }} />
                    <i style={{ height: '78%' }} />
                    <i style={{ height: showcaseStep === 3 ? '96%' : '88%' }} />
                  </div>
                  <svg viewBox="0 0 260 110" role="presentation">
                    <polyline points="5,95 50,78 94,82 140,48 188,58 255,16" />
                  </svg>
                </div>

                <div className="liveStatsCategories">
                  <div><span>🍽️ Comida</span><b>{showcaseStep < 2 ? '34%' : '38%'}</b></div>
                  <div><span>🚕 Transporte</span><b>21%</b></div>
                  <div><span>🎬 Ocio</span><b>17%</b></div>
                </div>
              </div>

              <div className="liveStepDots cyan">
                {[0,1,2,3].map((item) => <i className={showcaseStep === item ? 'active' : ''} key={item} />)}
              </div>
            </div>

            <div className="kineticSceneMeta">
              <strong>PR.03</strong>
              <span>/ DATOS</span>
              <p>Los movimientos de ejemplo alimentan el gráfico y cambian los porcentajes automáticamente, igual que una animación GIF.</p>
            </div>

            <span className="kineticShowcasePill">03 · DEMO AUTOMÁTICA</span>
          </article>
        </div>
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
        <a className="primaryButton kineticButton" href="/login">Abrir MiFinanzas →</a>
      </section>

      {activeDemo !== null ? (
        <div className="demoOverlay" role="dialog" aria-modal="true" aria-label={demos[activeDemo].title}>
          <button className="demoBackdrop" type="button" aria-label="Cerrar demo" onClick={() => setActiveDemo(null)} />
          <section className={'demoModal demo-' + demos[activeDemo].accent}>
            <header className="demoModalHeader">
              <div>
                <p className="eyebrow">{demos[activeDemo].label}</p>
                <h2>{demos[activeDemo].title}</h2>
              </div>
              <button className="demoClose kineticButton" type="button" onClick={() => setActiveDemo(null)}>×</button>
            </header>

            <div className="demoStage">
              <div className="demoPhoneFrame">
                <div className="demoPhoneTop">
                  <span className="demoPhoneBrand">$</span>
                  <small>MiFinanzas</small>
                  <i />
                </div>

                <div className="demoPhoneBalance">
                  <span>{demos[activeDemo].steps[demoStep].title}</span>
                  <strong>{demos[activeDemo].amount}</strong>
                  <small>{demos[activeDemo].steps[demoStep].detail}</small>
                </div>

                <div className="demoMotionCanvas">
                  {activeDemo === 0 ? (
                    <>
                      <span className="demoMoney demoMoneyOne">+ S/ 2,800</span>
                      <span className="demoMoney demoMoneyTwo">- S/ 86</span>
                      <div className="demoWalletCard"><b>$</b><span>Saldo</span></div>
                    </>
                  ) : null}

                  {activeDemo === 1 ? (
                    <>
                      <div className="demoShieldAnim"><span>$</span></div>
                      <span className="demoPrivateChip">Solo tú</span>
                      <span className="demoOrbitMini">S/</span>
                    </>
                  ) : null}

                  {activeDemo === 2 ? (
                    <>
                      <div className="demoPersonCard blue"><span>$</span><b>Tú</b></div>
                      <div className="demoTransferAnim"><i>→</i><b>50/50</b><i>←</i></div>
                      <div className="demoPersonCard pink"><span>S/</span><b>Pareja</b></div>
                    </>
                  ) : null}

                  {activeDemo === 3 ? (
                    <>
                      <div className="demoChartAnim"><i /><i /><i /><i /><i /></div>
                      <svg className="demoLineAnim" viewBox="0 0 220 100" role="presentation">
                        <polyline points="4,86 48,62 84,68 130,36 174,44 216,12" />
                      </svg>
                      <span className="demoPercentAnim">+12%</span>
                    </>
                  ) : null}
                </div>

                <div className="demoProgress">
                  {demos[activeDemo].steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      className={demoStep === index ? 'active' : ''}
                      onClick={() => setDemoStep(index)}
                      aria-label={'Ver paso ' + (index + 1)}
                    />
                  ))}
                </div>
              </div>

              <div className="demoNarrative">
                <span className="demoStepNumber">0{demoStep + 1}</span>
                <small>PASO {demoStep + 1} DE {demos[activeDemo].steps.length}</small>
                <h3>{demos[activeDemo].steps[demoStep].title}</h3>
                <p>{demos[activeDemo].steps[demoStep].detail}</p>

                <div className="demoStepList">
                  {demos[activeDemo].steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      className={demoStep === index ? 'active kineticButton' : 'kineticButton'}
                      onClick={() => setDemoStep(index)}
                    >
                      <span>0{index + 1}</span>
                      <div><b>{step.title}</b><small>{step.detail}</small></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

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
