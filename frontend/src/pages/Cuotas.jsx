import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { generarRecibo } from '../utils/pdf';

export default function Cuotas() {
  const toast = useToast();
  const { user, token } = useAuthStore();
  const isResidente = user?.rol === 'residente';

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ monto: 0, medio: 'Transferencia', fecha: new Date().toISOString().slice(0, 10), ref: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [residentesEstado, setResidentesEstado] = useState([]);
  const [miEstado, setMiEstado] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // CARGAR ESTADO (Admin)
  const cargarEstado = async () => {
    if (isResidente) return;
    setLoadingAdmin(true);
    try {
      const res = await fetch('/api/cuotas/estado/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResidentesEstado(data.data || []);
    } catch (err) {
      console.error('Error cargando estado:', err);
      toast.error('Error al cargar datos');
    } finally {
      setLoadingAdmin(false);
    }
  };

  // CARGAR ESTADO (Residente)
  const cargarMiEstado = async () => {
    if (!isResidente) return;
    try {
      const res = await fetch('/api/cuotas/estado/residente', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMiEstado(data.data || null);
    } catch (err) {
      console.error('Error cargando mi estado:', err);
    }
  };

  // CARGAR AL MONTAR
  useEffect(() => {
    if (isResidente) {
      cargarMiEstado();
    } else {
      cargarEstado();
    }
  }, [isResidente, token]); // eslint-disable-line

  // ── VISTA RESIDENTE ────────────────────────────────────────
  if (isResidente) {
    const openPago = () => {
      setForm({
        monto: miEstado?.saldo > 0 ? miEstado.saldo : 0,
        medio: 'Transferencia',
        fecha: new Date().toISOString().slice(0, 10),
        ref: '',
      });
      setErrors({});
      setModal(true);
    };

    const validate = () => {
      const e = {};
      if (!form.fecha) e.fecha = 'Requerido';
      if (!form.monto || Number(form.monto) <= 0) e.monto = 'Monto inválido';
      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const save = async () => {
      if (!validate()) return;
      setLoading(true);
      try {
        const res = await fetch('/api/cuotas/residente/pagar', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            monto: Number(form.monto),
            medio_pago: form.medio,
            fecha_pago: form.fecha,
            referencia: form.ref,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          setModal(false);
          // Refrescar estado inmediatamente
          await cargarMiEstado();
          toast.success('Pago registrado correctamente');
          if (data.data?.recibo) {
            setTimeout(() => generarRecibo(data.data, (d) => new Date(d).toLocaleDateString('es-CO'), () => ''), 400);
          }
        } else {
          toast.error(data.error || 'Error al registrar pago');
        }
      } catch (err) {
        toast.error('Error al registrar pago');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <div className="stats-grid-2">
          {[
            { color: 'green', label: 'Cuota Mensual', val: `$${miEstado?.cuota_base?.toLocaleString('es-CO') || '0'}` },
            { color: miEstado?.saldo > 0 ? 'red' : 'green', label: 'Saldo Pendiente', val: `$${miEstado?.saldo?.toLocaleString('es-CO') || '0'}` },
          ].map(c => (
            <div key={c.label} className={`stat-card ${c.color}`}>
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.val}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Mis Cuotas</span>
            {miEstado?.saldo > 0 && (
              <button className="btn btn-accent" onClick={openPago}>
                💳 Realizar Pago
              </button>
            )}
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontSize: '.9rem', color: 'var(--text2)', marginBottom: 8 }}>Apartamento</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{miEstado?.apto}</div>
              </div>
              <div>
                <div style={{ fontSize: '.9rem', color: 'var(--text2)', marginBottom: 8 }}>Estado</div>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontWeight: 600,
                  backgroundColor: miEstado?.estado === 'Pagado' ? 'var(--accent2)' : 
                                   miEstado?.estado === 'Parcial' ? 'var(--accent3)' : 'var(--accent4)',
                  color: 'white',
                }}>
                  {miEstado?.estado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {miEstado?.saldo > 0 && (
          <div className="card" style={{ borderLeft: '4px solid var(--accent4)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: '2.5rem' }}>⚠️</div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Tienes saldo pendiente</div>
                  <div style={{ color: 'var(--text2)', fontSize: '.9rem' }}>
                    Debes ${miEstado?.saldo?.toLocaleString('es-CO')}. Realiza tu pago ahora.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Modal open={modal} onClose={() => setModal(false)} title="💳 Realizar Pago">
          <div className="form-group">
            <label className="form-label">Apartamento</label>
            <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '6px', fontWeight: 500 }}>
              {miEstado?.apto}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Monto *
              <span style={{ fontSize: '.8rem', color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>
                Saldo: ${miEstado?.saldo?.toLocaleString('es-CO')}
              </span>
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
              {loading ? '⏳ Procesando...' : '✓ Confirmar'}
            </button>
          </div>
        </Modal>
      </>
    );
  }

  // ── VISTA ADMIN: SIMPLE ─────────────────────────────────────
  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Estado de Residentes</span>
          <button 
            className="btn btn-ghost" 
            onClick={cargarEstado}
            disabled={loadingAdmin}
          >
            {loadingAdmin ? '⏳ Actualizando...' : '🔄 Refrescar'}
          </button>
        </div>

        {loadingAdmin ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">Cargando...</div>
          </div>
        ) : residentesEstado.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">No hay residentes.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Apartamento</th>
                  <th>Residente</th>
                  <th>Cuota</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {residentesEstado.map((r, i) => (
                  <tr key={i}>
                    <td><span className="apto-code">{r.apto}</span></td>
                    <td>{r.nombre || 'Sin asignar'}</td>
                    <td>${r.cuota_base?.toLocaleString('es-CO')}</td>
                    <td style={{ color: 'var(--accent2)', fontWeight: 600 }}>${r.pagado?.toLocaleString('es-CO')}</td>
                    <td style={{ color: r.saldo > 0 ? 'var(--accent4)' : 'var(--text3)', fontWeight: 600 }}>
                      ${r.saldo?.toLocaleString('es-CO')}
                    </td>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        backgroundColor: r.estado === 'Pagado' ? 'var(--accent2)' : 
                                         r.estado === 'Parcial' ? 'var(--accent3)' : 'var(--accent4)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '.9rem',
                      }}>
                        {r.estado === 'Pagado' ? '✓ Al día' : r.estado === 'Parcial' ? '◐ Parcial' : '⚠️ En mora'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}