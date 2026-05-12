import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import BarChart from '../components/ui/BarChart';
import Donut from '../components/ui/Donut';

export default function Dashboard() {
  const navigate = useNavigate();
  const s = useAppStore();
  const mes = '2025-02';
  const recaudado = s.getTotalRecaudadoMes(mes);
  const meta      = s.residentes.length * s.conjunto.cuotaBase;
  const pct       = meta>0 ? Math.round((recaudado/meta)*100) : 0;
  const pendiente = meta - recaudado;
  const pqrAbier  = s.getPQRAbiertos().length;
  const pagados   = s.residentes.filter(r=>s.getEstadoPago(r.apto,mes).estado==='Pagado').length;
  const parciales = s.residentes.filter(r=>s.getEstadoPago(r.apto,mes).estado==='Parcial').length;
  const morosos   = s.residentes.filter(r=>s.getEstadoPago(r.apto,mes).estado==='Pendiente').length;
  const pctPag    = s.residentes.length>0 ? Math.round((pagados/s.residentes.length)*100) : 0;
  const ultimos   = s.pagos.slice(0,5);

  const badgePago = (estado) => ({
    Pagado:    <span className="badge badge-green">✓ Pagado</span>,
    Parcial:   <span className="badge badge-yellow">⏳ Parcial</span>,
    Pendiente: <span className="badge badge-red">⚠ Pendiente</span>,
  }[estado]);

  const STATS = [
    { color:'blue',   label:'Total Residentes',  value:s.residentes.length,     sub:`En ${s.conjunto.aptosPorTorre*2} apartamentos`, trend:'↑ Activos',              tc:'trend-up' },
    { color:'green',  label:'Recaudo del Mes',   value:s.formatMoney(recaudado), sub:`Meta: ${s.formatMoney(meta)}`,                  trend:`${pct}% completado`,     tc:pct>=80?'trend-up':'trend-down', pct },
    { color:'yellow', label:'Pagos Pendientes',  value:s.formatMoney(pendiente), sub:`${morosos+parciales} apartamentos`,             trend:morosos>0?`↑ ${morosos} en mora`:'Sin mora activa', tc:morosos>0?'trend-down':'trend-up' },
    { color:'red',    label:'PQR Abiertas',      value:pqrAbier,                 sub:`${s.pqr.filter(p=>p.prioridad==='Alta'&&p.estado!=='Cerrado').length} urgentes`,  trend:pqrAbier>0?'Requieren atención':'Todo resuelto', tc:pqrAbier>0?'trend-down':'trend-up' },
  ];

  return (
    <>
      <div className="stats-grid">
        {STATS.map(c=>(
          <div key={c.label} className={`stat-card ${c.color}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
            <div className={`stat-trend ${c.tc}`}>{c.trend}</div>
            {c.pct!==undefined && <div className="progress-wrap" style={{marginTop:8}}><div className="progress-bar" style={{width:`${c.pct}%`,background:'var(--accent2)'}}/></div>}
          </div>
        ))}
      </div>

      <div className="grid-3-1">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recaudo Mensual 2025</span>
            <button className="card-action" onClick={()=>navigate('/reportes')}>Ver detalle →</button>
          </div>
          <div className="card-body">
            <BarChart data={s.getRecaudoMensual()}/>
            <div className="chart-legend">
              <span><span className="chart-legend-dot" style={{background:'var(--accent)'}}/>Pagado</span>
              <span><span className="chart-legend-dot" style={{background:'var(--surface2)',border:'1px solid var(--border)'}}/>Sin datos</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Estado de Pagos</span></div>
          <div className="card-body">
            <Donut pct={pctPag}/>
            <div className="payment-legend">
              {[
                {color:'var(--accent2)',label:'Al día',    val:`${pagados} aptos`,            vc:'var(--accent2)'},
                {color:'var(--accent3)',label:'Pendiente', val:`${parciales+morosos} aptos`,  vc:'var(--accent3)'},
                {color:'var(--accent4)',label:'En mora',   val:`${morosos} aptos`,            vc:'var(--accent4)'},
              ].map(r=>(
                <div key={r.label} className="payment-legend-row">
                  <span><span className="legend-dot" style={{background:r.color}}/>{r.label}</span>
                  <span className="fw-600" style={{color:r.vc}}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Últimos Pagos</span>
            <button className="card-action" onClick={()=>navigate('/reportes')}>Ver todos →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Apto</th><th>Residente</th><th>Monto</th><th>Fecha</th><th>Estado</th></tr></thead>
              <tbody>
                {ultimos.map(p=>(
                  <tr key={p.id}>
                    <td><span className="apto-code">{p.apto}</span></td>
                    <td>{p.residente}</td>
                    <td style={{color:'var(--accent2)',fontWeight:600}}>{s.formatMoney(p.monto)}</td>
                    <td className="text-muted">{s.formatFecha(p.fecha)}</td>
                    <td>{badgePago(s.getEstadoPago(p.apto,p.mes).estado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Actividad Reciente</span></div>
          <div className="card-body">
            {[
              {icon:'💳',bg:'rgba(16,185,129,.1)',color:'var(--accent2)',text:<>Pago registrado – <b>Apto A-101</b> por {s.formatMoney(210000)}</>,time:'Hace 2 horas'},
              {icon:'👤',bg:'rgba(59,130,246,.1)', color:'var(--accent)', text:<>Nuevo residente – <b>Pedro Vargas</b> Apto B-201</>,             time:'Hace 5 horas'},
              {icon:'📢',bg:'rgba(245,158,11,.1)', color:'var(--accent3)',text:<>Comunicado – <b>Asamblea ordinaria</b> enviado</>,               time:'Ayer, 3:00 PM'},
              {icon:'⚠️',bg:'rgba(239,68,68,.1)',  color:'var(--accent4)',text:<>Alerta mora – <b>Apto B-305</b> 3 meses sin pago</>,             time:'Ayer, 10:00 AM'},
              {icon:'📋',bg:'rgba(59,130,246,.1)', color:'var(--accent)', text:<>PQR recibida – Daño en ascensor Torre B</>,                     time:'Hace 2 días'},
            ].map((a,i)=>(
              <div key={i} className="activity-item">
                <div className="act-icon" style={{background:a.bg,color:a.color}}>{a.icon}</div>
                <div><div className="act-text">{a.text}</div><div className="act-time">{a.time}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
