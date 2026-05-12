import { create } from 'zustand';
import useAuthStore from './authStore';

const COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
];
const mkInitials = (n) => n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

const useAppStore = create((set, get) => ({
  conjunto: { nombre:'Conjunto', torres:[], aptosPorTorre:0, cuotaBase:0 },
  residentes: [],
  pagos: [],
  comunicados: [],
  pqr: [],
  loading: false,

  // ── Cargar datos de la BD ──────────────────────────────────────
  fetchResidentes: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    
    try {
      set({ loading: true });
      const res = await fetch('/api/residentes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        const residentes = (data.data || []).map((r, i) => ({
          ...r,
          id: r.id,
          nombre: r.nombre,
          apto: r.apto_codigo,
          tipo: r.tipo_residente,
          cedula: r.documento,
          telefono: r.telefono || '',
          email: r.email,
          fecha: r.created_at,
          initials: mkInitials(r.nombre),
          color: COLORS[i % COLORS.length],
        }));
        set({ residentes });
      }
    } catch (err) {
      console.error('Error cargando residentes:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchPagos: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    
    try {
      const res = await fetch('/api/cuotas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        const pagos = (data.data || []).map(p => ({
          ...p,
          id: p.id,
          apto: p.apto,
          residente: p.residente,
          mes: new Date(p.fecha).toISOString().substring(0, 7),
          monto: p.monto,
          medio: p.medio,
          fecha: p.fecha,
          ref: p.ref || '',
          recibo: p.recibo,
        }));
        set({ pagos });
      }
    } catch (err) {
      console.error('Error cargando pagos:', err);
    }
  },

  fetchComunicados: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    
    try {
      const res = await fetch('/api/comunicados', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        const comunicados = (data.data || []).map(c => ({
          ...c,
          id: c.id,
          asunto: c.asunto,
          mensaje: c.mensaje,
          destinatarios: c.destinatarios,
          prioridad: c.prioridad,
          fecha: c.fecha.substring(0, 10),
          lecturas: c.lecturas,
          enviados: c.enviados,
        }));
        set({ comunicados });
      }
    } catch (err) {
      console.error('Error cargando comunicados:', err);
    }
  },

  fetchPQR: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    
    try {
      const res = await fetch('/api/pqr', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        const pqr = (data.data || []).map(p => ({
          ...p,
          id: p.id,
          radicado: p.radicado,
          apto: p.apto,
          tipo: p.tipo,
          asunto: p.asunto,
          prioridad: p.prioridad,
          estado: p.estado,
          fecha: p.fecha.substring(0, 10),
          descripcion: p.descripcion || '',
        }));
        set({ pqr });
      }
    } catch (err) {
      console.error('Error cargando PQRs:', err);
    }
  },

  // ── Acciones (agregar/actualizar) ─────────────────────────────
  addResidente: async (form) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch('/api/residentes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          documento: form.cedula,
          tipo_documento: form.tipo_documento || 'CC',
          tipo_residente: form.tipo,
          telefono: form.telefono,
          email: form.email,
          apto_codigo: form.apto,
          password: form.password || 'Temp123',
        }),
      });
      
      if (res.ok) {
        await get().fetchResidentes();
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateResidente: async (id, form) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`/api/residentes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          documento: form.cedula,
          telefono: form.telefono,
          email: form.email,
          apto_codigo: form.apto,
        }),
      });
      
      if (res.ok) {
        await get().fetchResidentes();
        return { success: true };
      }
    } catch (err) {
      console.error('Error actualizando:', err);
    }
  },

  deleteResidente: async (id) => {
    const token = useAuthStore.getState().token;
    try {
      await fetch(`/api/residentes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await get().fetchResidentes();
    } catch (err) {
      console.error('Error eliminando:', err);
    }
  },

  addPago: async (form) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch('/api/cuotas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apto_codigo: form.apto,
          monto: form.monto,
          medio_pago: form.medio,
          fecha_pago: form.fecha,
          referencia: form.ref,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        await get().fetchPagos();
        return { ...data.data, success: true };
      }
    } catch (err) {
      console.error('Error registrando pago:', err);
    }
  },

  addComunicado: async (form) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch('/api/comunicados', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        await get().fetchComunicados();
      }
    } catch (err) {
      console.error('Error creando comunicado:', err);
    }
  },

  addPQR: async (form) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch('/api/pqr', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apto_codigo: form.apto,
          tipo: form.tipo,
          asunto: form.asunto,
          descripcion: form.descripcion,
          prioridad: form.prioridad,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        await get().fetchPQR();
        return data.data;
      }
    } catch (err) {
      console.error('Error creando PQR:', err);
    }
  },

  updatePQREstado: async (id, estado) => {
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`/api/pqr/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      });
      
      if (res.ok) {
        await get().fetchPQR();
      }
    } catch (err) {
      console.error('Error actualizando PQR:', err);
    }
  },

  // ── Helpers ───────────────────────────────────────────────────
  getTotalRecaudadoMes: (mes) => 
  get().pagos
    .filter(p => p.mes === mes)
    .reduce((s, p) => s + Number(p.monto), 0),

  getRecaudoMensual: () => {
    const pagos = get().pagos;

    const meses = [
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
    ];

    return meses.map((mes) => {
      const total = pagos
        .filter((p) => p.mes === mes)
        .reduce((sum, p) => sum + Number(p.monto), 0);

      return {
        mes,
        total,
      };
    });
  },

  getEstadoPago: (apto, mes) => {
    const cuota = 210000; // Cambiar según tu cuota base
    const pagado = get().pagos.filter(p => p.apto === apto && p.mes === mes).reduce((s, p) => s + p.monto, 0);
    if (pagado >= cuota) return { estado: 'Pagado', pagado, saldo: 0 };
    if (pagado > 0) return { estado: 'Parcial', pagado, saldo: cuota - pagado };
    return { estado: 'Pendiente', pagado: 0, saldo: cuota };
  },

  getMorosos: () => {
    const hoy = new Date();
    const meses = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i - 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    return get().residentes.filter(r => 
      meses.filter(m => get().getEstadoPago(r.apto, m).estado === 'Pendiente').length >= 2
    );
  },

  getPQRAbiertos: () => get().pqr.filter(p => p.estado !== 'Cerrado'),

  formatMoney: (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n),
  formatFecha: (d) => new Date(d).toLocaleDateString('es-CO'),
  formatMes: (mes) => {
    const [year, month] = mes.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(month) - 1]} ${year}`;
  },
}));

export default useAppStore;