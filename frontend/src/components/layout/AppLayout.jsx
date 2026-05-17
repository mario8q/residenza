import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import useAppStore from '../../store/appStore';
import useAuthStore from '../../store/authStore';

const TITLES_ADMIN = {
  '/':'Dashboard General',
  '/residentes':'Gestión de Residentes',
  '/cuotas':'Cuotas y Pagos',
  '/reportes':'Reportes Financieros',
  '/comunicados':'Comunicados',
  '/pqr':'PQR – Peticiones, Quejas y Reclamos',
  '/mi-perfil':'Mi Perfil',
};

const TITLES_RESIDENTE = {
  '/':'Mi Dashboard',
  '/cuotas':'Mis Cuotas',
  '/comunicados':'Comunicados',
  '/pqr':'Mis PQRs',
  '/mi-perfil':'Mi Perfil',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const isResidente = user?.rol === 'residente';
  const TITLES = isResidente ? TITLES_RESIDENTE : TITLES_ADMIN;
  
  const pqrCount   = useAppStore(s=>s.getPQRAbiertos().length);
  const comCount   = useAppStore(s=>s.comunicados.filter(c=>c.fecha.startsWith('2025-02')).length);
  const residentes = useAppStore(s=>s.residentes);
  const title = TITLES[location.pathname] || 'ResidenciasPro';

  const handleSearch = (e) => {
    const q = e.target.value; 
    setSearch(q);
    if (!q.trim() || isResidente) return; // Solo admin puede buscar
    const found = residentes.some(r=>r.nombre.toLowerCase().includes(q.toLowerCase())||r.apto.toLowerCase().includes(q.toLowerCase()));
    if (found) navigate('/residentes');
  };

  return (
    <div className="layout">
      <Sidebar pqrCount={pqrCount} comCount={comCount}/>
      <main className="main">
        <div className="topbar">
          <div className="page-title">{title}</div>
          <div className="topbar-actions">
            {!isResidente && (
              <input className="search-input" type="text" placeholder="🔍  Buscar..." value={search} onChange={handleSearch}/>
            )}
            <button className="btn btn-ghost" onClick={()=>{}}>🔔</button>
          </div>
        </div>
        <div className="content"><Outlet/></div>
      </main>
    </div>
  );
}