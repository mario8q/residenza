import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ui/Toast';

export default function MiPerfil() {
  const { user, token } = useAuthStore();
  const toast = useToast();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    setError('');
    if (!passwordActual || !passwordNueva || !passwordConfirm) {
      setError('Completa todos los campos.');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (passwordNueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passwordActual,
          passwordNueva,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al cambiar contraseña.');
        return;
      }

      toast.success('Contraseña cambiada correctamente.');
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirm('');
    } catch (err) {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Mi Información</span>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
              {user?.nombre || 'N/A'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
              {user?.email || 'N/A'}
            </div>
          </div>

          {user?.rol === 'residente' && (
            <>
              <div className="form-group">
                <label className="form-label">Apartamento</label>
                <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
                  {user?.apartamento || 'N/A'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Conjunto</label>
                <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
                  {user?.conjuntoNombre || 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <span className="card-title">Cambiar Contraseña</span>
        </div>
        <div className="card-body">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label className="form-label">Contraseña Actual</label>
            <input
              className="form-input"
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña Nueva</label>
            <input
              className="form-input"
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Nueva Contraseña</label>
            <input
              className="form-input"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
            />
          </div>

          <button className="btn btn-primary" onClick={handleChangePassword} disabled={loading}>
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}