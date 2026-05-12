/* ═══════════════════════════════════════════════════════
   UTILS/NOTIFICATIONS.JS — Toasts temporales
═══════════════════════════════════════════════════════ */

const Notify = {
  _icons: { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' },

  show(msg, type = 'success', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this._icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${msg}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  },

  success: (msg) => Notify.show(msg, 'success'),
  error:   (msg) => Notify.show(msg, 'error'),
  info:    (msg) => Notify.show(msg, 'info'),
  warning: (msg) => Notify.show(msg, 'warning'),
};
