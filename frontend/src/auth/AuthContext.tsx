import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import keycloak from '../keycloak';

export interface AuthUser {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  position?: string;
  realmRoles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  keycloak: typeof keycloak;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const KEYCLOAK_INIT_OPTIONS = {
  // Используем check-sso, чтобы не было принудительного редиректа на старте,
  // но с корректной обработкой. Пользователь сам нажмет кнопку "Войти".
  onLoad: 'check-sso' as const,
  silentCheckSsoRedirectUri:
    window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
  // Важно: отключаем автоматический редирект, если нет сессии
  enableLogging: true, // Включаем логи для отладки (можно убрать в продакшене)
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Используем useRef, чтобы избежать повторной инициализации в StrictMode
  const initialized = useRef(false);
  const isLoggingIn = useRef(false);

  const loadProfile = useCallback(async (): Promise<void> => {
    if (!keycloak.authenticated || !keycloak.token) {
      setUser(null);
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/keycloak/profile/`, {
        headers: { Authorization: `Bearer ${keycloak.token}` },
      });
      
      if (!res.ok) {
        // Если токен невалиден, возможно, нужно обновить
        if (res.status === 401) {
          const refreshed = await keycloak.updateToken(30);
          if (refreshed) {
            return loadProfile(); // Повторяем запрос с новым токеном
          }
        }
        throw new Error(`Profile fetch failed: ${res.status}`);
      }
      
      const data = await res.json();
      const realmRoles: string[] = data?.keycloak?.realm_roles ?? [];
      setUser({ ...data, realmRoles });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setUser(null);
      // Если токен невалиден, разлогиниваем
      if (keycloak.authenticated) {
        await keycloak.logout({ redirectUri: window.location.origin + '/login' });
      }
    }
  }, []);

  useEffect(() => {
    // Защита от двойного вызова в React.StrictMode
    if (initialized.current) return;
    initialized.current = true;

    let cancelled = false;

    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init(KEYCLOAK_INIT_OPTIONS);
        
        if (cancelled) return;

        if (authenticated) {
          // Настраиваем обновление токена
          keycloak.onTokenExpired = () => {
            keycloak.updateToken(30).catch(() => {
              console.error('Token refresh failed');
              keycloak.login();
            });
          };
          
          await loadProfile();
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Keycloak init failed:', err);
        setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initKeycloak();

    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(async (): Promise<void> => {
    if (isLoggingIn.current) return; // Защита от повторных кликов
    isLoggingIn.current = true;
    
    try {
      // Указываем redirectUri, куда вернуться после успешного входа
      await keycloak.login({ 
        redirectUri: window.location.origin + '/dashboard',
        // Можно добавить prompt: 'login', если нужно принудительно спрашивать пароль
      });
    } catch (error) {
      console.error('Login failed:', error);
      isLoggingIn.current = false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    try {
      await keycloak.logout({ 
        redirectUri: window.location.origin + '/login' 
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // В случае ошибки просто перезагружаем страницу
      window.location.href = '/login';
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        refreshUser, 
        keycloak 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};