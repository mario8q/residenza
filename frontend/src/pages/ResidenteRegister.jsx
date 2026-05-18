import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ui/Toast';

export default function ResidenteRegister() {
  const [conjuntos, setConjuntos] = useState([]);
  const [conjuntoSeleccionado, setConjuntoSeleccionado] = useState('');
  
  const [torres, setTorres] = useState([]);
  const [torreSeleccionada, setTorreSeleccionada] = useState('');
  const [loadingTorres, setLoadingTorres] = useState(false);
  
  const [apartamentos, setApartamentos] = useState([]);
  const [aptoSeleccionado, setAptoSeleccionado] = useState('');
  const [loadingApts, setLoadingApts] = useState(false);

  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  // ────────────────────────────────────────────────────────
  // PASO 1: Cargar conjuntos disponibles (solo una vez)
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchConjuntos = async () => {
      try {
        const res = await fetch('/api/auth/conjuntos/disponibles');
        const data = await res.json();
        if (res.ok) {
          setConjuntos(data.data || []);
        } else {
          toast.error('Error cargando conjuntos.');
        }
      } catch (err) {
        console.error('Error cargando conjuntos:', err);
        toast.error('Error cargando conjuntos.');
      }
    };
    
    fetchConjuntos();
  }, []); 

  // ────────────────────────────────────────────────────────
  // PASO 2: Cuando cambia el conjunto, cargar sus torres
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conjuntoSeleccionado) {
      setTorres([]);
      setTorreSeleccionada('');
      setApartamentos([]);
      return;
    }

    const fetchTorres = async () => {
      setLoadingTorres(true);
      try {
        const res = await fetch(
          `/api/apartamentos/publicas/conjuntos/${conjuntoSeleccionado}/torres`
        );
        const data = await res.json();
        if (res.ok) {
          setTorres(data.data || []);
          setTorreSeleccionada('');
          setApartamentos([]);
        } else {
          toast.error(data.error || 'Error cargando torres.');
        }
      } catch (err) {
        console.error('Error cargando torres:', err);
        toast.error('Error cargando torres.');
      } finally {
        setLoadingTorres(false);
      }
    };

    fetchTorres();
  }, [conjuntoSeleccionado]); 

  // ────────────────────────────────────────────────────────
  // PASO 3: Cuando cambia la torre, cargar sus apartamentos
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conjuntoSeleccionado || !torreSeleccionada) {
      setApartamentos([]);
      return;
    }

    const fetchApartamentos = async () => {
      setLoadingApts(true);
      try {
        const res = await fetch(
          `/api/apartamentos/publicas/conjuntos/${conjuntoSeleccionado}/torres/${torreSeleccionada}/apartamentos`
        );
        const data = await res.json();
        if (res.ok) {
          setApartamentos(data.data || []);
          setAptoSeleccionado('');
        } else {
          toast.error(data.error || 'Error cargando apartamentos.');
        }
      } catch (err) {
        console.error('Error cargando apartamentos:', err);
        toast.error('Error cargando apartamentos.');
      } finally {
        setLoadingApts(false);
      }
    };

    fetchApartamentos();
  }, [conjuntoSeleccionado, torreSeleccionada]); 

  const handle = async () => {
    setError('');

    // Validaciones
    if (!conjuntoSeleccionado) {
      setError('Selecciona un conjunto residencial.');
      return;
    }

    if (!torreSeleccionada) {
      setError('Selecciona una torre.');
      return;
    }

    if (
      !nombre ||
      !documento ||
      !email ||
      !telefono ||
      !aptoSeleccionado ||
      !password ||
      !passwordConfirm
    ) {
      setError('Completa todos los campos.');
      return;
    }

    if (!/^[0-9]{10}$/.test(telefono)) {
      setError('El teléfono debe tener exactamente 10 dígitos.');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          documento,
          tipo_documento: tipoDocumento,
          email: email.toLowerCase().trim(),
          telefono,
          conjunto_id: parseInt(conjuntoSeleccionado),
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

      // Login automático
      setAuth(data.accessToken, {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.nombre,
        rol: data.user.rol,
        conjuntoId: data.user.conjuntoId,
        conjuntoNombre: data.user.conjuntoNombre,
        apartamento: data.user.apartamento,
      });

      toast.success('¡Registro completado! Bienvenido.');
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handle();
    }
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

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* PASO 1: CONJUNTO */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="form-group">
            <label className="form-label">Conjunto residencial *</label>
            <select
              className="form-input"
              value={conjuntoSeleccionado}
              onChange={(e) => setConjuntoSeleccionado(e.target.value)}
            >
              <option value="">Selecciona tu conjunto</option>
              {conjuntos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* PASO 2: TORRE (solo si hay conjunto) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {conjuntoSeleccionado && (
            <div className="form-group">
              <label className="form-label">Torre *</label>
              {loadingTorres ? (
                <div style={{ padding: '10px', color: '#999' }}>
                  Cargando torres...
                </div>
              ) : torres.length === 0 ? (
                <div style={{ padding: '10px', color: '#999' }}>
                  No hay torres disponibles en este conjunto.
                </div>
              ) : (
                <select
                  className="form-input"
                  value={torreSeleccionada}
                  onChange={(e) => setTorreSeleccionada(e.target.value)}
                >
                  <option value="">Selecciona una torre</option>
                  {torres.map((t) => (
                    <option key={t.id} value={t.id}>
                      Torre {t.nombre} ({t.num_pisos} pisos)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* PASO 3: APARTAMENTO (solo si hay torre) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {torreSeleccionada && (
            <div className="form-group">
              <label className="form-label">Apartamento *</label>
              {loadingApts ? (
                <div style={{ padding: '10px', color: '#999' }}>
                  Cargando apartamentos...
                </div>
              ) : apartamentos.length === 0 ? (
                <div style={{ padding: '10px', color: '#999' }}>
                  No hay apartamentos disponibles en esta torre.
                </div>
              ) : (
                <select
                  className="form-input"
                  value={aptoSeleccionado}
                  onChange={(e) => setAptoSeleccionado(e.target.value)}
                >
                  <option value="">Selecciona tu apartamento</option>
                  {apartamentos.map((apto) => (
                    <option key={apto.id} value={apto.codigo}>
                      {apto.codigo} - Piso {apto.piso}
                      {apto.area_m2 ? ` (${apto.area_m2} m²)` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Nombre */}
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

          {/* Documento */}
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

          {/* Email */}
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

          {/* Teléfono */}
          <div className="form-group">
            <label className="form-label">Teléfono *</label>
            <input
              className="form-input"
              type="tel"
              value={telefono}
              onChange={(e) =>
                setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="3001234567"
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Contraseña */}
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

          {/* Confirmar contraseña */}
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

          {/* Botón */}
          <button
            className="btn-submit"
            onClick={handle}
            disabled={loading || loadingTorres || loadingApts}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Registrando...</span>
              </>
            ) : (
              'Registrarse'
            )}
          </button>

          {/* Login */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.95rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              style={{
                color: '#6b4c8f',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}