/* ═══════════════════════════════════════════════════════
   MODULES/DASHBOARD.JS
═══════════════════════════════════════════════════════ */

const Dashboard = {

  render() {
    const mes        = '2025-02';
    const recaudado  = AppState.getTotalRecaudadoMes(mes);
    const meta       = AppState.residentes.length * AppState.conjunto.cuotaBase;
    const pct        = meta > 0 ? Math.round((recaudado / meta) * 100) : 0;
    const pendiente  = meta - recaudado;
    const pqrAbier   = AppState.getPQRAbiertos().length;
    const nResid     = AppState.residentes.length;
    const ultimosPagos = AppState.pagos.slice(0, 5);

    // Estado de pagos por apto
    const pagados   = AppState.residentes.filter(r => AppState.getEstadoPago(r.apto, mes).estado === 'Pagado').length;
    const parciales = AppState.residentes.filter(r => AppState.getEstadoPago(r.apto, mes).estado === 'Parcial').length;
    const morosos   = AppState.residentes.filter(r => AppState.getEstadoPago(r.apto, mes).estado === 'Pendiente').length;
    const pctPagado = AppState.residentes.length > 0 ? Math.round((pagados / AppState.residentes.length) * 100) : 0;

    return `
      <!-- Stats -->
      <div class="stats-grid">
        ${this._statCard('blue',   'Total Residentes',    nResid,
          `En ${AppState.conjunto.aptosPorTorre * 2} apartamentos`,
          '↑ Activos', 'trend-up')}
        ${this._statCard('green',  'Recaudo del Mes',     Charts.formatMoney(recaudado),
          `Meta: ${Charts.formatMoney(meta)}`,
          `${pct}% completado`, pct >= 80 ? 'trend-up' : 'trend-down',
          pct)}
        ${this._statCard('yellow', 'Pagos Pendientes',    Charts.formatMoney(pendiente),
          `${morosos + parciales} apartamentos`,
          morosos > 0 ? `↑ ${morosos} en mora` : 'Sin mora activa',
          morosos > 0 ? 'trend-down' : 'trend-up')}
        ${this._statCard('red',    'PQR Abiertas',        pqrAbier,
          `${AppState.pqr.filter(p => p.prioridad === 'Alta' && p.estado !== 'Cerrado').length} urgentes`,
          pqrAbier > 0 ? 'Requieren atención' : 'Todo resuelto',
          pqrAbier > 0 ? 'trend-down' : 'trend-up')}
      </div>

      <!-- Gráficas principales -->
      <div class="grid-3-1">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recaudo Mensual 2025</span>
            <span class="card-action" onclick="Router.navigate('reportes')">Ver detalle →</span>
          </div>
          <div class="card-body">
            <div class="bar-chart" id="chart-dashboard"></div>
            <div class="chart-legend">
              <span><span class="chart-legend-dot" style="background:var(--accent)"></span>Pagado</span>
              <span><span class="chart-legend-dot" style="background:var(--surface2);border:1px solid var(--border)"></span>Sin datos</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Estado de Pagos</span></div>
          <div class="card-body">
            <div class="donut-wrap" id="donut-dashboard"></div>
            <div class="payment-legend">
              <div class="payment-legend-row">
                <span><span class="legend-dot" style="background:var(--accent2)"></span>Al día</span>
                <span class="fw-600" style="color:var(--accent2)">${pagados} aptos</span>
              </div>
              <div class="payment-legend-row">
                <span><span class="legend-dot" style="background:var(--accent3)"></span>Pendiente</span>
                <span class="fw-600" style="color:var(--accent3)">${parciales + morosos} aptos</span>
              </div>
              <div class="payment-legend-row">
                <span><span class="legend-dot" style="background:var(--accent4)"></span>En mora</span>
                <span class="fw-600" style="color:var(--accent4)">${morosos} aptos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tablas inferiores -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Últimos Pagos Registrados</span>
            <span class="card-action" onclick="Router.navigate('reportes')">Ver todos →</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Apto</th><th>Residente</th><th>Monto</th><th>Fecha</th><th>Estado</th></tr>
              </thead>
              <tbody>
                ${ultimosPagos.map(p => {
                  const est = AppState.getEstadoPago(p.apto, p.mes);
                  return `<tr>
                    <td><span class="apto-code">${p.apto}</span></td>
                    <td>${p.residente}</td>
                    <td style="color:var(--accent2);font-weight:600">${Charts.formatMoney(p.monto)}</td>
                    <td class="text-muted">${PDF._formatFecha(p.fecha)}</td>
                    <td>${Dashboard._badgePago(est.estado)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Actividad Reciente</span></div>
          <div class="card-body">
            ${this._activityItems()}
          </div>
        </div>
      </div>`;
  },

  afterRender() {
    // Gráfico de barras
    Charts.renderBarChart('chart-dashboard', AppState.getRecaudoMensual());
    // Donut
    const mes     = '2025-02';
    const pagados = AppState.residentes.filter(r => AppState.getEstadoPago(r.apto, mes).estado === 'Pagado').length;
    const pct     = AppState.residentes.length > 0 ? Math.round((pagados / AppState.residentes.length) * 100) : 0;
    Charts.renderDonut('donut-dashboard', pct);
  },

  // ── Helpers privados ──────────────────────────────

  _statCard(color, label, value, sub, trend, trendClass, pct = null) {
    const progressBar = pct !== null
      ? `<div class="progress-wrap" style="margin-top:8px">
           <div class="progress-bar" style="width:${pct}%;background:var(--accent2)"></div>
         </div>`
      : '';
    return `
      <div class="stat-card ${color}">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-sub">${sub}</div>
        <div class="stat-trend ${trendClass}">${trend}</div>
        ${progressBar}
      </div>`;
  },

  _badgePago(estado) {
    const map = {
      'Pagado':   '<span class="badge badge-green">✓ Pagado</span>',
      'Parcial':  '<span class="badge badge-yellow">⏳ Parcial</span>',
      'Pendiente':'<span class="badge badge-red">⚠ Pendiente</span>',
    };
    return map[estado] || estado;
  },

  _activityItems() {
    const items = [
      { icon: '💳', bg: 'rgba(16,185,129,0.1)', color: 'var(--accent2)', text: `Pago registrado – <b>Apto A-101</b> por ${Charts.formatMoney(210000)}`, time: 'Hace 2 horas' },
      { icon: '👤', bg: 'rgba(59,130,246,0.1)',  color: 'var(--accent)',  text: 'Nuevo residente ingresado – <b>Pedro Vargas</b> Apto B-201', time: 'Hace 5 horas' },
      { icon: '📢', bg: 'rgba(245,158,11,0.1)',  color: 'var(--accent3)', text: 'Comunicado enviado – <b>Asamblea ordinaria</b> a todos los residentes', time: 'Ayer, 3:00 PM' },
      { icon: '⚠️', bg: 'rgba(239,68,68,0.1)',   color: 'var(--accent4)', text: 'Alerta de mora – <b>Apto B-305</b> lleva 3 meses sin pago', time: 'Ayer, 10:00 AM' },
      { icon: '📋', bg: 'rgba(59,130,246,0.1)',  color: 'var(--accent)',  text: 'PQR recibida – Daño en ascensor Torre B', time: 'Hace 2 días' },
    ];
    return items.map(i => `
      <div class="activity-item">
        <div class="act-icon" style="background:${i.bg};color:${i.color}">${i.icon}</div>
        <div>
          <div class="act-text">${i.text}</div>
          <div class="act-time">${i.time}</div>
        </div>
      </div>`).join('');
  },
};
