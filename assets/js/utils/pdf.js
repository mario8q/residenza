/* ═══════════════════════════════════════════════════════
   UTILS/PDF.JS — Generación de recibos con jsPDF
═══════════════════════════════════════════════════════ */

const PDF = {

  /**
   * Genera y descarga un recibo de pago.
   * @param {Object} pago - objeto pago de AppState
   */
  generarRecibo(pago) {
    if (typeof window.jspdf === 'undefined') {
      Notify.warning('Librería PDF no disponible. Verifica la conexión a internet.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const azul  = [27, 58, 107];
    const gris  = [100, 116, 139];
    const negro = [55, 65, 81];
    const verde = [16, 185, 129];

    // ── Encabezado ──────────────────────────────────
    doc.setFillColor(...azul);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ResidenciasPro', 20, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Conjunto Bello Horizonte · Torre A y B · 48 Aptos', 20, 26);
    doc.text('admin@residenciaspro.co  |  Tel: 600-555-0000', 20, 33);

    // Número de recibo (derecha)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pago.recibo, 190, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Recibo de Pago', 190, 27, { align: 'right' });

    // ── Título ───────────────────────────────────────
    doc.setTextColor(...negro);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE PAGO', 105, 56, { align: 'center' });

    // Línea
    doc.setDrawColor(...azul);
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);

    // ── Datos del residente ──────────────────────────
    doc.setFontSize(10);
    const lineH = 8;
    let y = 70;

    const row = (label, value, yy) => {
      doc.setTextColor(...gris);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 20, yy);
      doc.setTextColor(...negro);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), 75, yy);
    };

    row('Apartamento:', pago.apto,         y); y += lineH;
    row('Residente:',   pago.residente,    y); y += lineH;
    row('Período:',     PDF._formatMes(pago.mes), y); y += lineH;
    row('Fecha Pago:',  PDF._formatFecha(pago.fecha), y); y += lineH;
    row('Medio:',       pago.medio,        y); y += lineH;
    if (pago.ref) { row('Referencia:', pago.ref, y); y += lineH; }

    // ── Monto ────────────────────────────────────────
    y += 6;
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(20, y, 170, 22, 3, 3, 'F');
    doc.setTextColor(...gris);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TOTAL PAGADO', 105, y + 7, { align: 'center' });
    doc.setTextColor(...verde);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('$' + pago.monto.toLocaleString('es-CO'), 105, y + 17, { align: 'center' });

    // ── Sello de pago ────────────────────────────────
    y += 34;
    doc.setFillColor(...verde);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.roundedRect(75, y, 60, 12, 3, 3, 'F');
    doc.text('✓  PAGO REGISTRADO', 105, y + 8, { align: 'center' });

    // ── Pie de página ────────────────────────────────
    doc.setTextColor(...gris);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Este recibo es válido como comprobante de pago de cuota de administración.', 105, 270, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} · ResidenciasPro MVP`, 105, 276, { align: 'center' });

    doc.save(`${pago.recibo}.pdf`);
    Notify.success(`Recibo ${pago.recibo} descargado.`);
  },

  // Exportar tabla de pagos como CSV simple
  exportarPagosCSV(pagos) {
    const header = 'Recibo,Apartamento,Residente,Mes,Monto,Medio,Fecha,Referencia\n';
    const rows   = pagos.map(p =>
      `${p.recibo},${p.apto},${p.residente},${PDF._formatMes(p.mes)},${p.monto},${p.medio},${p.fecha},${p.ref || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'pagos_residenciaspro.csv';
    a.click();
    URL.revokeObjectURL(url);
    Notify.success('Reporte exportado como CSV.');
  },

  _formatMes(mes) {
    const [y, m] = mes.split('-');
    const nombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${nombres[parseInt(m)]} ${y}`;
  },

  _formatFecha(fecha) {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  },
};
