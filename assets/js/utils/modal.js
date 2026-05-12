/* ═══════════════════════════════════════════════════════
   UTILS/MODAL.JS — Apertura y cierre de modales
═══════════════════════════════════════════════════════ */

const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      // Cerrar con Escape
      this._escHandler = (e) => { if (e.key === 'Escape') this.close(id); };
      document.addEventListener('keydown', this._escHandler);
    }
  },

  close(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('open');
      document.removeEventListener('keydown', this._escHandler);
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
  },
};

// Cerrar al hacer clic fuera del modal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
