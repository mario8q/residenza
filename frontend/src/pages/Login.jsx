import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [userType, setUserType] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handle = async () => {
    setError('');
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = userType === 'admin' 
        ? '/api/auth/login'
        : '/api/auth/login/residente';

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenciales inválidas.');
        return;
      }

      setAuth(data.accessToken, data.user);
      navigate('/');
    } catch (err) {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handle();
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="brand">
          <div className="brand-title">ResidenciasPro</div>
          <div className="brand-sub">Portal de Acceso</div>
        </div>
        <div className="login-card">
          <div className="login-title">Iniciar sesión</div>
          <div className="login-sub">Selecciona tu tipo de cuenta para continuar</div>

          {/* Selector de tipo de usuario */}
          <div className="form-group">
            <label className="form-label">¿Qué tipo de usuario eres?</label>
            <div className="user-type-selector">
              <button
                className={`user-type-btn ${userType === 'admin' ? 'active' : ''}`}
                onClick={() => setUserType('admin')}
                type="button"
              >
                👨‍💼 Administrador
              </button>
              <button
                className={`user-type-btn ${userType === 'residente' ? 'active' : ''}`}
                onClick={() => setUserType('residente')}
                type="button"
              >
                🏠 Residente
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              onKeyDown={handleKeyPress}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={handleKeyPress}
            />
          </div>

          <button className="btn-submit" onClick={handle} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" />
                <span>Verificando...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          {/* Enlace de registro solo para residentes */}
          {userType === 'residente' && (
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.95rem' }}>
              ¿No tienes cuenta?{' '}
              <Link to="/residente/register" style={{ color: '#6b4c8f', textDecoration: 'none', fontWeight: 'bold' }}>
                Regístrate aquí
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}