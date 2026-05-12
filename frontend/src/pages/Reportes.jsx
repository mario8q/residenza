import useAppStore from '../store/appStore';
import BarChart from '../components/ui/BarChart';
import { useToast } from '../components/ui/Toast';
import { generarRecibo, exportarCSV } from '../utils/pdf';

export default function Reportes() {
  const s     = useAppStore();
  const toast = useToast();
  const mes   = '2025-02';
  const recaudo   = s.getTotalRecaudadoMes(mes);
  const meta      = s.residentes.length * s.conjunto.cuotaBase;
  const pendiente = meta - recaudo;
  const pctRec  = meta>0?Math.round((recaudo/meta)*100):0;
  const pctPend = meta>0?Math.round((pendiente/meta)*100):0;

  const doExport = () => { exportarCSV(s.pagos, s.formatMes); toast.success('Reporte exportado como CSV.'); };

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Recaudo por Mes – 2025</span></div>
          <div className="card-body">
            <BarChart data={s.getRecaudoMensual()} color="var(--accent2)"/>
            <div className="chart-legend">
              <span><span className="chart-legend-dot" style={{background:'var(--accent2)'}}/>Recaudado</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Resumen de Cartera – {s.formatMes(mes)}</span></div>
          <div className="card-body">
            {[
              {label:`Al día (${pctRec}%)`,     val:s.formatMoney(recaudo),   pct:pctRec,  color:'var(--accent2)'},
              {label:`Pendiente (${pctPend}%)`, val:s.formatMoney(pendiente), pct:pctPend, color:'var(--accent3)'},
            ].map(r=>(
              <div key={r.label} style={{marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.82rem',marginBottom:6}}>
                  <span>{r.label}</span>
                  <span style={{fontWeight:600,color:r.color}}>{r.val}</span>
                </div>
                <div className="progress-wrap"><div className="progress-bar" style={{width:`${r.pct}%`,background:r.color}}/></div>
              </div>
            ))}
            <div style={{marginTop:24}}>
              <button className="btn btn-primary" onClick={doExport}>📥 Exportar CSV</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Historial de Pagos</span>
          <button className="card-action" onClick={doExport}>Exportar →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Apartamento</th><th>Residente</th><th>Concepto</th><th>Monto</th><th>Medio</th><th>Recibo</th><th></th></tr></thead>
            <tbody>
              {s.pagos.map(p=>(
                <tr key={p.id}>
                  <td className="text-muted">{s.formatFecha(p.fecha)}</td>
                  <td><span className="apto-code">{p.apto}</span></td>
                  <td>{p.residente}</td>
                  <td style={{fontSize:'.8rem',color:'var(--text2)'}}>Cuota admin. {s.formatMes(p.mes)}</td>
                  <td style={{color:'var(--accent2)',fontWeight:600}}>{s.formatMoney(p.monto)}</td>
                  <td className="text-muted">{p.medio}</td>
                  <td><span className="badge badge-green">{p.recibo}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{
                      const pago=s.pagos.find(x=>x.id===p.id);
                      if(pago) generarRecibo(pago, s.formatFecha, s.formatMes);
                    }}>🧾</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
