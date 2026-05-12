/* ═══════════════════════════════════════════════════════
   MODULES/CUOTAS.JS
═══════════════════════════════════════════════════════ */

const Cuotas = {

  _mesActual: '2025-02',

  render() {
    const mes      = this._mesActual;
    const recaudo  = AppState.getTotalRecaudadoMes(mes);
    const meta     = AppState.residentes.length * AppState.conjunto.cuotaBase;
    const pendiente = meta - recaudo;

    return `
      <div class="stats-grid-3">
        <div class="stat-card green">
          <div class="stat-label">Total Recaudado</div>
          <div class="stat-value">${Charts.formatMoney(recaudo)}</div>
          <div class="stat-sub">${meta > 0 ? Math.round((recaudo/meta)*100) : 0}% de la meta</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-label">Por Cobrar</div>
          <div class="stat-value">${Charts.formatMoney(pendiente)}</div>
          <div class="stat-sub">${AppState.residentes.filter(r => AppState.getEstadoPago(r.apto, mes).estado !== 'Pagado').length} apartamentos</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">En Mora</div>
          <div class="stat-value">${Charts.formatMoney(AppState.getMorosos().length * AppState.conjunto.cuotaBase)}</div>
          <div class="stat-sub">${AppState.getMorosos().length} aptos · +2 meses</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Gestión de Cuotas – ${PDF._formatMes(mes)}</span>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <select class="search-input" id="sel-mes" style="width:160px">
              <option value="2025-02">Febrero 2025</option>
              <option value="2025-01">Enero 2025</option>
              <option value="2024-12">Diciembre 2024</option>
            </select>
            <button class="btn btn-primary" id="btn-nuevo-pago">+ Registrar Pago</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Apartamento</th><th>Residente</th><th>Cuota Base</th>
                <th>Pagado</th><th>Saldo</th><th>Estado</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${AppState.residentes.map(r => this._rowCuota(r, mes)).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  afterRender() {
    // Cambio de mes
    document.getElementById('sel-mes')?.addEventListener('change', (e) => {
      this._mesActual = e.target.value;
      Router.renderCurrent();
    });

    // Abrir modal pago
    document.getElementById('btn-nuevo-pago')?.addEventListener('click', () => {
      this.openPagoModal();
    });

    // Delegación en tabla
    document.querySelector('.table-wrap')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, apto } = btn.dataset;
      if (action === 'pagar')  this.openPagoModal(apto);
      if (action === 'recibo') this._descargarUltimoRecibo(apto);
    });

    // Guardar pago
    document.getElementById('btn-save-pago')?.addEventListener('click', () => this.savePago());
  },

  _rowCuota(r, mes) {
    const est   = AppState.getEstadoPago(r.apto, mes);
    const cuota = AppState.conjunto.cuotaBase;
    const badges = {
      Pagado:   '<span class="badge badge-green">Pagado</span>',
      Parcial:  '<span class="badge badge-yellow">Parcial</span>',
      Pendiente:'<span class="badge badge-red">Pendiente</span>',
    };
    const moroso = AppState.getMorosos().find(m => m.apto === r.apto);
    const badgeText = moroso ? '<span class="badge badge-red">En mora</span>' : (badges[est.estado] || badges.Pendiente);

    const accion = est.estado === 'Pagado'
      ? `<button class="btn btn-ghost btn-sm" data-action="recibo" data-apto="${r.apto}">🧾 Recibo</button>`
      : `<button class="btn btn-primary btn-sm" data-action="pagar" data-apto="${r.apto}">💳 Pagar</button>`;

    const saldoColor = est.saldo > 0 ? 'var(--accent4)' : 'var(--text3)';
    const pagadoColor = est.pagado > 0 ? 'var(--accent2)' : 'var(--text3)';

    return `
      <tr>
        <td><span class="apto-code">${r.apto}</span></td>
        <td>${r.nombre}</td>
        <td>${Charts.formatMoney(cuota)}</td>
        <td style="color:${pagadoColor};font-weight:600">${Charts.formatMoney(est.pagado)}</td>
        <td style="color:${saldoColor};font-weight:600">${est.saldo > 0 ? Charts.formatMoney(est.saldo) : '$0'}</td>
        <td>${badgeText}</td>
        <td>${accion}</td>
      </tr>`;
  },

  openPagoModal(aptoPresel = '') {
    // Poblar select de aptos
    const sel = document.getElementById('p-apto');
    sel.innerHTML = AppState.residentes.map(r =>
      `<option value="${r.apto}" ${r.apto === aptoPresel ? 'selected' : ''}>${r.apto} – ${r.nombre}</option>`
    ).join('');

    // Poblar meses
    const selMes = document.getElementById('p-mes');
    selMes.innerHTML = [
      { val: '2025-02', label: 'Febrero 2025' },
      { val: '2025-01', label: 'Enero 2025' },
      { val: '2024-12', label: 'Diciembre 2024' },
    ].map(m => `<option value="${m.val}" ${m.val === this._mesActual ? 'selected' : ''}>${m.label}</option>`).join('');

    // Fecha hoy
    document.getElementById('p-fecha').value = new Date().toISOString().slice(0,10);
    document.getElementById('p-monto').value  = AppState.conjunto.cuotaBase;
    document.getElementById('p-ref').value    = '';
    Forms.clearAll(['p-apto','p-monto','p-fecha']);

    Modal.open('modal-pago');
  },

  savePago() {
    const data = {
      apto:  Forms.val('p-apto'),
      mes:   Forms.val('p-mes'),
      monto: parseFloat(Forms.val('p-monto')),
      medio: Forms.val('p-medio'),
      fecha: Forms.val('p-fecha'),
      ref:   Forms.val('p-ref'),
    };

    if (!Forms.validatePago(data)) return;

    const nuevo = AppState.addPago(data);
    Modal.close('modal-pago');
    Notify.success(`Pago de ${Charts.formatMoney(nuevo.monto)} registrado. Recibo: ${nuevo.recibo}`);

    // Ofrecer recibo
    setTimeout(() => PDF.generarRecibo(nuevo), 400);

    Router.renderCurrent();
  },

  _descargarUltimoRecibo(apto) {
    const pago = AppState.pagos.find(p => p.apto === apto);
    if (pago) PDF.generarRecibo(pago);
    else Notify.warning('No se encontró recibo para este apartamento.');
  },
};
