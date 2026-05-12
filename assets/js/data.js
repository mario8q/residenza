/* ═══════════════════════════════════════════════════════
   DATA.JS — Estado global único de la aplicación
   Actúa como "base de datos en memoria" para el MVP.
   En producción, cada lectura/escritura aquí se
   reemplaza por llamadas a la API REST.
═══════════════════════════════════════════════════════ */

const AppState = {

  conjunto: {
    nombre: 'Conjunto Bello Horizonte',
    torres: ['A', 'B'],
    aptosPorTorre: 24,
    cuotaBase: 210000,
  },

  // ── Residentes ─────────────────────────────────────
  residentes: [
    { id: 1,  nombre: 'María López',    apto: 'A-101', tipo: 'Propietario',   cedula: '52001234', telefono: '314-555-1234', email: 'm.lopez@mail.com',    fecha: '2020-03-01', initials: 'ML', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { id: 2,  nombre: 'Sandra Pérez',   apto: 'A-202', tipo: 'Arrendatario',  cedula: '39005678', telefono: '321-555-5678', email: 's.perez@mail.com',    fecha: '2021-06-15', initials: 'SP', color: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
    { id: 3,  nombre: 'Jhon Ramírez',   apto: 'B-104', tipo: 'Propietario',   cedula: '80009012', telefono: '300-555-9012', email: 'j.ramirez@mail.com',  fecha: '2019-01-10', initials: 'JR', color: 'linear-gradient(135deg,#10b981,#059669)' },
    { id: 4,  nombre: 'Luis Torres',    apto: 'B-305', tipo: 'Propietario',   cedula: '79003456', telefono: '310-555-3456', email: 'l.torres@mail.com',   fecha: '2018-09-20', initials: 'LT', color: 'linear-gradient(135deg,#ef4444,#b91c1c)' },
    { id: 5,  nombre: 'Clara Muñoz',    apto: 'A-401', tipo: 'Arrendatario',  cedula: '43007890', telefono: '315-555-7890', email: 'c.munoz@mail.com',    fecha: '2022-02-01', initials: 'CM', color: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
    { id: 6,  nombre: 'Pedro Vargas',   apto: 'B-201', tipo: 'Propietario',   cedula: '91002345', telefono: '318-555-2345', email: 'p.vargas@mail.com',   fecha: '2025-01-15', initials: 'PV', color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
    { id: 7,  nombre: 'Ana Gómez',      apto: 'A-301', tipo: 'Propietario',   cedula: '55004567', telefono: '312-555-4567', email: 'a.gomez@mail.com',    fecha: '2020-07-11', initials: 'AG', color: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
    { id: 8,  nombre: 'Carlos Nieto',   apto: 'B-402', tipo: 'Arrendatario',  cedula: '71006789', telefono: '316-555-6789', email: 'c.nieto@mail.com',    fecha: '2023-04-05', initials: 'CN', color: 'linear-gradient(135deg,#84cc16,#65a30d)' },
  ],

  // ── Pagos ───────────────────────────────────────────
  pagos: [
    { id: 1, aptoId: 1, apto: 'A-101', residente: 'María López',   mes: '2025-02', monto: 210000, medio: 'Transferencia', fecha: '2025-02-20', ref: 'TRF-001042', recibo: 'REC-1042' },
    { id: 2, aptoId: 3, apto: 'B-104', residente: 'Jhon Ramírez',  mes: '2025-02', monto: 210000, medio: 'Efectivo',      fecha: '2025-02-19', ref: '',           recibo: 'REC-1041' },
    { id: 3, aptoId: 2, apto: 'A-202', residente: 'Sandra Pérez',  mes: '2025-02', monto: 105000, medio: 'PSE',           fecha: '2025-02-18', ref: 'PSE-9934',   recibo: 'REC-1040' },
    { id: 4, aptoId: 5, apto: 'A-401', residente: 'Clara Muñoz',   mes: '2025-02', monto: 210000, medio: 'Transferencia', fecha: '2025-02-14', ref: 'TRF-000998', recibo: 'REC-1039' },
    { id: 5, aptoId: 6, apto: 'B-201', residente: 'Pedro Vargas',  mes: '2025-02', monto: 210000, medio: 'Transferencia', fecha: '2025-02-10', ref: 'TRF-000887', recibo: 'REC-1038' },
    { id: 6, aptoId: 7, apto: 'A-301', residente: 'Ana Gómez',     mes: '2025-01', monto: 210000, medio: 'PSE',           fecha: '2025-01-08', ref: 'PSE-8821',   recibo: 'REC-1037' },
    { id: 7, aptoId: 1, apto: 'A-101', residente: 'María López',   mes: '2025-01', monto: 210000, medio: 'Transferencia', fecha: '2025-01-05', ref: 'TRF-000720', recibo: 'REC-1036' },
    { id: 8, aptoId: 3, apto: 'B-104', residente: 'Jhon Ramírez',  mes: '2025-01', monto: 210000, medio: 'Efectivo',      fecha: '2025-01-06', ref: '',           recibo: 'REC-1035' },
  ],

  // ── Comunicados ─────────────────────────────────────
  comunicados: [
    { id: 1, asunto: 'Asamblea Ordinaria de Propietarios', destinatarios: 'General',      prioridad: 'Normal',  mensaje: 'Se convoca a todos los propietarios a la asamblea ordinaria el día 01/03/2025 a las 7:00 PM en el salón comunal.', fecha: '2025-02-22', lecturas: 42, enviados: 48 },
    { id: 2, asunto: 'Mantenimiento Ascensor Torre B',     destinatarios: 'Torre B',      prioridad: 'Normal',  mensaje: 'El ascensor de la Torre B estará en mantenimiento el día 25/02/2025 de 8am a 12pm.', fecha: '2025-02-18', lecturas: 28, enviados: 24 },
    { id: 3, asunto: 'Corte de Agua Programado',           destinatarios: 'General',      prioridad: 'Urgente', mensaje: 'Se informa que el día 17/02/2025 habrá corte de agua desde las 8am hasta las 4pm por trabajos de red.', fecha: '2025-02-15', lecturas: 48, enviados: 48 },
    { id: 4, asunto: 'Recordatorio de Pago – Cuota Feb',  destinatarios: 'General',      prioridad: 'Normal',  mensaje: 'Recordamos que la cuota de administración del mes de febrero vence el 05/02/2025.', fecha: '2025-02-05', lecturas: 38, enviados: 48 },
  ],

  // ── PQR ─────────────────────────────────────────────
  pqr: [
    { id: 5, radicado: '#005', apto: 'B-202', tipo: 'Queja',    asunto: 'Ruido excesivo en horas nocturnas',        prioridad: 'Alta',  estado: 'Abierto',     fecha: '2025-02-22', descripcion: 'El vecino del apto B-202 genera ruido excesivo después de las 11pm.' },
    { id: 4, radicado: '#004', apto: 'B-105', tipo: 'Petición', asunto: 'Daño en ascensor Torre B',                 prioridad: 'Alta',  estado: 'En proceso',  fecha: '2025-02-20', descripcion: 'El ascensor de la Torre B hace ruido extraño y a veces no cierra.' },
    { id: 3, radicado: '#003', apto: 'A-301', tipo: 'Reclamo',  asunto: 'Cobro incorrecto en cuota de diciembre',   prioridad: 'Media', estado: 'En proceso',  fecha: '2025-02-18', descripcion: 'Me cobraron $420.000 en diciembre cuando la cuota es $210.000.' },
    { id: 2, radicado: '#002', apto: 'A-204', tipo: 'Petición', asunto: 'Solicitud de permiso para mascota',        prioridad: 'Baja',  estado: 'Cerrado',     fecha: '2025-02-10', descripcion: 'Solicito autorización para tener un perro de raza pequeña.' },
    { id: 1, radicado: '#001', apto: 'B-401', tipo: 'Reclamo',  asunto: 'Filtración de agua en baño',               prioridad: 'Alta',  estado: 'Cerrado',     fecha: '2025-02-03', descripcion: 'Hay filtración del apto de arriba hacia mi baño.' },
  ],

  // ── Contadores internos ─────────────────────────────
  _nextResidenteId: 9,
  _nextPagoId: 9,
  _nextComunicadoId: 5,
  _nextPqrId: 6,

  // ── Helpers de acceso ───────────────────────────────

  getResidenteById(id) {
    return this.residentes.find(r => r.id === parseInt(id));
  },

  getResidenteByApto(apto) {
    return this.residentes.find(r => r.apto === apto);
  },

  getPagosMes(mes) {
    return this.pagos.filter(p => p.mes === mes);
  },

  getTotalRecaudadoMes(mes) {
    return this.getPagosMes(mes).reduce((s, p) => s + p.monto, 0);
  },

  // Retorna los aptos que ya pagaron en el mes
  getAptosPagadosMes(mes) {
    const pagos = this.getPagosMes(mes);
    const result = {};
    pagos.forEach(p => {
      if (!result[p.apto]) result[p.apto] = 0;
      result[p.apto] += p.monto;
    });
    return result;
  },

  // Estado de pago de un apto en el mes
  getEstadoPago(apto, mes) {
    const pagado = this.getAptosPagadosMes(mes)[apto] || 0;
    const cuota  = this.conjunto.cuotaBase;
    if (pagado >= cuota)  return { estado: 'Pagado',   pagado, saldo: 0 };
    if (pagado > 0)       return { estado: 'Parcial',  pagado, saldo: cuota - pagado };
    return                       { estado: 'Pendiente', pagado: 0, saldo: cuota };
  },

  // Residentes con mora (no han pagado en los últimos 2+ meses)
  getMorosos() {
    const hoy = new Date();
    const meses = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    return this.residentes.filter(r => {
      const sinPago = meses.filter(m => this.getEstadoPago(r.apto, m).estado === 'Pendiente');
      return sinPago.length >= 2;
    });
  },

  getPQRAbiertos() {
    return this.pqr.filter(p => p.estado !== 'Cerrado');
  },

  addResidente(data) {
    const initials = data.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    const colors   = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#3b82f6,#1d4ed8)',
      'linear-gradient(135deg,#f59e0b,#d97706)',
      'linear-gradient(135deg,#ec4899,#db2777)',
      'linear-gradient(135deg,#06b6d4,#0891b2)',
    ];
    const color = colors[this._nextResidenteId % colors.length];
    const nuevo = { ...data, id: this._nextResidenteId++, initials, color };
    this.residentes.push(nuevo);
    return nuevo;
  },

  updateResidente(id, data) {
    const idx = this.residentes.findIndex(r => r.id === parseInt(id));
    if (idx !== -1) {
      this.residentes[idx] = { ...this.residentes[idx], ...data };
      return this.residentes[idx];
    }
    return null;
  },

  deleteResidente(id) {
    const idx = this.residentes.findIndex(r => r.id === parseInt(id));
    if (idx !== -1) { this.residentes.splice(idx, 1); return true; }
    return false;
  },

  addPago(data) {
    const residente = this.getResidenteByApto(data.apto);
    const recibo    = `REC-${1000 + this._nextPagoId}`;
    const nuevo = {
      ...data,
      id:        this._nextPagoId++,
      residente: residente ? residente.nombre : data.apto,
      recibo,
    };
    this.pagos.unshift(nuevo);
    return nuevo;
  },

  addComunicado(data) {
    const nuevo = {
      ...data,
      id:       this._nextComunicadoId++,
      fecha:    new Date().toISOString().slice(0,10),
      lecturas: 0,
      enviados: this.residentes.length,
    };
    this.comunicados.unshift(nuevo);
    return nuevo;
  },

  addPQR(data) {
    const nuevo = {
      ...data,
      id:       this._nextPqrId,
      radicado: `#${String(this._nextPqrId).padStart(3,'0')}`,
      estado:   'Abierto',
      fecha:    new Date().toISOString().slice(0,10),
    };
    this._nextPqrId++;
    this.pqr.unshift(nuevo);
    return nuevo;
  },

  updatePQREstado(id, estado) {
    const item = this.pqr.find(p => p.id === parseInt(id));
    if (item) { item.estado = estado; return true; }
    return false;
  },

  // Datos para el gráfico de barras mensual
  getRecaudoMensual() {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const meta   = this.residentes.length * this.conjunto.cuotaBase;
    return meses.map((label, i) => {
      const key = `2025-${String(i+1).padStart(2,'0')}`;
      const total = this.getTotalRecaudadoMes(key);
      return { label, total, pct: meta > 0 ? Math.round((total / meta) * 100) : 0 };
    });
  },
};
