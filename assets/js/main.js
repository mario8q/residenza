/* ═══════════════════════════════════════════════════════
   MAIN.JS — Inicialización y eventos globales
   Se ejecuta cuando el DOM está completamente cargado.
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Navegación por sidebar ──────────────────────
  document.getElementById('sidebar-nav').addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item[data-view]');
    if (item) Router.navigate(item.dataset.view);
  });

  // ── 2. Búsqueda global (topbar) ────────────────────
  document.getElementById('global-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) return;

    // Busca en residentes y navega si hay coincidencia
    const found = AppState.residentes.some(r =>
      r.nombre.toLowerCase().includes(q) || r.apto.toLowerCase().includes(q)
    );
    if (found) {
      Residentes._busqueda = q;
      Router.navigate('residentes');
    }
  });

  document.getElementById('global-search').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.target.value = '';
      Residentes._busqueda = '';
    }
  });

  // ── 3. Botón de notificaciones (placeholder) ───────
  document.getElementById('btn-notif').addEventListener('click', () => {
    Notify.info('No hay notificaciones nuevas.');
  });

  // ── 4. Inicializar vista ───────────────────────────
  Router.navigate('dashboard');
  Router.updateBadges();
});
