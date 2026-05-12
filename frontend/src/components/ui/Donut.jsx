export default function Donut({ pct, color='var(--accent2)', colorRest='var(--accent4)' }) {
  const total=301; const dash1=Math.round((pct/100)*total);
  return (
    <div style={{textAlign:'center',padding:'10px 0'}}>
      <div className="donut-container">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface2)" strokeWidth="14"/>
          <circle cx="60" cy="60" r="48" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={total} strokeDashoffset={total-dash1}
            strokeLinecap="round" transform="rotate(-90 60 60)"/>
          <circle cx="60" cy="60" r="48" fill="none" stroke={colorRest} strokeWidth="14"
            strokeDasharray={total} strokeDashoffset={total-(total-dash1)}
            strokeLinecap="round" transform="rotate(-90 60 60)" opacity="0.7"/>
        </svg>
        <div className="donut-label">
          <div style={{fontFamily:'var(--font-display)',fontSize:'1.4rem',fontWeight:700}}>{pct}%</div>
          <div style={{fontSize:'.65rem',color:'var(--text3)'}}>al día</div>
        </div>
      </div>
    </div>
  );
}
