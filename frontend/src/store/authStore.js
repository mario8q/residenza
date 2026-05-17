import { create } from 'zustand';
import useAppStore from './appStore';

const useAuthStore = create((set) => ({
  token: sessionStorage.getItem('accessToken') || null,
  user:  JSON.parse(sessionStorage.getItem('user') || 'null'),
  
  setAuth: (token, user) => {
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
    
    // Cargar datos de la BD después de autenticar (secuencial y robusto)
    const appStore = useAppStore.getState();
    
    // Ejecutar cargas de forma secuencial para evitar conflictos
    (async () => {
      try {
        await appStore.fetchConjunto();
        await appStore.fetchApartamentosDisponibles();
        await appStore.fetchResidentes();
        // fetchPagos depende de user.rol, así que debe ir después de setAuth
        await appStore.fetchPagos();
        await appStore.fetchComunicados();
        await appStore.fetchPQR();
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    })();
  },
  
  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;