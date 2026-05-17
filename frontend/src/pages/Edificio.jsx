import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export default function Edificio() {
  const token = useAuthStore(s => s.token);
  const toast = useToast();
  
  const [torres, setTorres] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [tab, setTab] = useState('torres'); // 'torres' o 'apartamentos'
  
  // Modal Torres
  const [modalTorre, setModalTorre] = useState(false);
  const [formTorre, setFormTorre] = useState({ nombre: '', num_pisos: 1 });
  
  // Modal Apartamentos
  const [modalApto, setModalApto] = useState(false);
  const [formApto, setFormApto] = useState({ torre_id: '', numero: '', piso: 1, area_m2: '' });
  const [errors, setErrors] = useState({});

  // Cargar datos
  useEffect(() => {
    cargarTorres();
    cargarApartamentos();
  }, []);

  const cargarTorres = async () => {
    try {
      const res = await fetch('/api/apartamentos/torres', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setTorres(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error cargando torres.');
    }
  };

  const cargarApartamentos = async () => {
    try {
      const res = await fetch('/api/apartamentos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setApartamentos(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error cargando apartamentos.');
    }
  };

  const crearTorre = async () => {
    if (!formTorre.nombre.trim()) {
      setErrors({ nombre: 'Nombre requerido' });
      return;
    }
    try {
      const res = await fetch('/api/apartamentos/torres', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formTorre),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        setModalTorre(false);
        setFormTorre({ nombre: '', num_pisos: 1 });
        cargarTorres();
      } else {
        toast.error(json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creando torre.');
    }
  };

  const eliminarTorre = async (id) => {
    if (!confirm('¿Eliminar esta torre?')) return;
    try {
      const res = await fetch(`/api/apartamentos/torres/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        cargarTorres();
        cargarApartamentos();
      } else {
        toast.error(json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error eliminando torre.');
    }
  };

  const crearApartamento = async () => {
    const e = {};
    if (!formApto.torre_id) e.torre_id = 'Selecciona una torre';
    if (!formApto.numero) e.numero = 'Número requerido';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      const res = await fetch('/api/apartamentos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formApto,
          torre_id: parseInt(formApto.torre_id),
          piso: parseInt(formApto.piso),
          area_m2: formApto.area_m2 ? parseFloat(formApto.area_m2) : null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        setModalApto(false);
        setFormApto({ torre_id: '', numero: '', piso: 1, area_m2: '' });
        cargarApartamentos();
      } else {
        toast.error(json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creando apartamento.');
    }
  };

  const eliminarApartamento = async (id) => {
    if (!confirm('¿Eliminar este apartamento?')) return;
    try {
      const res = await fetch(`/api/apartamentos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        cargarApartamentos();
      } else {
        toast.error(json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error eliminando apartamento.');
    }
  };

  return (
    <>
      <div className="tabs">
        <button className={`tab${tab === 'torres' ? ' active' : ''}`} onClick={() => setTab('torres')}>
          🏢 Torres
        </button>
        <button className={`tab${tab === 'apartamentos' ? ' active' : ''}`} onClick={() => setTab('apartamentos')}>
          🚪 Apartamentos
        </button>
      </div>

      {tab === 'torres' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Gestión de Torres ({torres.length})</span>
            <button className="btn btn-primary" onClick={() => setModalTorre(true)}>
              + Nueva Torre
            </button>
          </div>
          {torres.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-text">No hay torres creadas aún.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Pisos</th>
                    <th>Creada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {torres.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.nombre}</strong></td>
                      <td>{t.num_pisos}</td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => eliminarTorre(t.id)}
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'apartamentos' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Gestión de Apartamentos ({apartamentos.length})</span>
            <button className="btn btn-primary" onClick={() => setModalApto(true)}>
              + Nuevo Apartamento
            </button>
          </div>
          {apartamentos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚪</div>
              <div className="empty-state-text">No hay apartamentos creados aún.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Torre</th>
                    <th>Piso</th>
                    <th>Área (m²)</th>
                    <th>Residente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {apartamentos.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.codigo}</strong></td>
                      <td>{a.torre}</td>
                      <td>{a.piso}</td>
                      <td>{a.area_m2 || '—'}</td>
                      <td>{a.tiene_residente ? '✅ Ocupado' : '⭕ Libre'}</td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => eliminarApartamento(a.id)}
                          disabled={a.tiene_residente}
                          title={a.tiene_residente ? 'No se puede eliminar si tiene residente' : ''}
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Torres */}
      {modalTorre && (
        <Modal onClose={() => setModalTorre(false)}>
          <div style={{ maxWidth: '400px' }}>
            <h3>Nueva Torre</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Nombre (A, B, C...):
                </label>
                <input
                  type="text"
                  className={`form-input${errors.nombre ? ' error' : ''}`}
                  maxLength="10"
                  value={formTorre.nombre}
                  onChange={e => {
                    setFormTorre(p => ({ ...p, nombre: e.target.value.toUpperCase() }));
                    setErrors({});
                  }}
                  placeholder="Ej: A"
                />
                {errors.nombre && <div style={{ fontSize: '0.85rem', color: 'var(--red)' }}>{errors.nombre}</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Número de pisos:
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={formTorre.num_pisos}
                  onChange={e => setFormTorre(p => ({ ...p, num_pisos: parseInt(e.target.value) }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={crearTorre}>
                  Crear Torre
                </button>
                <button className="btn btn-ghost" onClick={() => setModalTorre(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Apartamentos */}
      {modalApto && (
        <Modal onClose={() => setModalApto(false)}>
          <div style={{ maxWidth: '400px' }}>
            <h3>Nuevo Apartamento</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Torre:
                </label>
                <select
                  className={`form-input${errors.torre_id ? ' error' : ''}`}
                  value={formApto.torre_id}
                  onChange={e => {
                    setFormApto(p => ({ ...p, torre_id: e.target.value }));
                    setErrors({});
                  }}
                >
                  <option value="">Selecciona una torre</option>
                  {torres.map(t => (
                    <option key={t.id} value={t.id}>
                      Torre {t.nombre}
                    </option>
                  ))}
                </select>
                {errors.torre_id && <div style={{ fontSize: '0.85rem', color: 'var(--red)' }}>{errors.torre_id}</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Piso:
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={formApto.piso}
                  onChange={e => setFormApto(p => ({ ...p, piso: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Número (01, 02, 03...):
                </label>
                <input
                  type="text"
                  className={`form-input${errors.numero ? ' error' : ''}`}
                  maxLength="3"
                  value={formApto.numero}
                  onChange={e => {
                    setFormApto(p => ({ ...p, numero: e.target.value }));
                    setErrors({});
                  }}
                  placeholder="Ej: 01"
                />
                {errors.numero && <div style={{ fontSize: '0.85rem', color: 'var(--red)' }}>{errors.numero}</div>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Área (m²) - Opcional:
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formApto.area_m2}
                  onChange={e => setFormApto(p => ({ ...p, area_m2: e.target.value }))}
                  placeholder="Ej: 65.50"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={crearApartamento}>
                  Crear Apartamento
                </button>
                <button className="btn btn-ghost" onClick={() => setModalApto(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}