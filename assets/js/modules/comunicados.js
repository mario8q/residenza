/* ═══════════════════════════════════════════════════════
   MODULES/COMUNICADOS.JS
═══════════════════════════════════════════════════════ */

const Comunicados = {

  render() {
    const lista   = AppState.comunicados;
    const total   = lista.length;
    const mesActual = lista.filter(c => c.fecha.startsWith('2025-02')).length;
    const avgApertura = total > 0
      ? Math.round(lista.reduce((s, c) => s + (c.enviados > 0 ? (c.lecturas / c.enviados) : 0), 0) / total * 100)
      : 0;

    const porTipo = {
      General:       lista.filter(c => c.destinatarios === 'General').length,
      'Torre A/B':   lista.filter(c => c.destinatarios.startsWith('Torre')).length,
      Urgente:       lista.filter(c => c.prioridad === 'Urgente').length,
    };

    return `
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Comunicados Enviados (${total})</span>
            <button class="btn btn-primary btn-sm" id="btn-nuevo-comunicado">+ Nuevo</button>
          </div>
          <div class="card-body">
            ${lista.length > 0
              ? lista.map(c => this._item(c)).join('')
              : '<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-text">No hay comunicados aún.</div></div>'
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Estadísticas de Comunicados</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:16px">
              <div class="stats-box">
                <div class="stats-box-item">
                  <div style="font-size:0.72rem;color:var(--text3)">Total Enviados</div>
                  <div class="stats-box-val" style="color:var(--accent)">${total}</div>
                </div>
                <div class="stats-box-item">
                  <div style="font-size:0.72rem;color:var(--text3)">Este mes</div>
                  <div class="stats-box-val" style="color:var(--accent2)">${mesActual}</div>
                </div>
              </div>

              <div>
                <div style="font-size:0.8rem;color:var(--text2);margin-bottom:6px">Tasa de apertura promedio</div>
                <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--accent3);margin-bottom:4px">${avgApertura}%</div>
                <div class="progress-wrap">
                  <div class="progress-bar" style="width:${avgApertura}%;background:var(--accent3)"></div>
                </div>
              </div>

              <div>
                <div style="font-size:0.8rem;color:var(--text2);margin-bottom:10px">Por tipo</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem">
                    <span>📢 General</span>
                    <span class="badge badge-blue">${porTipo['General']}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem">
                    <span>🏢 Por torre</span>
                    <span class="badge badge-yellow">${porTipo['Torre A/B']}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem">
                    <span>🚨 Urgente</span>
                    <span class="badge badge-red">${porTipo['Urgente']}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  afterRender() {
    document.getElementById('btn-nuevo-comunicado')?.addEventListener('click', () => {
      this.openModal();
    });
    document.getElementById('btn-save-comunicado')?.addEventListener('click', () => {
      this.save();
    });
  },

  _item(c) {
    const badgeMap = {
      General:      'badge-blue',
      'Torre A':    'badge-yellow',
      'Torre B':    'badge-yellow',
      Propietarios: 'badge-green',
      Urgente:      'badge-red',
    };
    const badge = c.prioridad === 'Urgente' ? 'badge-red' : (badgeMap[c.destinatarios] || 'badge-blue');
    const label = c.prioridad === 'Urgente' ? 'Urgente' : c.destinatarios;
    const dot   = c.prioridad === 'Urgente' ? '' : '<span class="com-dot"></span>';

    return `
      <div class="comunicado-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="com-title">${dot}${c.asunto}</div>
          <span class="badge ${badge}">${label}</span>
        </div>
        <div class="com-meta">
          📅 ${PDF._formatFecha(c.fecha)} ·
          👁 ${c.lecturas} visualizaciones ·
          ✉ ${c.enviados} enviados
        </div>
        <div style="font-size:0.78rem;color:var(--text3);margin-top:6px">
          ${c.mensaje.slice(0, 100)}${c.mensaje.length > 100 ? '...' : ''}
        </div>
      </div>`;
  },

  openModal() {
    Forms.resetFields(['c-asunto','c-mensaje']);
    document.getElementById('c-destinatarios').value = 'General';
    document.getElementById('c-prioridad').value     = 'Normal';
    Modal.open('modal-comunicado');
  },

  save() {
    const data = {
      asunto:       Forms.val('c-asunto'),
      mensaje:      Forms.val('c-mensaje'),
      destinatarios: Forms.val('c-destinatarios'),
      prioridad:    Forms.val('c-prioridad'),
    };
    if (!Forms.validateComunicado(data)) return;

    AppState.addComunicado(data);
    Modal.close('modal-comunicado');
    Notify.success(`Comunicado "${data.asunto}" enviado a ${data.destinatarios}.`);
    Router.renderCurrent();
    Router.updateBadges();
  },
};
