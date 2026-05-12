/* ═══════════════════════════════════════════════════════
   MODULES/PQR.JS
═══════════════════════════════════════════════════════ */

const PQR = {

  _filtroEstado: 'Todos',

  render() {
    const lista = this._filtrados();
    return `
      <div class="tabs" id="tabs-pqr">
        ${['Todos','Abierto','En proceso','Cerrado'].map(t =>
          `<div class="tab ${this._filtroEstado === t ? 'active' : ''}" data-tab="${t}">${t}</div>`
        ).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">
            Peticiones, Quejas y Reclamos
            <span style="font-size:0.78rem;color:var(--text3);font-weight:400;margin-left:8px">${lista.length} registros</span>
          </span>
          <button class="btn btn-primary btn-sm" id="btn-nueva-pqr">+ Nueva PQR</button>
        </div>
        <div class="table-wrap">
          ${lista.length > 0 ? `
          <table class="pqr-table">
            <thead>
              <tr><th>#</th><th>Fecha</th><th>Apto</th><th>Tipo</th><th>Asunto</th><th>Prioridad</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody>
              ${lista.map(p => this._row(p)).join('')}
            </tbody>
          </table>` : `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-text">No hay PQR en esta categoría.</div>
          </div>`}
        </div>
      </div>`;
  },

  afterRender() {
    // Tabs
    document.querySelectorAll('#tabs-pqr .tab').forEach(t => {
      t.addEventListener('click', () => {
        this._filtroEstado = t.dataset.tab;
        Router.renderCurrent();
      });
    });

    // Nueva PQR
    document.getElementById('btn-nueva-pqr')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-save-pqr')?.addEventListener('click',  () => this.save());

    // Delegación de acciones en tabla
    document.querySelector('.table-wrap')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'atender')  this.cambiarEstado(parseInt(id), 'En proceso');
      if (action === 'cerrar')   this.cambiarEstado(parseInt(id), 'Cerrado');
      if (action === 'reabrir')  this.cambiarEstado(parseInt(id), 'Abierto');
    });
  },

  _filtrados() {
    return AppState.pqr.filter(p =>
      this._filtroEstado === 'Todos' || p.estado === this._filtroEstado
    );
  },

  _row(p) {
    const tipoBadge = {
      'Queja':    'badge-red',
      'Petición': 'badge-blue',
      'Reclamo':  'badge-yellow',
    }[p.tipo] || 'badge-blue';

    const prioridadBadge = {
      'Alta':  'badge-red',
      'Media': 'badge-yellow',
      'Baja':  'badge-green',
    }[p.prioridad] || 'badge-green';

    const estadoBadge = {
      'Abierto':    'badge-red',
      'En proceso': 'badge-yellow',
      'Cerrado':    'badge-green',
    }[p.estado] || 'badge-blue';

    let acciones = '';
    if (p.estado === 'Abierto')
      acciones = `<button class="btn btn-primary btn-sm" data-action="atender" data-id="${p.id}">Atender</button>`;
    else if (p.estado === 'En proceso')
      acciones = `<button class="btn btn-ghost btn-sm" data-action="cerrar" data-id="${p.id}">✓ Cerrar</button>`;
    else
      acciones = `<button class="btn btn-ghost btn-sm" data-action="reabrir" data-id="${p.id}">↩ Reabrir</button>`;

    return `
      <tr>
        <td style="font-family:var(--font-mono);color:var(--text3)">${p.radicado}</td>
        <td class="text-muted">${PDF._formatFecha(p.fecha)}</td>
        <td><span class="apto-code">${p.apto}</span></td>
        <td><span class="badge ${tipoBadge}">${p.tipo}</span></td>
        <td style="max-width:220px;font-size:0.82rem">${p.asunto}</td>
        <td><span class="badge ${prioridadBadge}">${p.prioridad}</span></td>
        <td><span class="badge ${estadoBadge}">${p.estado}</span></td>
        <td>${acciones}</td>
      </tr>`;
  },

  openModal() {
    // Poblar aptos
    const sel = document.getElementById('q-apto');
    sel.innerHTML = AppState.residentes.map(r =>
      `<option value="${r.apto}">${r.apto} – ${r.nombre}</option>`
    ).join('');
    Forms.resetFields(['q-asunto','q-descripcion']);
    document.getElementById('q-tipo').value      = 'Petición';
    document.getElementById('q-prioridad').value = 'Baja';
    Modal.open('modal-pqr');
  },

  save() {
    const data = {
      apto:        Forms.val('q-apto'),
      tipo:        Forms.val('q-tipo'),
      asunto:      Forms.val('q-asunto'),
      prioridad:   Forms.val('q-prioridad'),
      descripcion: Forms.val('q-descripcion'),
    };
    if (!Forms.validatePQR(data)) return;

    const nuevo = AppState.addPQR(data);
    Modal.close('modal-pqr');
    Notify.success(`PQR radicada como ${nuevo.radicado}.`);
    Router.renderCurrent();
    Router.updateBadges();
  },

  cambiarEstado(id, estado) {
    AppState.updatePQREstado(id, estado);
    const msgs = {
      'En proceso': 'PQR marcada como En proceso.',
      'Cerrado':    'PQR cerrada correctamente.',
      'Abierto':    'PQR reabierta.',
    };
    Notify.info(msgs[estado] || 'Estado actualizado.');
    Router.renderCurrent();
    Router.updateBadges();
  },
};
