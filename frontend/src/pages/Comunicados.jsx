import { useState } from 'react';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const EMPTY = { asunto:'', mensaje:'', destinatarios:'General', prioridad:'Normal' };

export default function Comunicados() {
  const s     = useAppStore();
  const toast = useToast();
  const { user } = useAuthStore();
  const isResidente = user?.rol === 'residente';
  
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const lista      = s.comunicados;
  const mesActual  = lista.filter(c=>c.fecha.startsWith('2025-02')).length;
  const avgAp      = lista.length>0 ? Math.round(lista.reduce((acc,c)=>acc+(c.enviados>0?c.lecturas/c.enviados:0),0)/lista.length*100) : 0;

  const validate = () => {
    const e={};
    if (!form.asunto.trim())  e.asunto='Requerido';
    if (!form.mensaje.trim()) e.mensaje='Requerido';
    setErrors(e); 
    return Object.keys(e).length===0;
  };

  const save = () => {
    if (!validate()) return;
    s.addComunicado(form);
    toast.success(`Comunicado "${form.asunto}" enviado.`);
    setForm(EMPTY); 
    setModal(false);
  };

  const DEST_BADGE = { General:'badge-blue','Torre A':'badge-yellow','Torre B':'badge-yellow', Propietarios:'badge-green', Arrendatarios:'badge-green' };

  return (
    <>
      {!isResidente ? (
        // Vista de Admin
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Comunicados Enviados ({lista.length})</span>
              <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY);setErrors({});setModal(true);}}>+ Nuevo</button>
            </div>
            <div className="card-body">
              {lista.length===0
                ? <div className="empty-state"><div className="empty-state-icon">📢</div><div className="empty-state-text">No hay comunicados aún.</div></div>
                : lista.map(c=>(
                    <div key={c.id} className="comunicado-item">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                            <div className="com-title">
                              {c.prioridad!=='Urgente'&&<span className="com-dot"/>}{c.asunto}
                            </div>
                            <span className={`badge ${c.prioridad==='Urgente'?'badge-red':DEST_BADGE[c.destinatarios]||'badge-blue'}`}>
                              {c.prioridad==='Urgente'?'Urgente':c.destinatarios}
                            </span>
                          </div>
                          <div className="com-meta">📅 {c.fecha} · 👁 {c.lecturas} visualizaciones · ✉ {c.enviados} enviados</div>
                          <div style={{fontSize:'.78rem',color:'var(--text3)',marginTop:6}}>{c.mensaje.slice(0,100)}{c.mensaje.length>100?'...':''}</div>
                        </div>
                        {!isResidente && (
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{marginLeft:10,flexShrink:0}}
                            onClick={() => {
                              if(confirm('¿Eliminar este comunicado?')) {
                                s.deleteComunicado(c.id);
                                toast.info('Comunicado eliminado');
                              }
                            }}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Estadísticas</span></div>
            <div className="card-body">
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div className="stats-box">
                  <div><div style={{fontSize:'.72rem',color:'var(--text3)'}}>Total Enviados</div><div className="stats-box-val" style={{color:'var(--accent)'}}>{lista.length}</div></div>
                  <div><div style={{fontSize:'.72rem',color:'var(--text3)'}}>Este mes</div><div className="stats-box-val" style={{color:'var(--accent2)'}}>{mesActual}</div></div>
                </div>
                <div>
                  <div style={{fontSize:'.8rem',color:'var(--text2)',marginBottom:6}}>Tasa de apertura promedio</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',color:'var(--accent3)',marginBottom:4}}>{avgAp}%</div>
                  <div className="progress-wrap"><div className="progress-bar" style={{width:`${avgAp}%`,background:'var(--accent3)'}}/></div>
                </div>
                <div>
                  <div style={{fontSize:'.8rem',color:'var(--text2)',marginBottom:10}}>Por tipo</div>
                  {[
                    {label:'📢 General',  badge:'badge-blue',   count:lista.filter(c=>c.destinatarios==='General').length},
                    {label:'🏢 Por torre', badge:'badge-yellow', count:lista.filter(c=>c.destinatarios.startsWith('Torre')).length},
                    {label:'🚨 Urgente',  badge:'badge-red',    count:lista.filter(c=>c.prioridad==='Urgente').length},
                  ].map(r=>(
                    <div key={r.label} style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',marginBottom:8}}>
                      <span>{r.label}</span><span className={`badge ${r.badge}`}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Vista de Residente (solo lectura)
        <div className="card">
          <div className="card-header">
            <span className="card-title">Comunicados ({lista.length})</span>
          </div>
          <div className="card-body">
            {lista.length===0
              ? <div className="empty-state"><div className="empty-state-icon">📢</div><div className="empty-state-text">No hay comunicados aún.</div></div>
              : lista.map(c=>(
                  <div key={c.id} className="comunicado-item">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <div className="com-title">
                            {c.prioridad!=='Urgente'&&<span className="com-dot"/>}{c.asunto}
                          </div>
                          <span className={`badge ${c.prioridad==='Urgente'?'badge-red':DEST_BADGE[c.destinatarios]||'badge-blue'}`}>
                            {c.prioridad==='Urgente'?'Urgente':c.destinatarios}
                          </span>
                        </div>
                        <div className="com-meta">📅 {c.fecha} · 👁 {c.lecturas} visualizaciones · ✉ {c.enviados} enviados</div>
                        <div style={{fontSize:'.78rem',color:'var(--text3)',marginTop:6}}>{c.mensaje.slice(0,100)}{c.mensaje.length>100?'...':''}</div>
                      </div>
                      {!isResidente && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{marginLeft:10,flexShrink:0}}
                          onClick={() => {
                            if(confirm('¿Eliminar este comunicado?')) {
                              s.deleteComunicado(c.id);
                              toast.info('Comunicado eliminado');
                            }
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {!isResidente && (
        <Modal open={modal} onClose={()=>setModal(false)} title="📢 Nuevo Comunicado">
          <div className="form-group">
            <label className="form-label">Asunto *</label>
            <input className={`form-input${errors.asunto?' error':''}`} value={form.asunto} onChange={e=>setForm(p=>({...p,asunto:e.target.value}))} placeholder="Título del comunicado"/>
            {errors.asunto&&<span className="form-error">{errors.asunto}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Destinatarios</label>
              <select className="form-input" value={form.destinatarios} onChange={e=>setForm(p=>({...p,destinatarios:e.target.value}))}>
                <option>General</option><option>Torre A</option><option>Torre B</option><option>Propietarios</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select className="form-input" value={form.prioridad} onChange={e=>setForm(p=>({...p,prioridad:e.target.value}))}>
                <option>Normal</option><option>Urgente</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mensaje *</label>
            <textarea className={`form-input${errors.mensaje?' error':''}`} rows={4} value={form.mensaje} onChange={e=>setForm(p=>({...p,mensaje:e.target.value}))} placeholder="Escriba el comunicado aquí..."/>
            {errors.mensaje&&<span className="form-error">{errors.mensaje}</span>}
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save}>📤 Enviar Comunicado</button>
          </div>
        </Modal>
      )}
    </>
  );
}