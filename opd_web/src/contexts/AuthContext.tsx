import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import authService, { UserResponse, UserRole } from '@/services/authService';

export type { UserRole } from '@/services/authService';

interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  email: string | null;
  doctorId: string | null;
  doctorLinked: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUserResponseToUser(response: UserResponse): User {
  return {
    id: response.id,
    name: response.display_name,
    role: response.role,
    username: response.username,
    email: response.email,
    doctorId: response.doctor_id,
    doctorLinked: response.doctor_linked,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Restore user session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (!authService.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const userResponse = await authService.getCurrentUser();
        setUser(mapUserResponseToUser(userResponse));
      } catch {
        // Token invalid or expired - clear and redirect to login
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for auth:logout events from API client (when token refresh fails)
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout]);

  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    const response = await authService.login({ username_or_email: usernameOrEmail, password });
    setUser(mapUserResponseToUser(response.user));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
