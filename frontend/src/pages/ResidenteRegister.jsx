import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ResidenteRegister() {
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [email, setEmail] = useState('');
  const [apartamentos, setApartamentos] = useState([]);
  const [aptoSeleccionado, setAptoSeleccionado] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingApts, setLoadingApts] = useState(true);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // Cargar apartamentos disponibles
  useEffect(() => {
    const fetchApartamentos = async () => {
      try {
        const res = await fetch('/api/apartamentos/disponibles');
        const data = await res.json();
        if (res.ok) {
          setApartamentos(data.data || []);
        }
      } catch (err) {
        console.error('Error cargando apartamentos:', err);
      } finally {
        setLoadingApts(false);
      }
    };

    fetchApartamentos();
  }, []);

  const handle = async () => {
    setError('');

    // Validaciones
    if (!nombre || !documento || !email || !aptoSeleccionado || !password || !passwordConfirm) {
      setError('Completa todos los campos.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/residente', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          documento,
          tipo_documento: tipoDocumento,
          email: email.toLowerCase(),
          apto_codigo: aptoSeleccionado,
          password,
          passwordConfirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrarse.');
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
          <div className="brand-sub">Registro de Residente</div>
        </div>
        <div className="login-card" style={{ maxWidth: '500px' }}>
          <div className="login-title">Crea tu cuenta</div>
          <div className="login-sub">Completa el formulario para registrarte</div>

          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input
              className="form-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              onKeyDown={handleKeyPress}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Tipo documento *</label>
              <select
                className="form-input"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
              >
                <option value="CC">Cédula (CC)</option>
                <option value="CE">Cédula Extranjería (CE)</option>
                <option value="NIT">NIT</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Número de documento *</label>
              <input
                className="form-input"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="1234567890"
                onKeyDown={handleKeyPress}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico *</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              onKeyDown={handleKeyPress}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Apartamento *</label>
            {loadingApts ? (
              <div style={{ padding: '10px', color: '#999' }}>Cargando apartamentos...</div>
            ) : (
              <select
                className="form-input"
                value={aptoSeleccionado}
                onChange={(e) => setAptoSeleccionado(e.target.value)}
              >
                <option value="">Selecciona tu apartamento</option>
                {apartamentos.map((apto) => (
                  <option key={apto.codigo} value={apto.codigo}>
                    {apto.codigo} - {apto.torre_nombre} (Piso {apto.piso})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              onKeyDown={handleKeyPress}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña *</label>
            <input
              className="form-input"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              onKeyDown={handleKeyPress}
            />
          </div>

          <button className="btn-submit" onClick={handle} disabled={loading || loadingApts}>
            {loading ? (
              <>
                <div className="spinner" />
                <span>Registrando...</span>
              </>
            ) : (
              'Registrarse'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.95rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#6b4c8f', textDecoration: 'none', fontWeight: 'bold' }}>
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}