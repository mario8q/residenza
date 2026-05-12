/* ═══════════════════════════════════════════════════════
   UTILS/CHARTS.JS — Gráficos simples sin dependencias
   (barras CSS + SVG donut)
═══════════════════════════════════════════════════════ */

const Charts = {

  /**
   * Renderiza un gráfico de barras CSS en el contenedor dado.
   * @param {string} containerId  - id del elemento contenedor
   * @param {Array}  data         - [{ label, total, pct }]
   * @param {string} color        - var CSS del color de las barras
   */
  renderBarChart(containerId, data, color = 'var(--accent)') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = data.map(({ label, total, pct }) => {
      const height = Math.max(pct, 0);
      const hasData = total > 0;
      return `
        <div class="bar-col" title="${label}: ${Charts.formatMoney(total)}">
          <div class="bar" style="
            height: ${height}%;
            background: ${hasData ? color : 'var(--surface2)'};
            ${!hasData ? 'border: 1px solid var(--border);' : ''}
          "></div>
          <div class="bar-label">${label}</div>
        </div>`;
    }).join('');
  },

  /**
   * Renderiza un donut SVG con dos segmentos.
   * @param {string} containerId
   * @param {number} pctMain   - porcentaje del segmento principal (0-100)
   * @param {string} colorMain
   * @param {string} colorRest
   */
  renderDonut(containerId, pctMain, colorMain = 'var(--accent2)', colorRest = 'var(--accent4)') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = 301; // circunferencia aproximada (r=48)
    const dash1 = Math.round((pctMain / 100) * total);
    const offset2 = total - dash1;

    container.innerHTML = `
      <div class="donut-container">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none"
            stroke="var(--surface2)" stroke-width="14"/>
          <circle cx="60" cy="60" r="48" fill="none"
            stroke="${colorMain}" stroke-width="14"
            stroke-dasharray="${total}" stroke-dashoffset="${total - dash1}"
            stroke-linecap="round"
            transform="rotate(-90 60 60)"/>
          <circle cx="60" cy="60" r="48" fill="none"
            stroke="${colorRest}" stroke-width="14"
            stroke-dasharray="${total}" stroke-dashoffset="${offset2}"
            stroke-linecap="round"
            transform="rotate(-90 60 60)" opacity="0.7"/>
        </svg>
        <div class="donut-label">
          <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700">${pctMain}%</div>
          <div style="font-size:0.65rem;color:var(--text3)">al día</div>
        </div>
      </div>`;
  },

  // ── Formato de dinero ─────────────────────────────
  formatMoney(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toLocaleString('es-CO');
  },
};
