/* ═══════════════════════════════════════════════════════
   ROUTER.JS — Navegación entre vistas
═══════════════════════════════════════════════════════ */

const Router = {

  _current: 'dashboard',

  _config: {
    dashboard:   { title: 'Dashboard General',                    module: Dashboard,   actionLabel: '+ Nuevo Residente', actionFn: () => Residentes.openNew() },
    residentes:  { title: 'Gestión de Residentes',               module: Residentes,  actionLabel: '+ Nuevo Residente', actionFn: () => Residentes.openNew() },
    cuotas:      { title: 'Cuotas y Pagos',                      module: Cuotas,      actionLabel: '+ Registrar Pago',  actionFn: () => Cuotas.openPagoModal() },
    reportes:    { title: 'Reportes Financieros',                module: Reportes,    actionLabel: '📥 Exportar CSV',   actionFn: () => PDF.exportarPagosCSV(AppState.pagos) },
    comunicados: { title: 'Comunicados',                         module: Comunicados, actionLabel: '+ Nuevo Comunicado', actionFn: () => Comunicados.openModal() },
    pqr:         { title: 'PQR – Peticiones, Quejas y Reclamos', module: PQR,         actionLabel: '+ Nueva PQR',       actionFn: () => PQR.openModal() },
  },

  navigate(view) {
    if (!this._config[view]) return;
    this._current = view;

    // Sidebar activo
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    // Título topbar
    document.getElementById('page-title').textContent = this._config[view].title;

    // Botón acción principal
    const btn = document.getElementById('btn-main-action');
    btn.textContent = this._config[view].actionLabel;
    btn.onclick     = this._config[view].actionFn;

    this._render(view);
  },

  renderCurrent() {
    this._render(this._current);
  },

  _render(view) {
    const cfg     = this._config[view];
    const content = document.getElementById('app-content');
    if (!content) return;

    content.innerHTML = cfg.module.render();

    // afterRender: registra listeners del módulo
    if (typeof cfg.module.afterRender === 'function') {
      cfg.module.afterRender();
    }
  },

  // Actualiza los badges del sidebar (PQR abiertas)
  updateBadges() {
    const pqrCount = AppState.getPQRAbiertos().length;
    const badgePqr = document.getElementById('badge-pqr');
    if (badgePqr) {
      badgePqr.textContent = pqrCount;
      badgePqr.classList.toggle('visible', pqrCount > 0);
    }

    // Comunicados del mes actual
    const comCount = AppState.comunicados.filter(c => c.fecha.startsWith('2025-02')).length;
    const badgeCom = document.getElementById('badge-comunicados');
    if (badgeCom) {
      badgeCom.textContent = comCount;
      badgeCom.classList.toggle('visible', comCount > 0);
    }
  },
};
