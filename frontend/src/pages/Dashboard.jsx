import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import BarChart from '../components/ui/BarChart';
import Donut from '../components/ui/Donut';

export default function Dashboard() {
  const navigate = useNavigate();
  const s = useAppStore();
  const { user } = useAuthStore();
  const isResidente = user?.rol === 'residente';

  // Obtener el mes actual en formato YYYY-MM
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const mes = mesActual;

  // Recalcular cuando cambian los datos
  const recaudado = s.getTotalRecaudadoMes(mes);
  const meta      = s.residentes.length * (s.conjunto.cuotaBase || 210000);
  const pct       = meta > 0 ? Math.round((recaudado / meta) * 100) : 0;
  const pendiente = meta - recaudado;
  const pqrAbier  = s.getPQRAbiertos().length;
  const pagados   = s.residentes.filter(r => s.getEstadoPago(r.apto, mes).estado === 'Pagado').length;
  const parciales = s.residentes.filter(r => s.getEstadoPago(r.apto, mes).estado === 'Parcial').length;
  const morosos   = s.residentes.filter(r => s.getEstadoPago(r.apto, mes).estado === 'Pendiente').length;
  const pctPag    = s.residentes.length > 0 ? Math.round((pagados / s.residentes.length) * 100) : 0;
  const ultimos   = s.pagos.slice(0, 5);

  // Generar actividad reciente desde los datos reales
  const getActividadReciente = () => {
    const actividades = [];

    // Últimos pagos
    s.pagos.slice(0, 2).forEach(p => {
      actividades.push({
        icon: '💳',
        bg: 'rgba(16,185,129,.1)',
        color: 'var(--accent2)',
        text: <>Pago registrado – <b>Apto {p.apto}</b> por {s.formatMoney(p.monto)}</>,
        time: s.formatFecha(p.fecha),
        order: new Date(p.fecha).getTime(),
      });
    });

    // Residentes recientes
    s.residentes.slice(0, 2).forEach(r => {
      actividades.push({
        icon: '👤',
        bg: 'rgba(59,130,246,.1)',
        color: 'var(--accent)',
        text: <>Nuevo residente – <b>{r.nombre}</b> Apto {r.apto}</>,
        time: s.formatFecha(r.fecha),
        order: new Date(r.fecha).getTime(),
      });
    });

    // Comunicados recientes
    s.comunicados.slice(0, 2).forEach(c => {
      actividades.push({
        icon: '📢',
        bg: 'rgba(245,158,11,.1)',
        color: 'var(--accent3)',
        text: <>Comunicado – <b>{c.asunto}</b> enviado</>,
        time: c.fecha,
        order: new Date(c.fecha).getTime(),
      });
    });

    // Morosos
    if (morosos > 0) {
      const morosasIds = s.residentes
        .filter(r => s.getEstadoPago(r.apto, mes).estado === 'Pendiente')
        .slice(0, 1);
      
      morosasIds.forEach(r => {
        actividades.push({
          icon: '⚠️',
          bg: 'rgba(239,68,68,.1)',
          color: 'var(--accent4)',
          text: <>Alerta mora – <b>Apto {r.apto}</b> pagos pendientes</>,
          time: 'Hoy',
          order: Date.now(),
        });
      });
    }

    // PQR abiertas
    s.pqr.filter(p => p.estado !== 'Cerrado').slice(0, 1).forEach(pqr => {
      actividades.push({
        icon: '📋',
        bg: 'rgba(59,130,246,.1)',
        color: 'var(--accent)',
        text: <>PQR {pqr.radicado} – <b>{pqr.asunto}</b></>,
        time: s.formatFecha(pqr.fecha),
        order: new Date(pqr.fecha).getTime(),
      });
    });

    // Ordenar por fecha descendente y retornar los últimos 5
    return actividades
      .sort((a, b) => b.order - a.order)
      .slice(0, 5)
      .map(({ order, ...rest }) => rest);
  };

  const actividadReciente = getActividadReciente();

  const badgePago = (estado) => ({
    Pagado:    <span className="badge badge-green">✓ Pagado</span>,
    Parcial:   <span className="badge badge-yellow">⏳ Parcial</span>,
    Pendiente: <span className="badge badge-red">⚠ Pendiente</span>,
  }[estado]);

  // STATS PARA ADMIN
  const STATS_ADMIN = [
    { 
      color: 'blue',   
      label: 'Total Residentes',  
      value: s.residentes.length,     
      sub: `En ${s.conjunto.aptos || 0} apartamentos`, 
      trend: '↑ Activos',              
      tc: 'trend-up' 
    },
    { 
      color: 'green',  
      label: 'Recaudo del Mes',   
      value: s.formatMoney(recaudado), 
      sub: `Meta: ${s.formatMoney(meta)}`,                  
      trend: `${pct}% completado`,     
      tc: pct >= 80 ? 'trend-up' : 'trend-down', 
      pct 
    },
    { 
      color: 'yellow', 
      label: 'Pagos Pendientes',  
      value: s.formatMoney(pendiente), 
      sub: `${morosos + parciales} apartamentos`,             
      trend: morosos > 0 ? `↑ ${morosos} en mora` : 'Sin mora activa', 
      tc: morosos > 0 ? 'trend-down' : 'trend-up' 
    },
    { 
      color: 'red',    
      label: 'PQR Abiertas',      
      value: pqrAbier,                 
      sub: `${s.pqr.filter(p => p.prioridad === 'Alta' && p.estado !== 'Cerrado').length} urgentes`,  
      trend: pqrAbier > 0 ? 'Requieren atención' : 'Todo resuelto', 
      tc: pqrAbier > 0 ? 'trend-down' : 'trend-up' 
    },
  ];

  // STATS PARA RESIDENTE
  const miResidente = s.residentes.find(r => r.apto === user?.apartamento);
  const miEstado = miResidente ? s.getEstadoPago(miResidente.apto, mes) : null;

  const STATS_RESIDENTE = [
    { 
      color: 'blue',   
      label: 'Mi Apartamento',  
      value: miResidente?.apto || 'N/A',     
      sub: `${miResidente?.nombre || 'Sin registrar'}`, 
      trend: '🏠 Tu hogar',              
      tc: 'trend-up' 
    },
    { 
      color: miEstado?.saldo > 0 ? 'red' : 'green',  
      label: miEstado?.saldo > 0 ? 'Saldo Pendiente' : 'Cuota Pagada',   
      value: s.formatMoney(miEstado?.saldo || 0), 
      sub: miEstado?.saldo > 0 ? `Debes de ${s.formatMes(mes)}` : `✓ Al día en ${s.formatMes(mes)}`,                  
      trend: miEstado?.saldo > 0 ? '⚠️ Pagar ahora' : '✓ Sin deuda', 
      tc: miEstado?.saldo > 0 ? 'trend-down' : 'trend-up',
    },
    { 
      color: 'purple',    
      label: 'PQRs Abiertas',      
      value: s.pqr.filter(p => p.estado !== 'Cerrado').length,                 
      sub: `${s.pqr.filter(p => p.prioridad === 'Alta' && p.estado !== 'Cerrado').length} urgentes`,  
      trend: pqrAbier > 0 ? 'En proceso' : 'Sin PQRs', 
      tc: pqrAbier > 0 ? 'trend-down' : 'trend-up' 
    },
  ];

  return (
    <>
      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="stats-grid">
        {(isResidente ? STATS_RESIDENTE : STATS_ADMIN).map(c => (
          <div key={c.label} className={`stat-card ${c.color}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
            <div className={`stat-trend ${c.tc}`}>{c.trend}</div>
            {c.pct !== undefined && (
              <div className="progress-wrap" style={{ marginTop: 8 }}>
                <div 
                  className="progress-bar" 
                  style={{ width: `${c.pct}%`, background: 'var(--accent2)' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SECCIÓN ADMIN */}
      {!isResidente && (
        <>
          <div className="grid-3-1">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recaudo Mensual {hoy.getFullYear()}</span>
                <button className="card-action" onClick={() => navigate('/reportes')}>
                  Ver detalle →
                </button>
              </div>
              <div className="card-body">
                <BarChart data={s.getRecaudoMensual()} />
                <div className="chart-legend">
                  <span>
                    <span 
                      className="chart-legend-dot" 
                      style={{ background: 'var(--accent)' }}
                    />
                    Pagado
                  </span>
                  <span>
                    <span 
                      className="chart-legend-dot" 
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                    />
                    Sin datos
                  </span>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Estado de Pagos</span>
              </div>
              <div className="card-body">
                <Donut pct={pctPag} />
                <div className="payment-legend">
                  {[
                    {
                      color: 'var(--accent2)',
                      label: 'Al día',
                      val: `${pagados} aptos`,
                      vc: 'var(--accent2)',
                    },
                    {
                      color: 'var(--accent3)',
                      label: 'Parcial',
                      val: `${parciales} aptos`,
                      vc: 'var(--accent3)',
                    },
                    {
                      color: 'var(--accent4)',
                      label: 'En mora',
                      val: `${morosos} aptos`,
                      vc: 'var(--accent4)',
                    },
                  ].map(r => (
                    <div key={r.label} className="payment-legend-row">
                      <span>
                        <span 
                          className="legend-dot" 
                          style={{ background: r.color }}
                        />
                        {r.label}
                      </span>
                      <span className="fw-600" style={{ color: r.vc }}>
                        {r.val}
                      </span>
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
                <button className="card-action" onClick={() => navigate('/reportes')}>
                  Ver todos →
                </button>
              </div>
              <div className="table-wrap">
                {ultimos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">💰</div>
                    <div className="empty-state-text">No hay pagos registrados aún.</div>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Apto</th>
                        <th>Residente</th>
                        <th>Monto</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimos.map(p => (
                        <tr key={p.id}>
                          <td>
                            <span className="apto-code">{p.apto}</span>
                          </td>
                          <td>{p.residente}</td>
                          <td style={{ color: 'var(--accent2)', fontWeight: 600 }}>
                            {s.formatMoney(p.monto)}
                          </td>
                          <td className="text-muted">{s.formatFecha(p.fecha)}</td>
                          <td>{badgePago(s.getEstadoPago(p.apto, p.mes).estado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Actividad Reciente</span>
              </div>
              <div className="card-body">
                {actividadReciente.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div className="empty-state-text">Sin actividad registrada.</div>
                  </div>
                ) : (
                  actividadReciente.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div 
                        className="act-icon" 
                        style={{ background: a.bg, color: a.color }}
                      >
                        {a.icon}
                      </div>
                      <div>
                        <div className="act-text">{a.text}</div>
                        <div className="act-time">{a.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECCIÓN RESIDENTE */}
      {isResidente && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Mis Transacciones Recientes</span>
              <button className="card-action" onClick={() => navigate('/cuotas')}>
                Ver más →
              </button>
            </div>
            <div className="table-wrap">
              {ultimos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <div className="empty-state-text">Sin pagos registrados.</div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Monto</th>
                      <th>Fecha</th>
                      <th>Medio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimos.map(p => (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--accent2)', fontWeight: 600 }}>
                          {s.formatMoney(p.monto)}
                        </td>
                        <td className="text-muted">{s.formatFecha(p.fecha)}</td>
                        <td>{p.medio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Actividad Reciente</span>
            </div>
            <div className="card-body">
              {actividadReciente.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-text">Sin actividad registrada.</div>
                </div>
              ) : (
                actividadReciente.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div 
                      className="act-icon" 
                      style={{ background: a.bg, color: a.color }}
                    >
                      {a.icon}
                    </div>
                    <div>
                      <div className="act-text">{a.text}</div>
                      <div className="act-time">{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}