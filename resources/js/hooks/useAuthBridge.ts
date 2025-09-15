import { useAuthContext } from '@/Contexts/AuthContext';

/**
 * Hook de compatibilité pour assurer la transition entre useAuth et useAuthContext
 * Cela permet de résoudre les problèmes d'importation dans les composants
 */
export const useAuthBridge = () => {
  return useAuthContext();
};

export default useAuthBridge;
