import { useState } from 'react';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const TABS  = ['Todos','Abierto','En proceso','Cerrado'];
const EMPTY = { apto:'', tipo:'Petición', asunto:'', prioridad:'Baja', descripcion:'' };

export default function PQR() {
  const s      = useAppStore();
  const toast  = useToast();
  const { user } = useAuthStore();
  const isResidente = user?.rol === 'residente';
  
  const [tab,    setTab]    = useState('Todos');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  // Filtrar PQRs según si es residente
  const pqrFiltered = isResidente
    ? s.pqr.filter(p => p.apto === user?.apartamento)
    : s.pqr;

  const lista = pqrFiltered.filter(p=>tab==='Todos'||p.estado===tab);

  const openModal = () => {
    setForm({
      ...EMPTY, 
      apto: isResidente ? user?.apartamento : (s.residentes[0]?.apto||'')
    });
    setErrors({}); 
    setModal(true);
  };

  const save = () => {
    const e={};
    if (!form.asunto.trim()) e.asunto='Requerido';
    setErrors(e); 
    if (Object.keys(e).length>0) return;
    const nuevo = s.addPQR(form);
    toast.success(`PQR radicada como ${nuevo.radicado}`);
    setModal(false);
  };

  const cambiar = (id, estado) => {
    if (isResidente) return; // Los residentes no pueden cambiar estados
    s.updatePQREstado(id, estado);
    toast.info({ 'En proceso':'Marcada como En proceso.', 'Cerrado':'PQR cerrada.', 'Abierto':'PQR reabierta.' }[estado]);
  };

  const TIPO_B  = { Queja:'badge-red', Petición:'badge-blue', Reclamo:'badge-yellow' };
  const PRIO_B  = { Alta:'badge-red', Media:'badge-yellow', Baja:'badge-green' };
  const EST_B   = { Abierto:'badge-red', 'En proceso':'badge-yellow', Cerrado:'badge-green' };

  return (
    <>
      <div className="tabs">
        {TABS.map(t=><button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {isResidente ? 'Mis PQRs' : 'Peticiones, Quejas y Reclamos'} 
            <span style={{fontSize:'.78rem',color:'var(--text3)',fontWeight:400}}>({lista.length})</span>
          </span>
          <button className="btn btn-primary btn-sm" onClick={openModal}>+ Nueva PQR</button>
        </div>
        <div className="table-wrap">
          {lista.length===0
            ? <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No hay PQR en esta categoría.</div></div>
            : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    {!isResidente && <th>Apto</th>}
                    <th>Tipo</th>
                    <th>Asunto</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    {!isResidente && <th>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {lista.map(p=>(
                    <tr key={p.id}>
                      <td style={{fontFamily:'var(--font-mono)',color:'var(--text3)'}}>{p.radicado}</td>
                      <td className="text-muted">{s.formatFecha(p.fecha)}</td>
                      {!isResidente && <td><span className="apto-code">{p.apto}</span></td>}
                      <td><span className={`badge ${TIPO_B[p.tipo]}`}>{p.tipo}</span></td>
                      <td style={{maxWidth:220,fontSize:'.82rem'}}>{p.asunto}</td>
                      <td><span className={`badge ${PRIO_B[p.prioridad]}`}>{p.prioridad}</span></td>
                      <td><span className={`badge ${EST_B[p.estado]}`}>{p.estado}</span></td>
                      {!isResidente && (
                        <td>
                          {p.estado==='Abierto'    && <button className="btn btn-primary btn-sm" onClick={()=>cambiar(p.id,'En proceso')}>Atender</button>}
                          {p.estado==='En proceso' && <button className="btn btn-ghost btn-sm"   onClick={()=>cambiar(p.id,'Cerrado')}>✓ Cerrar</button>}
                          {p.estado==='Cerrado'    && <button className="btn btn-ghost btn-sm"   onClick={()=>cambiar(p.id,'Abierto')}>↩ Reabrir</button>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="📋 Radicar PQR">
        <div className="form-row">
          {!isResidente && (
            <div className="form-group">
              <label className="form-label">Apartamento *</label>
              <select className="form-input" value={form.apto} onChange={e=>setForm(p=>({...p,apto:e.target.value}))}>
                {s.residentes.map(r=><option key={r.id} value={r.apto}>{r.apto} – {r.nombre}</option>)}
              </select>
            </div>
          )}

          {isResidente && (
            <div className="form-group">
              <label className="form-label">Tu Apartamento</label>
              <div style={{ padding: '10px', background: '#000e23', borderRadius: '6px' }}>
                {user?.apartamento}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}>
              <option>Petición</option><option>Queja</option><option>Reclamo</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Asunto *</label>
            <input className={`form-input${errors.asunto?' error':''}`} value={form.asunto} onChange={e=>setForm(p=>({...p,asunto:e.target.value}))} placeholder="Resumen de la solicitud"/>
            {errors.asunto&&<span className="form-error">{errors.asunto}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select className="form-input" value={form.prioridad} onChange={e=>setForm(p=>({...p,prioridad:e.target.value}))}>
              <option>Baja</option><option>Media</option><option>Alta</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea className="form-input" rows={3} value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))} placeholder="Descripción detallada..."/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Radicar PQR</button>
        </div>
      </Modal>
    </>
  );
}