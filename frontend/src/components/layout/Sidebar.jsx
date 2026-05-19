import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Modal from '../ui/Modal';

const NAV_ADMIN = [
  { section:'Principal' },
  { to:'/',            icon:'📊', label:'Dashboard' },
  { to:'/residentes',  icon:'👥', label:'Residentes' },
  { to:'/edificio',    icon:'🏢', label:'Edificio' }, 
  { section:'Finanzas' },
  { to:'/cuotas',      icon:'💰', label:'Cuotas y Pagos' },
  { to:'/reportes',    icon:'📈', label:'Reportes' },
  { section:'Comunidad' },
  { to:'/comunicados', icon:'📢', label:'Comunicados', badgeKey:'com' },
  { to:'/pqr',         icon:'📋', label:'PQR',         badgeKey:'pqr' },
];

const NAV_RESIDENTE = [
  { section:'Mi Información' },
  { to:'/',           icon:'📊', label:'Mi Dashboard' },
  { to:'/mi-perfil',  icon:'👤', label:'Mi Perfil' },
  { section:'Finanzas' },
  { to:'/cuotas',     icon:'💰', label:'Mis Cuotas' },
  { section:'Comunidad' },
  { to:'/comunicados', icon:'📢', label:'Comunicados', badgeKey:'com' },
  { to:'/pqr',        icon:'📋', label:'Mis PQRs',     badgeKey:'pqr' },
];

export default function Sidebar({ pqrCount=0, comCount=0 }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const isResidente = user?.rol === 'residente';
  const nav = isResidente ? NAV_RESIDENTE : NAV_ADMIN;
  const initials = user?.nombre ? user.nombre.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : 'CA';

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method:'POST', credentials:'same-origin',
        headers:{ Authorization:`Bearer ${token}` },
      });
    } catch { /* continue */ }
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const badgeVal = (key) => key==='pqr' ? (pqrCount>0?pqrCount:null) : (comCount>0?comCount:null);

  const subtitulo = isResidente 
    ? `Apto: ${user?.apartamento || '—'}` 
    : 'Panel de Administración';

  const rolLabel = isResidente ? 'Residente' : 'Administrador';

  return (
    <>
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-title">ResidenciasPro</div>
          <div className="logo-sub">{subtitulo}</div>
        </div>
        <div className="complex-badge">
          <div className="complex-name">🏢 {user?.conjuntoNombre || 'Conjunto'}</div>
          <div className="complex-info">Conjunto #{user?.conjuntoId || '—'}</div>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item,i) => {
            if (item.section) return <div key={i} className="nav-section-label">{item.section}</div>;
            const badge = badgeVal(item.badgeKey);
            return (
              <NavLink key={item.to} to={item.to} end={item.to==='/'}
                className={({isActive})=>`nav-item${isActive?' active':''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {badge && <span className="nav-badge">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer" onClick={handleLogoutClick} title="Clic para cerrar sesión">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.nombre || 'Usuario'}</div>
            <div className="user-role">{rolLabel}</div>
          </div>
        </div>
      </aside>

      <Modal open={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Cerrar Sesión">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px', color: '#fffff' }}>
            ¿Estás seguro de que deseas cerrar sesión?
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowLogoutModal(false)}
              style={{
                padding: '10px 24px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmLogout}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}