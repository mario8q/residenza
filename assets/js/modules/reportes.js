/* ═══════════════════════════════════════════════════════
   MODULES/REPORTES.JS
═══════════════════════════════════════════════════════ */

const Reportes = {

  render() {
    const mes       = '2025-02';
    const recaudo   = AppState.getTotalRecaudadoMes(mes);
    const meta      = AppState.residentes.length * AppState.conjunto.cuotaBase;
    const pendiente = meta - recaudo;
    const pctRec    = meta > 0 ? Math.round((recaudo   / meta) * 100) : 0;
    const pctPend   = meta > 0 ? Math.round((pendiente / meta) * 100) : 0;
    const historial = AppState.pagos.slice(0, 12);

    return `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recaudo por Mes – 2025</span>
          </div>
          <div class="card-body">
            <div class="bar-chart" id="chart-reportes"></div>
            <div class="chart-legend" style="margin-top:8px">
              <span><span class="chart-legend-dot" style="background:var(--accent2)"></span>Recaudado</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Resumen de Cartera – ${PDF._formatMes(mes)}</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:16px">
              ${this._barraCartera('Al día', pctRec,  Charts.formatMoney(recaudo),  'var(--accent2)')}
              ${this._barraCartera('Pendiente', pctPend, Charts.formatMoney(pendiente), 'var(--accent3)')}
            </div>
            <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-primary" id="btn-export-csv">📥 Exportar CSV</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Historial de Pagos</span>
          <span class="card-action" id="btn-export-csv2">Exportar →</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Apartamento</th><th>Residente</th><th>Concepto</th><th>Monto</th><th>Medio</th><th>Recibo</th><th></th></tr>
            </thead>
            <tbody>
              ${historial.map(p => `
                <tr>
                  <td class="text-muted">${PDF._formatFecha(p.fecha)}</td>
                  <td><span class="apto-code">${p.apto}</span></td>
                  <td>${p.residente}</td>
                  <td style="font-size:0.8rem;color:var(--text2)">Cuota admin. ${PDF._formatMes(p.mes)}</td>
                  <td style="color:var(--accent2);font-weight:600">${Charts.formatMoney(p.monto)}</td>
                  <td class="text-muted">${p.medio}</td>
                  <td><span class="badge badge-green">${p.recibo}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" data-action="recibo" data-pago-id="${p.id}">🧾</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  afterRender() {
    Charts.renderBarChart('chart-reportes', AppState.getRecaudoMensual(), 'var(--accent2)');

    const exportBtn  = document.getElementById('btn-export-csv');
    const exportBtn2 = document.getElementById('btn-export-csv2');
    const handler    = () => PDF.exportarPagosCSV(AppState.pagos);
    exportBtn?.addEventListener('click',  handler);
    exportBtn2?.addEventListener('click', handler);

    document.querySelector('.table-wrap')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="recibo"]');
      if (!btn) return;
      const id   = parseInt(btn.dataset.pagoId);
      const pago = AppState.pagos.find(p => p.id === id);
      if (pago) PDF.generarRecibo(pago);
    });
  },

  _barraCartera(label, pct, valor, color) {
    return `
      <div>
        <div class="cartera-row">
          <span>${label} (${pct}%)</span>
          <span style="font-weight:600;color:${color}">${valor}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  },
};
