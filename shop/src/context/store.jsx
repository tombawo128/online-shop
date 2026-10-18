import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { seed } from '../lib/seed.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const LOCAL_STORAGE_KEY_CART = 'urban_thread_cart_v2';
const LOCAL_STORAGE_KEY_WISHLIST = 'urban_thread_wishlist_v2';
const LOCAL_STORAGE_KEY_USER = 'urban_thread_user_v2';
const LOCAL_STORAGE_KEY_ORDERS = 'urban_thread_orders_v2';
const LOCAL_STORAGE_KEY_LOCAL_PRODUCTS = 'urban_thread_custom_products_v2';

export function StoreProvider({ children }) {
  // --- Products State ---
  const [products, setProducts] = useState(() => {
    try {
      const localCustom = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LOCAL_PRODUCTS)) || [];
      return [...localCustom, ...seed];
    } catch {
      return seed;
    }
  });
  const [loading, setLoading] = useState(true);

  // --- Cart State ---
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_CART)) || [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // --- Wishlist State ---
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_WISHLIST)) || [];
    } catch {
      return [];
    }
  });

  // --- Orders State ---
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS)) || [];
    } catch {
      return [];
    }
  });

  // --- Auth State ---
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_USER)) || null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState(undefined);

  // --- Toasts State ---
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- Load Products from Supabase or Fallback ---
  const loadProducts = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        // Fallback to local stored + seed
        setLoading(false);
      } else {
        setProducts(data);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist', e);
    }
  }, [wishlist]);

  // Sync User to LocalStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
      }
    } catch (e) {
      console.warn('Failed to sync user', e);
    }
  }, [user]);

  // Sync Orders to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to sync orders', e);
    }
  }, [orders]);

  // --- Supabase Auth Session listener ---
  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
      if (data?.session?.user) {
        const suUser = data.session.user;
        setUser(prev => ({
          id: suUser.id,
          email: suUser.email,
          name: suUser.user_metadata?.name || suUser.email.split('@')[0],
          role: suUser.email?.includes('admin') ? 'admin' : (prev?.role || 'customer'),
          isSupabase: true
        }));
      }
    }).catch(() => {
      setSession(null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess || null);
      if (sess?.user) {
        setUser({
          id: sess.user.id,
          email: sess.user.email,
          name: sess.user.user_metadata?.name || sess.user.email.split('@')[0],
          role: sess.user.email?.includes('admin') ? 'admin' : 'customer',
          isSupabase: true
        });
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // --- Search Engine (Fuse.js) ---
  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ['name', 'category', 'gender', 'description', 'colors'],
      threshold: 0.35,
      ignoreLocation: true
    });
  }, [products]);

  // --- Cart Actions ---
  const addToCart = useCallback((item, openDrawer = true) => {
    const key = `${item.id}-${item.size}-${item.color}`;
    setCart(prev => {
      const existing = prev.find(x => x.key === key);
      if (existing) {
        return prev.map(x => x.key === key ? { ...x, qty: x.qty + item.qty } : x);
      }
      return [...prev, { ...item, key }];
    });
    addToast(`Added "${item.name}" to bag`, 'success');
    if (openDrawer) {
      setIsCartOpen(true);
    }
  }, [addToast]);

  const setQty = useCallback((key, qty) => {
    setCart(prev => {
      if (qty < 1) {
        return prev.filter(x => x.key !== key);
      }
      return prev.map(x => x.key === key ? { ...x, qty } : x);
    });
  }, []);

  const removeFromCart = useCallback((key) => {
    setCart(prev => prev.filter(x => x.key !== key));
    addToast('Item removed from bag', 'info');
  }, [addToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // --- Promo Code ---
  const applyPromoCode = useCallback((code) => {
    const clean = (code || '').trim().toUpperCase();
    if (clean === 'URBAN15' || clean === 'WELCOME15') {
      setDiscountCode(clean);
      setDiscountPercent(15);
      addToast('Promo code applied: 15% OFF!', 'success');
      return { success: true, message: '15% discount applied!' };
    } else if (clean === 'VIP20') {
      setDiscountCode(clean);
      setDiscountPercent(20);
      addToast('VIP code applied: 20% OFF!', 'success');
      return { success: true, message: '20% VIP discount applied!' };
    } else {
      addToast('Invalid promo code. Try "URBAN15"', 'error');
      return { success: false, message: 'Invalid or expired promo code' };
    }
  }, [addToast]);

  const removePromoCode = useCallback(() => {
    setDiscountCode('');
    setDiscountPercent(0);
    addToast('Promo code removed', 'info');
  }, [addToast]);

  // --- Wishlist Actions ---
  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      addToast(exists ? 'Removed from wishlist' : 'Saved to wishlist ♥', 'info');
      return updated;
    });
  }, [addToast]);

  const isWishlisted = useCallback((productId) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  // --- Authentication Actions (Supabase + Instant Demo Fallback) ---
  const login = useCallback(async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if Supabase client is connected
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (!error && data?.user) {
          const u = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
            role: cleanEmail.includes('admin') ? 'admin' : 'customer',
            isSupabase: true
          };
          setUser(u);
          addToast(`Welcome back, ${u.name}!`, 'success');
          return { success: true, user: u };
        }
      } catch (err) {
        console.warn('Supabase signin failed, attempting fallback', err);
      }
    }

    // Instant Seamless Fallback (Allows testing without setup headaches)
    if (password.length >= 4) {
      const isAdm = cleanEmail.includes('admin') || cleanEmail === 'admin@urbanthread.com';
      const fallbackUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        name: isAdm ? 'Admin Manager' : cleanEmail.split('@')[0].replace(/[._]/g, ' '),
        role: isAdm ? 'admin' : 'customer',
        isSupabase: false
      };
      setUser(fallbackUser);
      addToast(`Welcome back, ${fallbackUser.name}!`, 'success');
      return { success: true, user: fallbackUser };
    }

    addToast('Invalid credentials. Password must be at least 4 characters.', 'error');
    return { success: false, error: 'Invalid email or password' };
  }, [addToast]);

  const signup = useCallback(async (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name: cleanName }
          }
        });
        if (!error && data?.user) {
          const u = {
            id: data.user.id,
            email: data.user.email,
            name: cleanName,
            role: cleanEmail.includes('admin') ? 'admin' : 'customer',
            isSupabase: true
          };
          setUser(u);
          addToast(`Account created! Welcome, ${cleanName}!`, 'success');
          return { success: true, user: u };
        }
      } catch (err) {
        console.warn('Supabase signup failed, using instant fallback', err);
      }
    }

    // Fallback account creation
    const newUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: cleanName,
      role: cleanEmail.includes('admin') ? 'admin' : 'customer',
      isSupabase: false
    };
    setUser(newUser);
    addToast(`Account created successfully! Welcome to Urban Thread, ${cleanName}!`, 'success');
    return { success: true, user: newUser };
  }, [addToast]);

  const logout = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    setUser(null);
    setSession(null);
    addToast('Signed out successfully.', 'info');
  }, [addToast]);

  // --- Order Placement ---
  const saveOrder = useCallback(async (orderData) => {
    const newOrder = {
      ...orderData,
      id: 'ord-' + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      user_id: user?.id || null,
      user_email: user?.email || orderData.email || null,
      status: 'pending'
    };

    if (supabase) {
      try {
        await supabase.from('orders').insert([newOrder]);
      } catch (e) {
        console.warn('Could not save order to Supabase:', e);
      }
    }

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, [user]);

  // --- Product Management (Admin) ---
  const addProduct = useCallback(async (productData) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').insert([productData]).select();
        if (!error && data?.[0]) {
          setProducts(prev => [data[0], ...prev]);
          addToast('Product published to store!', 'success');
          return data[0];
        }
      } catch (e) {
        console.warn('Supabase insert failed', e);
      }
    }

    // Local state fallback
    const localNew = {
      id: 'custom-' + Date.now(),
      created_at: new Date().toISOString(),
      ...productData
    };
    setProducts(prev => [localNew, ...prev]);
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LOCAL_PRODUCTS)) || [];
      localStorage.setItem(LOCAL_STORAGE_KEY_LOCAL_PRODUCTS, JSON.stringify([localNew, ...existing]));
    } catch (e) {
      console.warn(e);
    }
    addToast('Product added successfully!', 'success');
    return localNew;
  }, [addToast]);

  const updateProduct = useCallback(async (id, updates) => {
    if (supabase) {
      try {
        await supabase.from('products').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase update failed', e);
      }
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addToast('Product updated successfully!', 'success');
  }, [addToast]);

  const deleteProduct = useCallback(async (id) => {
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete failed', e);
      }
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LOCAL_PRODUCTS)) || [];
      localStorage.setItem(LOCAL_STORAGE_KEY_LOCAL_PRODUCTS, JSON.stringify(existing.filter(p => p.id !== id)));
    } catch (e) {
      console.warn(e);
    }
    addToast('Product removed.', 'info');
  }, [addToast]);

  // --- Computed Cart Totals ---
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * discountPercent) / 100, [subtotal, discountPercent]);
  const shippingThreshold = 75;
  const shippingFee = subtotal >= shippingThreshold || subtotal === 0 ? 0 : 8.50;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const count = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const wishlistCount = wishlist.length;

  return (
    <StoreContext.Provider
      value={{
        // Products
        products,
        loading,
        loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        fuse,

        // Cart
        cart,
        count,
        subtotal,
        discountCode,
        discountPercent,
        discountAmount,
        shippingFee,
        shippingThreshold,
        total,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        add: addToCart, // Backwards compatibility
        setQty,
        removeFromCart,
        clearCart,
        clear: clearCart, // Backwards compatibility
        applyPromoCode,
        removePromoCode,

        // Wishlist
        wishlist,
        wishlistCount,
        toggleWishlist,
        isWishlisted,

        // Orders
        orders,
        saveOrder,

        // User & Auth
        user,
        session,
        isSupabaseConfigured,
        login,
        signup,
        logout,

        // Toasts
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
