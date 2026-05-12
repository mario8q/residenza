/* ═══════════════════════════════════════════════════════
   MODULES/RESIDENTES.JS
═══════════════════════════════════════════════════════ */

const Residentes = {

  _filtro: 'Todos',
  _busqueda: '',

  render() {
    const lista = this._filtrados();
    return `
      <div class="tabs" id="tabs-residentes">
        ${['Todos','Propietarios','Arrendatarios','Morosos'].map(t =>
          `<div class="tab ${this._filtro === t ? 'active' : ''}" data-tab="${t}">${t}</div>`
        ).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">
            Lista de Residentes
            <span style="font-size:0.78rem;color:var(--text3);font-weight:400;margin-left:8px">${lista.length} registros</span>
          </span>
          <input class="search-input" type="text" id="search-residentes"
            placeholder="🔍 Buscar residente..." value="${this._busqueda}">
        </div>
        <div class="table-wrap">
          ${lista.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Apartamento</th><th>Residente</th><th>Tipo</th>
                <th>Teléfono</th><th>Correo</th><th>Cuota</th>
                <th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${lista.map(r => this._row(r)).join('')}
            </tbody>
          </table>` : `
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <div class="empty-state-text">No se encontraron residentes.</div>
          </div>`}
        </div>
      </div>`;
  },

  afterRender() {
    // Tabs
    document.querySelectorAll('#tabs-residentes .tab').forEach(t => {
      t.addEventListener('click', () => {
        this._filtro   = t.dataset.tab;
        this._busqueda = '';
        Router.renderCurrent();
      });
    });

    // Búsqueda
    const inp = document.getElementById('search-residentes');
    if (inp) {
      inp.addEventListener('input', (e) => {
        this._busqueda = e.target.value.toLowerCase();
        Router.renderCurrent();
      });
    }

    // Botones editar / eliminar (delegación)
    document.querySelector('.table-wrap')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit')   this.openEdit(parseInt(id));
      if (action === 'delete') this.confirmDelete(parseInt(id));
    });

    // Guardar residente desde modal
    document.getElementById('btn-save-residente')?.addEventListener('click', () => {
      this.save();
    });
  },

  _filtrados() {
    const morosos = AppState.getMorosos().map(r => r.id);
    return AppState.residentes.filter(r => {
      const matchFiltro = this._filtro === 'Todos'
        || (this._filtro === 'Propietarios'  && r.tipo === 'Propietario')
        || (this._filtro === 'Arrendatarios' && r.tipo === 'Arrendatario')
        || (this._filtro === 'Morosos'       && morosos.includes(r.id));
      const matchBusq = !this._busqueda
        || r.nombre.toLowerCase().includes(this._busqueda)
        || r.apto.toLowerCase().includes(this._busqueda)
        || r.email.toLowerCase().includes(this._busqueda);
      return matchFiltro && matchBusq;
    });
  },

  _row(r) {
    const est   = AppState.getEstadoPago(r.apto, '2025-02');
    const badge = { Pagado: 'badge-green', Parcial: 'badge-yellow', Pendiente: 'badge-red' }[est.estado] || 'badge-yellow';
    const tipo  = r.tipo === 'Propietario' ? 'badge-blue' : 'badge-yellow';
    return `
      <tr>
        <td><span class="apto-code">${r.apto}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="res-avatar-sm" style="background:${r.color}">${r.initials}</div>
            ${r.nombre}
          </div>
        </td>
        <td><span class="badge ${tipo}">${r.tipo}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text2)">${r.telefono}</td>
        <td style="font-size:0.78rem;color:var(--text2)">${r.email}</td>
        <td style="color:var(--accent2);font-weight:600">${Charts.formatMoney(AppState.conjunto.cuotaBase)}</td>
        <td><span class="badge ${badge}">${est.estado}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${r.id}">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${r.id}">🗑</button>
          </div>
        </td>
      </tr>`;
  },

  openNew() {
    // Limpiar modal
    document.getElementById('modal-residente-title').textContent = '➕ Registrar Nuevo Residente';
    document.getElementById('residente-id-edit').value = '';
    Forms.resetFields(['r-nombre','r-apto','r-cedula','r-telefono','r-email','r-fecha']);
    document.getElementById('r-tipo').value = 'Propietario';
    Modal.open('modal-residente');
  },

  openEdit(id) {
    const r = AppState.getResidenteById(id);
    if (!r) return;
    document.getElementById('modal-residente-title').textContent = '✏️ Editar Residente';
    document.getElementById('residente-id-edit').value = r.id;
    document.getElementById('r-nombre').value   = r.nombre;
    document.getElementById('r-apto').value     = r.apto;
    document.getElementById('r-tipo').value     = r.tipo;
    document.getElementById('r-cedula').value   = r.cedula;
    document.getElementById('r-telefono').value = r.telefono;
    document.getElementById('r-email').value    = r.email;
    document.getElementById('r-fecha').value    = r.fecha || '';
    Forms.clearAll(['r-nombre','r-apto','r-cedula','r-telefono','r-email']);
    Modal.open('modal-residente');
  },

  save() {
    const data = {
      nombre:   Forms.val('r-nombre'),
      apto:     Forms.val('r-apto').toUpperCase(),
      tipo:     Forms.val('r-tipo'),
      cedula:   Forms.val('r-cedula'),
      telefono: Forms.val('r-telefono'),
      email:    Forms.val('r-email'),
      fecha:    Forms.val('r-fecha'),
    };

    if (!Forms.validateResidente(data)) return;

    const editId = document.getElementById('residente-id-edit').value;
    if (editId) {
      AppState.updateResidente(editId, data);
      Notify.success('Residente actualizado correctamente.');
    } else {
      AppState.addResidente(data);
      Notify.success(`Residente ${data.nombre} registrado.`);
    }

    Modal.close('modal-residente');
    Router.renderCurrent();
    Router.updateBadges();
  },

  confirmDelete(id) {
    const r = AppState.getResidenteById(id);
    if (!r) return;
    if (confirm(`¿Eliminar a ${r.nombre} del apto ${r.apto}? Esta acción no se puede deshacer.`)) {
      AppState.deleteResidente(id);
      Notify.info(`Residente ${r.nombre} eliminado.`);
      Router.renderCurrent();
      Router.updateBadges();
    }
  },
};
