import jsPDF from 'jspdf';

export function generarRecibo(pago, formatFecha, formatMes) {
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const azul=[27,58,107], gris=[100,116,139], negro=[55,65,81], verde=[16,185,129];
  doc.setFillColor(...azul); doc.rect(0,0,210,40,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont('helvetica','bold');
  doc.text('ResidenciasPro',20,18);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('Conjunto Bello Horizonte · Torre A y B',20,26);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text(pago.recibo,190,20,{align:'right'});
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('Recibo de Pago',190,27,{align:'right'});
  doc.setTextColor(...negro); doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('RECIBO DE PAGO',105,56,{align:'center'});
  doc.setDrawColor(...azul); doc.setLineWidth(0.5); doc.line(20,60,190,60);
  let y=70;
  const row=(label,value)=>{
    doc.setTextColor(...gris); doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(label,20,y); doc.setTextColor(...negro); doc.setFont('helvetica','bold');
    doc.text(String(value),75,y); y+=8;
  };
  row('Apartamento:',pago.apto); row('Residente:',pago.residente);
  row('Período:',formatMes(pago.mes)); row('Fecha Pago:',formatFecha(pago.fecha));
  row('Medio:',pago.medio); if(pago.ref) row('Referencia:',pago.ref);
  y+=6; doc.setFillColor(239,246,255); doc.roundedRect(20,y,170,22,3,3,'F');
  doc.setTextColor(...gris); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text('TOTAL PAGADO',105,y+7,{align:'center'});
  doc.setTextColor(...verde); doc.setFontSize(18); doc.setFont('helvetica','bold');
  doc.text('$'+pago.monto.toLocaleString('es-CO'),105,y+17,{align:'center'});
  y+=34; doc.setFillColor(...verde); doc.setTextColor(255,255,255); doc.setFontSize(12);
  doc.roundedRect(75,y,60,12,3,3,'F');
  doc.text('✓  PAGO REGISTRADO',105,y+8,{align:'center'});
  doc.setTextColor(...gris); doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text('Este recibo es válido como comprobante de pago de cuota de administración.',105,270,{align:'center'});
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} · ResidenciasPro`,105,276,{align:'center'});
  doc.save(`${pago.recibo}.pdf`);
}

export function exportarCSV(pagos, formatMes) {
  const header='Recibo,Apartamento,Residente,Mes,Monto,Medio,Fecha,Referencia\n';
  const rows=pagos.map(p=>`${p.recibo},${p.apto},${p.residente},${formatMes(p.mes)},${p.monto},${p.medio},${p.fecha},${p.ref||''}`).join('\n');
  const blob=new Blob([header+rows],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='pagos_residenciaspro.csv'; a.click(); URL.revokeObjectURL(url);
}
