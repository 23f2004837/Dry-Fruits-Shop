import { createContext, useContext } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // No authentication - all users can access the app
  const value = {
    user: null,
    loading: false,
    isAuthenticated: false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
