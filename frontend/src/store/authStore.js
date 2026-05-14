import { create } from 'zustand';
import useAppStore from './appStore';

const useAuthStore = create((set) => ({
  token: sessionStorage.getItem('accessToken') || null,
  user:  JSON.parse(sessionStorage.getItem('user') || 'null'),
  
  setAuth: (token, user) => {
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
    
    // Cargar datos de la BD después de autenticar
    const appStore = useAppStore.getState();
    setTimeout(() => {
      appStore.fetchConjunto();
      appStore.fetchApartamentosDisponibles();
      appStore.fetchResidentes();
      appStore.fetchPagos();
      appStore.fetchComunicados();
      appStore.fetchPQR();
    }, 100);
  },
  
  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;