'use client';

import { useMemo, useState } from 'react';

function numberValue(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function CalculadorasPage() {
  const [income, setIncome] = useState('3000');
  const [fixed, setFixed] = useState('1200');
  const [variable, setVariable] = useState('700');

  const [income503020, setIncome503020] = useState('3000');

  const [sharedTotal, setSharedTotal] = useState('120');
  const [sharedPercent, setSharedPercent] = useState('50');

  const budget = useMemo(() => {
    const i = numberValue(income);
    const f = numberValue(fixed);
    const v = numberValue(variable);
    return {
      income: i,
      fixed: f,
      variable: v,
      left: i - f - v,
      spentPercent: i > 0 ? Math.min(999, ((f + v) / i) * 100) : 0,
    };
  }, [income, fixed, variable]);

  const rule = useMemo(() => {
    const total = numberValue(income503020);
    return {
      total,
      needs: total * 0.5,
      wants: total * 0.3,
      goals: total * 0.2,
    };
  }, [income503020]);

  const split = useMemo(() => {
    const total = numberValue(sharedTotal);
    const percentage = Math.max(0, Math.min(100, numberValue(sharedPercent)));
    const mine = total * (percentage / 100);
    return {
      total,
      percentage,
      mine,
      partner: total - mine,
    };
  }, [sharedTotal, sharedPercent]);

  return (
    <main className="calcPage">
      <header className="topbar publicTopbar">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>

        <nav className="navLinks">
          <a href="/">Inicio</a>
          <a href="/calculadoras">Calculadoras</a>
          <a href="/guias">Guías</a>
        </nav>

        <div className="navActions">
          <a className="textButton" href="/login">Entrar</a>
          <a className="primaryButton small" href="/login">Empezar</a>
        </div>
      </header>

      <section className="calcHero">
        <p className="eyebrow">HERRAMIENTAS GRATUITAS</p>
        <h1>Haz los números antes de tomar la decisión.</h1>
        <p>
          Tres calculadoras rápidas para presupuesto personal, planificación mensual y gastos en pareja.
        </p>

        <div className="calcJump">
          <a href="#presupuesto">Presupuesto mensual</a>
          <a href="#503020">Regla 50/30/20</a>
          <a href="#pareja">Dividir gasto</a>
        </div>
      </section>

      <section id="presupuesto" className="calcSection">
        <div className="calcSectionCopy">
          <span>01</span>
          <p className="eyebrow">PRESUPUESTO MENSUAL</p>
          <h2>¿Cuánto te queda realmente?</h2>
          <p>Resta tus gastos fijos y variables a tus ingresos mensuales para visualizar el margen disponible.</p>
        </div>

        <div className="calcCard">
          <div className="calcInputs">
            <label>
              Ingreso mensual
              <div><span>S/</span><input value={income} onChange={(e) => setIncome(e.target.value)} inputMode="decimal" /></div>
            </label>
            <label>
              Gastos fijos
              <div><span>S/</span><input value={fixed} onChange={(e) => setFixed(e.target.value)} inputMode="decimal" /></div>
            </label>
            <label>
              Gastos variables
              <div><span>S/</span><input value={variable} onChange={(e) => setVariable(e.target.value)} inputMode="decimal" /></div>
            </label>
          </div>

          <div className="calcResultHero">
            <span>Disponible</span>
            <strong className={budget.left < 0 ? 'negative' : ''}>{money(budget.left)}</strong>
            <small>{Math.round(budget.spentPercent)}% de tus ingresos están comprometidos.</small>
          </div>

          <div className="calcBreakdown">
            <div><span>Ingresos</span><b>{money(budget.income)}</b></div>
            <div><span>Fijos</span><b>{money(budget.fixed)}</b></div>
            <div><span>Variables</span><b>{money(budget.variable)}</b></div>
          </div>
        </div>
      </section>

      <section id="503020" className="calcSection calcSectionAlt">
        <div className="calcSectionCopy">
          <span>02</span>
          <p className="eyebrow">REFERENCIA 50 / 30 / 20</p>
          <h2>Divide un ingreso en tres bloques.</h2>
          <p>No es una regla rígida: úsala como punto de comparación para revisar cómo estás distribuyendo tu dinero.</p>
        </div>

        <div className="calcCard">
          <div className="calcSingleInput">
            <label>
              Ingreso mensual
              <div><span>S/</span><input value={income503020} onChange={(e) => setIncome503020(e.target.value)} inputMode="decimal" /></div>
            </label>
          </div>

          <div className="ruleResultGrid">
            <div className="ruleNeeds">
              <span>50%</span>
              <small>Necesidades</small>
              <strong>{money(rule.needs)}</strong>
              <p>Vivienda, alimentación, transporte y obligaciones básicas.</p>
            </div>
            <div className="ruleWants">
              <span>30%</span>
              <small>Deseos</small>
              <strong>{money(rule.wants)}</strong>
              <p>Ocio, salidas y gastos flexibles que puedes ajustar.</p>
            </div>
            <div className="ruleGoals">
              <span>20%</span>
              <small>Ahorro y metas</small>
              <strong>{money(rule.goals)}</strong>
              <p>Ahorro, fondo de emergencia, inversión o reducción de deuda.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pareja" className="calcSection">
        <div className="calcSectionCopy">
          <span>03</span>
          <p className="eyebrow">GASTO COMPARTIDO</p>
          <h2>Divide un gasto entre dos personas.</h2>
          <p>Comienza en 50/50 o mueve el porcentaje según el acuerdo que tengan.</p>
        </div>

        <div className="calcCard coupleCalcCard">
          <div className="calcInputs coupleCalcInputs">
            <label>
              Gasto total
              <div><span>S/</span><input value={sharedTotal} onChange={(e) => setSharedTotal(e.target.value)} inputMode="decimal" /></div>
            </label>
            <label>
              Tu porcentaje
              <div><input value={sharedPercent} onChange={(e) => setSharedPercent(e.target.value)} inputMode="decimal" /><span>%</span></div>
            </label>
          </div>

          <div className="coupleSplitVisual">
            <div className="coupleSplitPerson mine">
              <span>Tú</span>
              <strong>{money(split.mine)}</strong>
              <small>{split.percentage.toFixed(0)}%</small>
            </div>
            <div className="coupleSplitMiddle">+</div>
            <div className="coupleSplitPerson partner">
              <span>Otra persona</span>
              <strong>{money(split.partner)}</strong>
              <small>{(100 - split.percentage).toFixed(0)}%</small>
            </div>
          </div>

          <div className="coupleSplitTrack">
            <div style={{ width: split.percentage + '%' }} />
          </div>

          <p className="calcNote">Total: <b>{money(split.total)}</b>. Las dos partes siempre suman el monto original.</p>
        </div>
      </section>

      <section className="calcCta">
        <div>
          <p className="eyebrow">GUARDA ESTO AUTOMÁTICAMENTE</p>
          <h2>MiFinanzas hace estos cálculos dentro de tu cuenta.</h2>
        </div>
        <a className="primaryButton" href="/login">Entrar a MiFinanzas →</a>
      </section>

      <footer className="publicFooter">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <div><a href="/">Inicio</a><a href="/guias">Guías</a><a href="/login">Entrar</a></div>
        <span>© 2026 MiFinanzas</span>
      </footer>
    </main>
  );
}
