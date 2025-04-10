import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

interface PrivateRouterContextType {
  isAuthenticated: boolean;
  setAuthStatus: (auth: boolean) => void;
}

const PrivateRouterContext = createContext<PrivateRouterContextType>({
  isAuthenticated: false,
  setAuthStatus: () => {},
});

const IDLE_TIMEOUT = 15 * 60 * 1000; // 🔒 15 minutes

export const PrivateRouterContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));
  const hasLoggedOutRef = useRef(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    if (!hasLoggedOutRef.current) {
      hasLoggedOutRef.current = true;
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      navigate('/');
    }
  }, [navigate]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(() => {
      console.warn('👋 User inactive for too long. Logging out...');
      logout();
    }, IDLE_TIMEOUT);
  }, [logout]);

  const setAuthStatus = (auth: boolean) => {
    if (!auth) {
   
      logout();
    } else {
      setIsAuthenticated(true);
      hasLoggedOutRef.current = false;
      resetIdleTimer(); // Start idle timer after login
    }
  };

  // Monitor user activity for idle timeout
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    const handleActivity = () => {
      if (isAuthenticated) resetIdleTimer();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetIdleTimer(); // Initial timer

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  // Watch for token removal every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (!token) logout();
    }, 3000);
    return () => clearInterval(interval);
  }, [logout]);

  // Sync logout across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout]);

  return (
    <PrivateRouterContext.Provider value={{ isAuthenticated, setAuthStatus }}>
      {children}
    </PrivateRouterContext.Provider>
  );
};

export const usePrivateRouter = () => useContext(PrivateRouterContext);

export const PrivateRouteWrapper: React.FC = () => {
  const { isAuthenticated } = usePrivateRouter();
  const mustResetPassword = localStorage.getItem('mustResetPassword') === 'true';

  const location = window.location.pathname;
  if (isAuthenticated) {
    if (mustResetPassword && location !== '/reset-password') {
      return <Navigate to="/reset-password" replace />;
    }

    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </React.Suspense>
    );
  }

  return <Navigate to="/" replace />;
};