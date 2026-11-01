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
const LOCAL_STORAGE_KEY_ACCOUNTS = 'urban_thread_accounts_v3';
const LOCAL_STORAGE_KEY_STORE_PRODUCTS = 'urban_thread_catalog_master_v1';

// Maximum admin accounts permitted in the system
export const MAX_ADMIN_ACCOUNTS = 2;

// Initial pre-configured accounts
const SEED_ACCOUNTS = [
  {
    id: 'admin_primary_01',
    name: 'Primary Administrator',
    email: 'admin@urbanthread.com',
    password: 'admin',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'customer_01',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    password: 'password123',
    role: 'customer',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export function StoreProvider({ children }) {
  // --- Accounts State (Persistent) ---
  const [accounts, setAccounts] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS));
      if (Array.isArray(stored) && stored.length > 0) {
        const hasAdmin = stored.some(a => a.role === 'admin');
        if (!hasAdmin) {
          return [SEED_ACCOUNTS[0], ...stored];
        }
        return stored;
      }
      return SEED_ACCOUNTS;
    } catch {
      return SEED_ACCOUNTS;
    }
  });

  // Sync Accounts to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to sync accounts to localStorage', e);
    }
  }, [accounts]);

  // Derived Admin Accounts & Quota Helpers
  const adminAccounts = useMemo(() => accounts.filter(a => a.role === 'admin'), [accounts]);
  const adminCount = adminAccounts.length;
  const canRegisterAdmin = adminCount < MAX_ADMIN_ACCOUNTS;

  // --- Real Live Products State (Synchronized across all users & pages) ---
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_STORE_PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      // First initialization: seed into persistent master store
      localStorage.setItem(LOCAL_STORAGE_KEY_STORE_PRODUCTS, JSON.stringify(seed));
      return seed;
    } catch {
      return seed;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync catalog updates across all open tabs and pages in real time
  const saveCatalog = useCallback((updatedList) => {
    setProducts(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_STORE_PRODUCTS, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('urban_thread_catalog_sync', { detail: updatedList }));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }, []);

  // Listen to cross-tab and cross-page catalog changes
  useEffect(() => {
    const handleCustomSync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };
    const handleStorageChange = (e) => {
      if (e.key === LOCAL_STORAGE_KEY_STORE_PRODUCTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProducts(parsed);
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    window.addEventListener('urban_thread_catalog_sync', handleCustomSync);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('urban_thread_catalog_sync', handleCustomSync);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
      if (!error && data && data.length > 0) {
        saveCatalog(data);
      }
    } catch {
      // Keep local persistent catalog
    } finally {
      setLoading(false);
    }
  }, [saveCatalog]);

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
        const suEmail = suUser.email?.toLowerCase();
        const isAdmin = adminAccounts.some(a => a.email.toLowerCase() === suEmail) || suEmail?.includes('admin');
        setUser(prev => ({
          id: suUser.id,
          email: suUser.email,
          name: suUser.user_metadata?.name || suUser.email.split('@')[0],
          role: isAdmin ? 'admin' : (prev?.role || 'customer'),
          isSupabase: true
        }));
      }
    }).catch(() => {
      setSession(null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess || null);
      if (sess?.user) {
        const suEmail = sess.user.email?.toLowerCase();
        const isAdmin = adminAccounts.some(a => a.email.toLowerCase() === suEmail) || suEmail?.includes('admin');
        setUser({
          id: sess.user.id,
          email: sess.user.email,
          name: sess.user.user_metadata?.name || sess.user.email.split('@')[0],
          role: isAdmin ? 'admin' : 'customer',
          isSupabase: true
        });
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [adminAccounts]);

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

  // --- Authentication Actions ---
  const login = useCallback(async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      addToast('Please enter both email and password.', 'error');
      return { success: false, error: 'Email and password are required.' };
    }

    // 1. Supabase attempt if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });
        if (!error && data?.user) {
          const isAdm = adminAccounts.some(a => a.email.toLowerCase() === cleanEmail) || cleanEmail.includes('admin');
          const role = isAdm ? 'admin' : 'customer';

          const u = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
            role,
            isSupabase: true
          };
          setUser(u);
          addToast(`Welcome back, ${u.name}!`, 'success');
          return { success: true, user: u };
        }
      } catch (err) {
        console.warn('Supabase signin attempt notice:', err);
      }
    }

    // 2. Check Accounts Registry
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    // Primary admin default check
    if (cleanEmail === 'admin@urbanthread.com' && (cleanPassword === 'admin' || cleanPassword === 'admin2026')) {
      const adminUser = existing || {
        id: 'admin_primary_01',
        name: 'Primary Administrator',
        email: 'admin@urbanthread.com',
        role: 'admin'
      };
      setUser(adminUser);
      addToast(`Welcome back, ${adminUser.name}!`, 'success');
      return { success: true, user: adminUser };
    }

    if (existing) {
      if (existing.password && existing.password !== cleanPassword) {
        addToast('Incorrect password.', 'error');
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      setUser(existing);
      addToast(`Welcome back, ${existing.name}!`, 'success');
      return { success: true, user: existing };
    }

    // 3. Register on login fallback if account not found
    if (cleanPassword.length >= 4) {
      const newCustomer = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
        password: cleanPassword,
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      setAccounts(prev => [...prev, newCustomer]);
      setUser(newCustomer);
      addToast(`Welcome back, ${newCustomer.name}!`, 'success');
      return { success: true, user: newCustomer };
    }

    addToast('Invalid credentials. Password must be at least 4 characters.', 'error');
    return { success: false, error: 'Invalid email or password.' };
  }, [accounts, adminAccounts, addToast]);

  const signup = useCallback(async (name, email, password, role = 'customer') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return { success: false, error: 'A valid email address is required.' };
    }
    if (cleanPassword.length < 4) {
      addToast('Password must be at least 4 characters.', 'error');
      return { success: false, error: 'Password must contain at least 4 characters.' };
    }

    // Check if account already exists
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      const msg = 'An account with this email already exists. Please sign in instead.';
      addToast(msg, 'error');
      return { success: false, error: msg };
    }

    // STRICT CHECK: Maximum 2 admin accounts allowed
    if (role === 'admin') {
      const currentAdmins = accounts.filter(a => a.role === 'admin');
      if (currentAdmins.length >= MAX_ADMIN_ACCOUNTS) {
        const msg = `Admin registration closed: Maximum limit of ${MAX_ADMIN_ACCOUNTS} admin accounts has already been reached.`;
        addToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    if (supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: { name: cleanName, role }
          }
        });
      } catch (err) {
        console.warn('Supabase signup notice:', err);
      }
    }

    const newAccount = {
      id: role === 'admin' ? `adm_${Date.now()}` : `usr_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      password: cleanPassword,
      role,
      createdAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAccount]);
    setUser(newAccount);

    if (role === 'admin') {
      addToast(`Admin account registered successfully!`, 'success');
    } else {
      addToast(`Welcome to Urban Thread, ${cleanName}!`, 'success');
    }

    return { success: true, user: newAccount };
  }, [accounts, addToast]);

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

  // Remove an admin account
  const deleteAdminAccount = useCallback((adminId) => {
    const currentAdmins = accounts.filter(a => a.role === 'admin');
    if (currentAdmins.length <= 1) {
      addToast('Cannot remove the primary admin account. At least 1 admin is required.', 'error');
      return { success: false, error: 'At least 1 admin account must remain.' };
    }

    const target = accounts.find(a => a.id === adminId && a.role === 'admin');
    if (!target) {
      addToast('Admin account not found.', 'error');
      return { success: false, error: 'Admin account not found.' };
    }

    setAccounts(prev => prev.filter(a => a.id !== adminId));

    if (user?.id === adminId) {
      setUser(null);
      setSession(null);
    }

    addToast(`Admin account "${target.name}" removed. 1 admin slot freed.`, 'info');
    return { success: true };
  }, [accounts, user, addToast]);

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
  // Any product uploaded, updated, or deleted by the admin immediately reflects across all users and pages
  const addProduct = useCallback(async (productData) => {
    const newProd = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      rating: 5.0,
      reviewCount: 0,
      isNew: true,
      ...productData
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').insert([newProd]).select();
        if (!error && data?.[0]) {
          saveCatalog([data[0], ...products]);
          addToast('Product published to store!', 'success');
          return data[0];
        }
      } catch (e) {
        console.warn('Supabase insert notice:', e);
      }
    }

    saveCatalog([newProd, ...products]);
    addToast('Product published to store!', 'success');
    return newProd;
  }, [products, saveCatalog, addToast]);

  const updateProduct = useCallback(async (id, updates) => {
    if (supabase) {
      try {
        await supabase.from('products').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase update notice:', e);
      }
    }
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    saveCatalog(updated);
    addToast('Product updated successfully!', 'success');
  }, [products, saveCatalog, addToast]);

  const deleteProduct = useCallback(async (id) => {
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete notice:', e);
      }
    }
    const updated = products.filter(p => p.id !== id);
    saveCatalog(updated);
    setCart(prev => prev.filter(item => item.id !== id));
    setWishlist(prev => prev.filter(wId => wId !== id));
    addToast('Product removed from store.', 'info');
  }, [products, saveCatalog, addToast]);

  // Reset catalogue helper (if store admin needs to restore defaults)
  const resetCatalog = useCallback(() => {
    saveCatalog(seed);
    addToast('Store catalogue reset to initial collection.', 'info');
  }, [saveCatalog, addToast]);

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
        resetCatalog,
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
        add: addToCart,
        setQty,
        removeFromCart,
        clearCart,
        clear: clearCart,
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

        // User & Accounts & Quotas
        user,
        session,
        accounts,
        adminAccounts,
        adminCount,
        maxAdmins: MAX_ADMIN_ACCOUNTS,
        canRegisterAdmin,
        deleteAdminAccount,
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
