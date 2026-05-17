import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import { ToastContainer } from './components/ui/Toast'
import Login              from './pages/Login'
import ResidenteRegister  from './pages/ResidenteRegister' 
import Dashboard          from './pages/Dashboard'
import Residentes         from './pages/Residentes'
import Cuotas             from './pages/Cuotas'
import Reportes           from './pages/Reportes'
import Comunicados        from './pages/Comunicados'
import PQR                from './pages/PQR'
import MiPerfil           from './pages/MiPerfil'
import Edificio from './pages/Edificio'

function Guard({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

// Guard que solo permite acceso a admin
function AdminOnly({ children }) {
  const token = useAuthStore(s => s.token)
  const user  = useAuthStore(s => s.user)

  if (!token) return <Navigate to="/login" replace />
  if (user?.rol !== 'admin') return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/residente/register" element={<ResidenteRegister />} />  
        
        <Route path="/" element={<Guard><AppLayout /></Guard>}>
          <Route index             element={<Dashboard />} />
          <Route path="edificio" element={<AdminOnly><Edificio /></AdminOnly>} />
          <Route path="residentes" element={<AdminOnly><Residentes /></AdminOnly>} />
          <Route path="cuotas"     element={<Cuotas />} />
          <Route path="reportes"   element={<AdminOnly><Reportes /></AdminOnly>} />
          <Route path="comunicados" element={<Comunicados />} />
          <Route path="pqr"        element={<PQR />} />
          <Route path="mi-perfil"  element={<MiPerfil />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}