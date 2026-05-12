export default function BarChart({ data, color='var(--accent)' }) {
  return (
    <div className="bar-chart">
      {data.map(({label,total,pct})=>(
        <div className="bar-col" key={label} title={`${label}: $${total.toLocaleString('es-CO')}`}>
          <div className="bar" style={{height:`${Math.max(pct,0)}%`,background:total>0?color:'var(--surface2)',border:total>0?'none':'1px solid var(--border)'}}/>
          <div className="bar-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
