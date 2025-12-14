import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { signInWithPopup, signOut, onIdTokenChanged } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const applyFirebaseUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      localStorage.removeItem("user");
      setToken(null);
      localStorage.removeItem("token");
      return;
    }

    const idToken = await firebaseUser.getIdToken();
    setToken(idToken);
    localStorage.setItem("token", idToken);

    const profile = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photo: firebaseUser.photoURL,
      provider: firebaseUser.providerData?.[0]?.providerId,
      createdAt: firebaseUser.metadata?.creationTime,
      lastLoginAt: firebaseUser.metadata?.lastSignInTime
    };

    setUser(profile);
    localStorage.setItem("user", JSON.stringify(profile));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await applyFirebaseUser(result.user);
      return 'popup';
    } catch (error) {
      console.error("Popup login failed:", error);
      throw error;
    }
  }, [applyFirebaseUser]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      await applyFirebaseUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [applyFirebaseUser]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(user?.uid),
    loginWithGoogle,
    logout,
  }), [user, token, loading, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
