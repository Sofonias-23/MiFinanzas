const recentExpenses = [
  ["Cine", "24 sep", "- S/ 20.00"],
  ["Supermercado", "22 sep", "- S/ 85.00"],
  ["Yape", "21 sep", "- S/ 40.00"],
];

export default function DashboardPage() {
  return (
    <main className="dashboardShell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <nav>
          <a className="active" href="#">⌂ Inicio</a>
          <a href="#">▣ Gastos</a>
          <a href="#">◫ Estadísticas</a>
          <a href="#">◇ Deudas</a>
          <a href="#">◎ Metas</a>
          <a href="#">⚙ Configuración</a>
        </nav>
      </aside>

      <section className="dashboardMain">
        <div className="dashboardHeader">
          <div>
            <p className="eyebrow">MI PERFIL</p>
            <h1>Hola, Sofito</h1>
            <p>Aquí tienes un resumen de tus finanzas.</p>
          </div>
          <div className="profileSwitch">
            <button className="selected">Mi perfil</button>
            <button>Pareja</button>
          </div>
        </div>

        <div className="metricGrid">
          <article><span>Gasto total</span><strong>S/ 1,250.00</strong><em>+12%</em></article>
          <article><span>Ingresos</span><strong>S/ 2,000.00</strong></article>
          <article><span>Disponible</span><strong>S/ 750.00</strong></article>
        </div>

        <div className="dashboardGrid">
          <article className="panel">
            <div className="panelTitle">
              <div>
                <span>Gastos por categoría</span>
                <strong>S/ 1,250.00</strong>
              </div>
              <div className="donut" />
            </div>
            <div className="legend">
              <span><i className="dot d1" />Alimentos <b>35%</b></span>
              <span><i className="dot d2" />Transporte <b>20%</b></span>
              <span><i className="dot d3" />Entretenimiento <b>15%</b></span>
              <span><i className="dot d4" />Otros <b>30%</b></span>
            </div>
          </article>

          <article className="panel">
            <div className="panelHeading">
              <h2>Últimos gastos</h2>
              <a href="#">Ver todos</a>
            </div>
            <div className="expenseList">
              {recentExpenses.map(([name, date, amount]) => (
                <div key={name}>
                  <span className="expenseIcon">◈</span>
                  <span><b>{name}</b><small>{date}</small></span>
                  <strong>{amount}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
