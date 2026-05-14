import { useState } from 'react';
import useAppStore from '../store/appStore';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const TABS  = ['Todos','Propietarios','Arrendatarios','Morosos'];
const EMPTY = { nombre:'', apto:'', tipo:'Propietario', cedula:'', telefono:'', email:'', fecha:'' };

export default function Residentes() {
  const s      = useAppStore();
  const toast  = useToast();
  const [tab,    setTab]    = useState('Todos');
  const [q,      setQ]      = useState('');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const morososIds = s.getMorosos().map(r=>r.id);

  const lista = s.residentes.filter(r => {
    const mt = tab==='Todos'||(tab==='Propietarios'&&r.tipo==='Propietario')||(tab==='Arrendatarios'&&r.tipo==='Arrendatario')||(tab==='Morosos'&&morososIds.includes(r.id));
    const mq = !q||r.nombre.toLowerCase().includes(q.toLowerCase())||r.apto.toLowerCase().includes(q.toLowerCase())||r.email.toLowerCase().includes(q.toLowerCase());
    return mt && mq;
  });

  const openNew  = () => { setForm(EMPTY); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (r) => { setForm({...r}); setEditId(r.id); setErrors({}); setModal(true); };

  const validate = () => {
    const e={};
    if (!form.nombre)   e.nombre='Requerido';
    if (!form.apto)     e.apto='Requerido';
    if (!form.cedula)   e.cedula='Requerido';
    if (!form.telefono) e.telefono='Requerido';
    if (!form.email)    e.email='Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email='Correo inválido';
    setErrors(e); return Object.keys(e).length===0;
  };

  const save = () => {
    if (!validate()) return;
    if (editId) { s.updateResidente(editId, form); toast.success('Residente actualizado.'); }
    else        { s.addResidente(form); toast.success(`${form.nombre} registrado.`); }
    setModal(false);
  };

  const del = (r) => {
    if (!confirm(`¿Eliminar a ${r.nombre}?`)) return;
    s.deleteResidente(r.id); toast.info(`${r.nombre} eliminado.`);
  };

  const f = (field) => ({
    className: `form-input${errors[field]?' error':''}`,
    value: form[field]||'',
    onChange: e => setForm(p=>({...p,[field]:e.target.value})),
  });

  const EST_BADGE  = { Pagado:'badge-green', Parcial:'badge-yellow', Pendiente:'badge-red' };
  const TIPO_BADGE = { Propietario:'badge-blue', Arrendatario:'badge-yellow' };

  return (
    <>
      <div className="tabs">
        {TABS.map(t=><button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Lista de Residentes <span style={{fontSize:'.78rem',color:'var(--text3)',fontWeight:400}}>({lista.length})</span></span>
          <div style={{display:'flex',gap:10}}>
            <input className="search-input" placeholder="🔍 Buscar..." value={q} onChange={e=>setQ(e.target.value)}/>
            <button className="btn btn-primary" onClick={openNew}>+ Nuevo Residente</button>
          </div>
        </div>
        <div className="table-wrap">
          {lista.length===0
            ? <div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">No se encontraron residentes.</div></div>
            : (
              <table>
                <thead><tr><th>Apartamento</th><th>Residente</th><th>Tipo</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {lista.map(r=>{
                    const e=s.getEstadoPago(r.apto,'2025-02');
                    return (
                      <tr key={r.id}>
                        <td><span className="apto-code">{r.apto}</span></td>
                        <td><div style={{display:'flex',alignItems:'center',gap:8}}><div className="res-avatar-sm" style={{background:r.color}}>{r.initials}</div>{r.nombre}</div></td>
                        <td><span className={`badge ${TIPO_BADGE[r.tipo]}`}>{r.tipo}</span></td>
                        <td style={{fontFamily:'var(--font-mono)',fontSize:'.78rem',color:'var(--text2)'}}>{r.telefono}</td>
                        <td style={{fontSize:'.78rem',color:'var(--text2)'}}>{r.email}</td>
                        <td><span className={`badge ${EST_BADGE[e.estado]}`}>{e.estado}</span></td>
                        <td><div className="row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(r)}>✏️ Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>del(r)}>🗑</button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editId?'✏️ Editar Residente':'➕ Registrar Nuevo Residente'}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input {...f('nombre')} placeholder="Ej: Juan Pérez"/>
            {errors.nombre && <span className="form-error">{errors.nombre}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Apartamento *</label>
            <select className={`form-input${errors.apto?' error':''}`} value={form.apto||''} onChange={e => setForm(p=>({...p,apto:e.target.value}))}>
              <option value="">Seleccionar apartamento...</option>
              {s.apartamentosDisponibles.map(a => (
                <option key={a.id} value={a.codigo}>{a.codigo} {a.torre_nombre && `(${a.torre_nombre})`}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-input" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}>
              <option>Propietario</option><option>Arrendatario</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cédula *</label>
            <input {...f('cedula')} placeholder="Número de documento"/>
            {errors.cedula && <span className="form-error">{errors.cedula}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Teléfono *</label>
            <input {...f('telefono')} placeholder="300-555-0000"/>
            {errors.telefono && <span className="form-error">{errors.telefono}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Correo *</label>
            <input {...f('email')} type="email" placeholder="correo@ejemplo.com"/>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de ingreso</label>
          <input className="form-input" type="date" value={form.fecha||''} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Guardar Residente</button>
        </div>
      </Modal>
    </>
  );
}
