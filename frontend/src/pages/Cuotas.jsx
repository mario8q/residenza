import { useState } from 'react';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { generarRecibo } from '../utils/pdf';

const MESES = [
  { val:'2025-02', label:'Febrero 2025' },
  { val:'2025-01', label:'Enero 2025' },
  { val:'2024-12', label:'Diciembre 2024' },
];

export default function Cuotas() {
  const s     = useAppStore();
  const toast = useToast();
  const { user } = useAuthStore();
  const isResidente = user?.rol === 'residente';
  
  const [mes,   setMes]   = useState('2025-02');
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ apto:'', monto:0, medio:'Transferencia', fecha:new Date().toISOString().slice(0,10), ref:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Filtrar residentes según si es residente o admin
  const residentes = isResidente 
    ? s.residentes.filter(r => r.apto === user?.apartamento)
    : s.residentes;

  const recaudo   = isResidente
    ? s.pagos.filter(p => p.apto === user?.apartamento && p.mes === mes).reduce((acc, p) => acc + p.monto, 0)
    : s.getTotalRecaudadoMes(mes);
    
  const meta      = residentes.length * (s.conjunto.cuotaBase || 210000);
  const pendiente = meta - recaudo;

  // Para residentes: obtener estado de su pago
  const miEstado = isResidente && residentes.length > 0 
    ? s.getEstadoPago(residentes[0].apto, mes)
    : null;

  const openPago = (apto='') => {
    const cuota = s.conjunto.cuotaBase || 210000;
    setForm({ 
      apto: apto || (residentes[0]?.apto || ''), 
      monto: isResidente && miEstado ? Math.max(0, miEstado.saldo) : cuota, 
      medio: 'Transferencia', 
      fecha: new Date().toISOString().slice(0,10), 
      ref: '' 
    });
    setErrors({}); 
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.fecha) e.fecha = 'Requerido';
    if (!form.monto || Number(form.monto) <= 0) e.monto = 'Monto inválido';
    if (!isResidente && !form.apto) e.apto = 'Requerido';
    setErrors(e); 
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      let resultado;
      
      if (isResidente) {
        // Pago de residente
        resultado = await s.addPagoResidente({
          monto: Number(form.monto),
          medio: form.medio,
          fecha: form.fecha,
          ref: form.ref,
        });
      } else {
        // Pago registrado por admin
        resultado = await s.addPago({
          apto: form.apto,
          monto: Number(form.monto),
          medio: form.medio,
          fecha: form.fecha,
          ref: form.ref,
        });
      }

      if (resultado?.success) {
        setModal(false);
        toast.success(resultado?.message || `Pago registrado. Recibo: ${resultado?.recibo}`);
        setTimeout(() => {
          if (resultado?.recibo) {
            generarRecibo(resultado, s.formatFecha, s.formatMes);
          }
        }, 400);
      } else {
        toast.error(resultado?.error || 'Error al registrar el pago');
      }
    } catch (err) {
      toast.error('Error al registrar el pago');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const descRecibo = (apto) => {
    const pago = s.pagos.find(p => p.apto === apto);
    if (pago) generarRecibo(pago, s.formatFecha, s.formatMes);
    else toast.warning('No hay recibo para este apartamento.');
  };

  const MORA_BADGE = { Pagado: 'badge-green', Parcial: 'badge-yellow', Pendiente: 'badge-red' };

  return (
    <>
      {!isResidente ? (
        // Vista ADMIN
        <div className="stats-grid-3">
          {[
            { color: 'green', label: 'Total Recaudado', val: s.formatMoney(recaudo), sub: `${meta > 0 ? Math.round((recaudo / meta) * 100) : 0}% de la meta` },
            { color: 'yellow', label: 'Por Cobrar', val: s.formatMoney(pendiente), sub: `${s.residentes.filter(r => s.getEstadoPago(r.apto, mes).estado !== 'Pagado').length} apartamentos` },
            { color: 'red', label: 'En Mora', val: s.formatMoney(s.getMorosos().length * (s.conjunto.cuotaBase || 210000)), sub: `${s.getMorosos().length} aptos · +2 meses` },
          ].map(c => (
            <div key={c.label} className={`stat-card ${c.color}`}>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.val}</div>
              <div className="stat-sub">{c.sub}</div>
            </div>
          ))}
        </div>
      ) : (
        // Vista RESIDENTE
        <div className="stats-grid-2">
          {[
            { color: 'green', label: 'Cuota Mensual', val: s.formatMoney(s.conjunto.cuotaBase || 210000) },
            { color: miEstado?.saldo > 0 ? 'red' : 'green', label: 'Saldo Pendiente', val: s.formatMoney(miEstado?.saldo || 0) },
          ].map(c => (
            <div key={c.label} className={`stat-card ${c.color}`}>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {isResidente ? 'Mis Cuotas' : 'Gestión de Cuotas'} – {s.formatMes(mes)}
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="search-input" style={{ width: 160 }} value={mes} onChange={e => setMes(e.target.value)}>
              {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            {!isResidente && (
              <button className="btn btn-primary" onClick={() => openPago()}>+ Registrar Pago</button>
            )}
            {isResidente && miEstado?.saldo > 0 && (
              <button className="btn btn-accent" onClick={() => openPago()}>💳 Realizar Pago</button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {!isResidente && <th>Apartamento</th>}
                {!isResidente && <th>Residente</th>}
                <th>Cuota</th>
                <th>Pagado</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {residentes.map(r => {
                const e = s.getEstadoPago(r.apto, mes);
                const moroso = s.getMorosos().find(m => m.apto === r.apto);
                return (
                  <tr key={r.id}>
                    {!isResidente && <td><span className="apto-code">{r.apto}</span></td>}
                    {!isResidente && <td>{r.nombre}</td>}
                    <td>{s.formatMoney(s.conjunto.cuotaBase || 210000)}</td>
                    <td style={{ color: e.pagado > 0 ? 'var(--accent2)' : 'var(--text3)', fontWeight: 600 }}>{s.formatMoney(e.pagado)}</td>
                    <td style={{ color: e.saldo > 0 ? 'var(--accent4)' : 'var(--text3)', fontWeight: 600 }}>{s.formatMoney(e.saldo)}</td>
                    <td>
                      {moroso ? (
                        <span className="badge badge-red">⚠️ En mora</span>
                      ) : (
                        <span className={`badge ${MORA_BADGE[e.estado]}`}>{e.estado}</span>
                      )}
                    </td>
                    <td>
                      {e.estado === 'Pagado' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => descRecibo(r.apto)}>🧾 Recibo</button>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => openPago(r.apto)}
                        >
                          💳 Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INFORMACIÓN PARA RESIDENTES */}
      {isResidente && miEstado?.saldo > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent4)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: '2.5rem' }}>⚠️</div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>
                  Tienes un saldo pendiente
                </div>
                <div style={{ color: 'var(--text2)', fontSize: '.9rem' }}>
                  Debes {s.formatMoney(miEstado.saldo)} del mes de {s.formatMes(mes)}. 
                  Realiza tu pago ahora para evitar cargos adicionales.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={isResidente ? "💳 Mi Pago" : "💳 Registrar Pago"}>
        {!isResidente && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Apartamento *</label>
              <select className={`form-input${errors.apto ? ' error' : ''}`} value={form.apto} onChange={e => setForm(p => ({ ...p, apto: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {residentes.map(r => <option key={r.id} value={r.apto}>{r.apto} – {r.nombre}</option>)}
              </select>
              {errors.apto && <span className="form-error">{errors.apto}</span>}
            </div>
          </div>
        )}
        
        {isResidente && (
          <div className="form-group">
            <label className="form-label">Apartamento</label>
            <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '6px', fontWeight: 500 }}>
              {residentes[0]?.apto}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Monto *
            {isResidente && miEstado?.saldo > 0 && (
              <span style={{ fontSize: '.8rem', color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>
                Saldo: {s.formatMoney(miEstado.saldo)}
              </span>
            )}
          </label>
          <input 
            className={`form-input${errors.monto ? ' error' : ''}`} 
            type="number" 
            value={form.monto} 
            onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
            placeholder="0"
          />
          {errors.monto && <span className="form-error">{errors.monto}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fecha de pago *</label>
            <input 
              className={`form-input${errors.fecha ? ' error' : ''}`} 
              type="date" 
              value={form.fecha} 
              onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
            />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Medio de pago</label>
            <select className="form-input" value={form.medio} onChange={e => setForm(p => ({ ...p, medio: e.target.value }))}>
              {['Transferencia', 'Efectivo', 'PSE', 'Cheque'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Referencia (opcional)</label>
          <input 
            className="form-input" 
            type="text" 
            placeholder="Ej: Ref. transferencia" 
            value={form.ref} 
            onChange={e => setForm(p => ({ ...p, ref: e.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setModal(false)} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? '⏳ Procesando...' : '✓ Confirmar Pago'}
          </button>
        </div>
      </Modal>
    </>
  );
}