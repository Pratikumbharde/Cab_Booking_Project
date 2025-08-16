import { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, connectSocket } from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Load user from token on initial load
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setAuthToken(storedToken);
          setToken(storedToken);
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          const sock = connectSocket(storedToken);
          setSocket(sock);
        } catch (err) {
          console.error('Failed to load user', err);
          // Only logout if it's a real authentication error, not network issues
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
      setAuthLoading(false);
    };

    loadUser();
  }, []);

  // Add visibility change listener to maintain session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token && !user) {
        // Page became visible and we have a token but no user - try to restore session
        const loadUser = async () => {
          try {
            setAuthToken(token);
            const res = await api.get('/auth/me');
            setUser(res.data.user);
            if (!socket) {
              const sock = connectSocket(token);
              setSocket(sock);
            }
          } catch (err) {
            console.error('Failed to restore user session', err);
            if (err.response && err.response.status === 401) {
              logout();
            }
          }
        };
        loadUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, user, socket]);

  // Login function for both users and vendors
async function login(email, password) {
  try {
    // Make sure we're using the correct endpoint
    const res = await api.post('/auth/login', { email, password });
    
    // Ensure the response has the expected structure
    if (res.data && res.data.token && res.data.user) {
      const { token, user } = res.data;
      
      // Store token and update state
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setAuthToken(token);

      // Connect socket with the new token
      const sock = connectSocket(token);
      setSocket(sock);

      return { success: true, user };
    } else {
      console.error('Unexpected response format:', res.data);
      return {
        success: false,
        message: 'Invalid response from server. Please try again.'
      };
    }
  } catch (err) {
    console.error('Login failed:', err);
    return {
      success: false,
      message: err.response?.data?.message || 'Login failed. Please check your credentials and try again.'
    };
  }
}

  // Register function for both users and vendors
  async function register(userData, userType) {
    try {
      const endpoint = userType === 'vendor' ? '/auth/vendor/register' : '/auth/user/register';
      const res = await api.post(endpoint, userData);
      
      const { token, user } = res.data;
      setToken(token);
      setUser(user);
      setAuthToken(token);
      localStorage.setItem('token', token);
      
      const sock = connectSocket(token);
      setSocket(sock);
      
      return { success: true, user };
    } catch (err) {
      console.error('Registration failed:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  }

  function logout() {
    setUser(null);
    setToken('');
    setAuthToken('');
    localStorage.removeItem('token');
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading,
      authLoading,
      login, 
      logout, 
      register,
      socket 
    }}>
      {!authLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
