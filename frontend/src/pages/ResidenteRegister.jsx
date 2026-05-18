import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ui/Toast';

export default function ResidenteRegister() {
  const [conjuntos, setConjuntos] = useState([]);
  const [conjuntoSeleccionado, setConjuntoSeleccionado] = useState('');
  const [apartamentos, setApartamentos] = useState([]);
  
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [aptoSeleccionado, setAptoSeleccionado] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingApts, setLoadingApts] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  // Cargar conjuntos disponibles
  useEffect(() => {
    const fetchConjuntos = async () => {
      try {
        const res = await fetch('/api/auth/conjuntos/disponibles');
        const data = await res.json();
        if (res.ok) {
          setConjuntos(data.data || []);
        }
      } catch (err) {
        console.error('Error cargando conjuntos:', err);
        toast.error('Error cargando conjuntos.');
      }
    };
    fetchConjuntos();
  }, []);

  // Cargar apartamentos cuando cambia el conjunto
  useEffect(() => {
    if (!conjuntoSeleccionado) {
      setApartamentos([]);
      return;
    }

    const fetchApartamentos = async () => {
      setLoadingApts(true);
      try {
        // Buscar el schema del conjunto
        const conjRes = conjuntos.find(c => c.id === parseInt(conjuntoSeleccionado));
        if (!conjRes) return;

        // En una app real, necesitarías un endpoint específico que devuelva
        // apartamentos disponibles filtrando por conjunto_id
        // Por ahora usamos el endpoint público que los devuelve todos
        const res = await fetch('/api/apartamentos/disponibles');
        const data = await res.json();

        if (res.ok) {
          // Filtrar apartamentos que pertenecen al conjunto seleccionado
          // NOTA: esto es una aproximación. Lo ideal sería un endpoint backend
          // que devuelva `/api/conjuntos/{id}/apartamentos/disponibles`
          setApartamentos(data.data || []);
        }
      } catch (err) {
        console.error('Error cargando apartamentos:', err);
        toast.error('Error cargando apartamentos.');
      } finally {
        setLoadingApts(false);
      }
    };

    fetchApartamentos();
  }, [conjuntoSeleccionado, toast]);

  const handle = async () => {
    setError('');

    // Validaciones
    if (!conjuntoSeleccionado) {
      setError('Selecciona un conjunto residencial.');
      return;
    }

    if (!nombre || !documento || !email || !telefono || !aptoSeleccionado || !password || !passwordConfirm) {
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

      // Login automático después del registro
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
      console.error('Error:', err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const conjuntoActual = conjuntos.find(c => c.id === parseInt(conjuntoSeleccionado));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', color: '#333', fontSize: '28px', fontWeight: '700' }}>
          Registro Residente
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px', fontSize: '14px' }}>
          Crea tu cuenta para acceder al portal
        </p>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handle(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Selector de Conjunto */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Conjunto Residencial *
            </label>
            <select
              value={conjuntoSeleccionado}
              onChange={(e) => setConjuntoSeleccionado(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                background: 'white',
                cursor: 'pointer',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            >
              <option value="">— Selecciona tu conjunto —</option>
              {conjuntos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Apartamento (solo si hay conjunto) */}
          {conjuntoSeleccionado && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                Apartamento *
              </label>
              {loadingApts ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>Cargando apartamentos...</div>
              ) : (
                <select
                  value={aptoSeleccionado}
                  onChange={(e) => setAptoSeleccionado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="">— Selecciona tu apartamento —</option>
                  {apartamentos.map(a => (
                    <option key={a.id} value={a.codigo}>
                      {a.codigo}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          {/* Documento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                Tipo *
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                }}
              >
                <option value="CC">Cédula</option>
                <option value="CE">Extranjería</option>
                <option value="NIT">NIT</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                Documento *
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej: 12345678"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Teléfono (10 dígitos) *
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="3105551234"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Contraseña (mín. 6 caracteres) *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Botón Registrarse */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        {/* Link a Login */}
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}