import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAdminApiKey,
  getAdminApiKey,
  setAdminApiKey as persistAdminApiKey,
} from '../auth/adminKey';

interface AdminKeyContextValue {
  adminApiKey: string | null;
  isConfigured: boolean;
  saveAdminApiKey: (key: string) => void;
  clearKey: () => void;
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

export function AdminKeyProvider({ children }: { children: ReactNode }) {
  const [adminApiKey, setAdminApiKeyState] = useState<string | null>(() => getAdminApiKey());

  const saveAdminApiKey = useCallback((key: string) => {
    persistAdminApiKey(key);
    setAdminApiKeyState(key.trim());
  }, []);

  const clearKey = useCallback(() => {
    clearAdminApiKey();
    setAdminApiKeyState(null);
  }, []);

  const value = useMemo(
    () => ({
      adminApiKey,
      isConfigured: Boolean(adminApiKey),
      saveAdminApiKey,
      clearKey,
    }),
    [adminApiKey, saveAdminApiKey, clearKey],
  );

  return <AdminKeyContext.Provider value={value}>{children}</AdminKeyContext.Provider>;
}

export function useAdminKey(): AdminKeyContextValue {
  const context = useContext(AdminKeyContext);
  if (!context) {
    throw new Error('useAdminKey must be used within AdminKeyProvider');
  }
  return context;
}
