import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchCartForUser,
  subscribeToCart,
  upsertCartForUser,
  waitForFirestoreReady
} from '../utils/firestoreData';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [syncing, setSyncing] = useState(false);
  const [flashCounter, setFlashCounter] = useState(0);

  const subscriptionRef = useRef(null);
  const latestCartRef = useRef(cartItems);

  /* Keep latest cart in localStorage */
  useEffect(() => {
    latestCartRef.current = cartItems;
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  /* Push cart updates to Firestore */
  const persistRemoteCart = useCallback(
    async (items) => {
      if (!user?.uid) return;
      try {
        await upsertCartForUser(user.uid, items);
      } catch (error) {
        console.error('Failed to sync cart with Firestore', error);
      }
    },
    [user?.uid]
  );

  const applyCartUpdate = useCallback(
    (updater) => {
      setCartItems((prevItems) => {
        const nextItems = typeof updater === 'function' ? updater(prevItems) : updater;
        persistRemoteCart(nextItems);
        return nextItems;
      });
    },
    [persistRemoteCart]
  );

  /* ------------------------
    Main Sync Logic
     ------------------------ */
  useEffect(() => {
    // Cleanup previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // If user not logged in → stop sync
    if (!isAuthenticated || !user?.uid) {
      return;
    }

    const startSync = async () => {
      if (authLoading) return; // Wait for Firebase Auth to load fully

      setSyncing(true);

      try {
        // The KEY FIX: Firestore requires a short delay after popup login
        await waitForFirestoreReady();

        // Fetch remote cart safely
        const remoteCart = await fetchCartForUser(user.uid);
        const localCart = latestCartRef.current;

        // Merge logic
        if ((remoteCart?.length ?? 0) === 0 && localCart.length > 0) {
          await upsertCartForUser(user.uid, localCart);
        } else if (remoteCart) {
          setCartItems(remoteCart);
        }

        // Subscribe to Firestore updates
        subscriptionRef.current = subscribeToCart(user.uid, (items) => {
          setCartItems((prevItems) => {
            const incoming = items ?? [];
            if (JSON.stringify(prevItems) === JSON.stringify(incoming)) {
              return prevItems;
            }
            return incoming;
          });
        });
      } catch (error) {
        const offline =
          error?.code === 'unavailable' ||
          error?.message?.toLowerCase?.().includes('offline');

        if (offline) {
          console.warn(
            'Cart sync skipped: Firestore client offline. Using local cart until reconnect.'
          );
        } else {
          console.error('Failed to initialize cart sync', error);
        }
      } finally {
        setSyncing(false);
      }
    };

    startSync();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [authLoading, isAuthenticated, user?.uid]);

  /* ------------------------
    Cart Operations
     ------------------------ */

  const addToCart = (product) => {
    applyCartUpdate((prevItems) => {
      const existing = prevItems.find((i) => i.id === product.id);

      if (existing) {
        return prevItems.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });

    setFlashCounter((c) => c + 1);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);

    applyCartUpdate((prevItems) =>
      prevItems.map((i) => (i.id === productId ? { ...i, quantity } : i))
    );
  };

  const removeFromCart = (productId) => {
    applyCartUpdate((prevItems) => prevItems.filter((i) => i.id !== productId));
  };

  const clearCart = () => applyCartUpdate([]);

  const getTotalItems = () =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
    flashCounter,
    syncing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
