/* ═══════════════════════════════════════════════════════
   UTILS/FORMS.JS — Validación centralizada
═══════════════════════════════════════════════════════ */

const Forms = {

  // Muestra un error inline bajo el campo
  showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById('err-' + fieldId);
    if (field) field.classList.add('error');
    if (err)   err.textContent = msg;
  },

  // Limpia error de un campo
  clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById('err-' + fieldId);
    if (field) field.classList.remove('error');
    if (err)   err.textContent = '';
  },

  // Limpia todos los errores de un formulario (por IDs de campo)
  clearAll(fieldIds) {
    fieldIds.forEach(id => this.clearError(id));
  },

  // ── Validadores individuales ───────────────────────

  required(value, fieldId, label = 'Este campo') {
    if (!value || value.trim() === '') {
      this.showError(fieldId, `${label} es obligatorio.`);
      return false;
    }
    this.clearError(fieldId);
    return true;
  },

  email(value, fieldId) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      this.showError(fieldId, 'Ingresa un correo válido.');
      return false;
    }
    this.clearError(fieldId);
    return true;
  },

  phone(value, fieldId) {
    const clean = value.replace(/[\s\-]/g, '');
    if (!/^\d{7,12}$/.test(clean)) {
      this.showError(fieldId, 'Teléfono inválido (7–12 dígitos).');
      return false;
    }
    this.clearError(fieldId);
    return true;
  },

  positiveNumber(value, fieldId, label = 'El monto') {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) {
      this.showError(fieldId, `${label} debe ser mayor a 0.`);
      return false;
    }
    this.clearError(fieldId);
    return true;
  },

  // ── Validadores de formularios completos ──────────

  validateResidente(data) {
    let ok = true;
    ok = this.required(data.nombre,   'r-nombre',   'El nombre')  && ok;
    ok = this.required(data.apto,     'r-apto',     'El apto')    && ok;
    ok = this.required(data.cedula,   'r-cedula',   'La cédula')  && ok;
    ok = this.required(data.telefono, 'r-telefono', 'El teléfono') && ok;
    ok = this.required(data.email,    'r-email',    'El correo')  && ok;
    if (data.email) ok = this.email(data.email, 'r-email') && ok;
    if (data.telefono) ok = this.phone(data.telefono, 'r-telefono') && ok;
    return ok;
  },

  validatePago(data) {
    let ok = true;
    ok = this.required(data.apto,   'p-apto',  'El apartamento') && ok;
    ok = this.required(data.fecha,  'p-fecha', 'La fecha')       && ok;
    ok = this.positiveNumber(data.monto, 'p-monto', 'El monto')  && ok;
    return ok;
  },

  validateComunicado(data) {
    let ok = true;
    ok = this.required(data.asunto,  'c-asunto',  'El asunto')  && ok;
    ok = this.required(data.mensaje, 'c-mensaje', 'El mensaje') && ok;
    return ok;
  },

  validatePQR(data) {
    let ok = true;
    ok = this.required(data.asunto, 'q-asunto', 'El asunto') && ok;
    return ok;
  },

  // ── Helper: leer valor de un input ────────────────
  val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  },

  // ── Helper: limpiar formulario ────────────────────
  resetFields(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
      this.clearError(id);
    });
  },
};
