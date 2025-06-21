import { useState, useEffect, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@lib/queryClient";
import { AuthContext } from "@components/AuthProvider";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
  profileImageUrl: string | null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  });

  const queryClient = useQueryClient();

  // Check for token in URL (from OAuth redirect)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const userData = urlParams.get('user');
      
      if (urlToken && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));
          setToken(urlToken);
          localStorage.setItem('auth_token', urlToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Clean up URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error('Error parsing OAuth user data:', error);
        }
      }
    }
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        return await apiRequest('/api/auth/user', 'GET', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error: any) {
        // If token is invalid, clear it
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          setToken(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
        return null;
      }
    },
    enabled: !!token,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (token) {
        await apiRequest('/api/auth/logout', 'POST', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    },
    onSettled: () => {
      // Clear everything regardless of API call success
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      queryClient.clear();
    },
  });

  const login = (userData: User, authToken: string) => {
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    queryClient.setQueryData(['auth', 'user'], userData);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    token,
  };
}