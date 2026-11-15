import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { seed } from '../lib/seed.js';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const LOCAL_STORAGE_KEY_CART = 'urban_thread_cart_v2';
const LOCAL_STORAGE_KEY_WISHLIST = 'urban_thread_wishlist_v2';

// Maximum admin accounts permitted in the system
export const MAX_ADMIN_ACCOUNTS = 2;

function normalizeProduct(row) {
  return {
    ...row,
    originalPrice: row.original_price ?? row.originalPrice ?? null,
    reviewCount: row.review_count ?? row.reviewCount ?? 0,
    isNew: row.is_new ?? row.isNew ?? false,
    inventoryTracking: row.inventory_tracking ?? row.inventoryTracking ?? false,
    soldout: row.soldout || []
  };
}

function productPayload(product) {
  return {
    name: String(product.name || '').trim(),
    description: String(product.description || '').trim(),
    gender: product.gender,
    category: String(product.category || '').trim(),
    price: Number(product.price),
    original_price: product.originalPrice === '' || product.originalPrice == null ? null : Number(product.originalPrice),
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    soldout: Array.isArray(product.soldout) ? product.soldout : [],
    images: Array.isArray(product.images) ? product.images : [],
    is_new: Boolean(product.isNew),
    inventory_tracking: Boolean(product.inventoryTracking)
  };
}

export function StoreProvider({ children }) {
  // --- Accounts State (Persistent) ---
  // Account identities and roles are resolved from Supabase Auth and user_roles.
  // Never persist passwords, sessions, or administrator claims in browser storage.
  const [accounts, setAccounts] = useState([]);

  // Derived Admin Accounts & Quota Helpers
  const adminAccounts = useMemo(() => accounts.filter(a => a.role === 'admin'), [accounts]);
  const adminCount = adminAccounts.length;
  const canRegisterAdmin = false; // Admin roles are provisioned out-of-band by a trusted project owner.

  // --- Real Live Products State (Synchronized across all users & pages) ---
  const [products, setProducts] = useState(() => (supabase ? [] : seed));
  const [loading, setLoading] = useState(true);

  // Sync catalog updates across all open tabs and pages in real time
  const saveCatalog = useCallback((updatedList) => {
    setProducts(updatedList);
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
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);

  // --- Auth State ---
  const [user, setUser] = useState(null);
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

  // --- Load the authoritative catalogue from Supabase ---
  const loadProducts = useCallback(async () => {
    if (!supabase) {
      setProducts(seed);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      saveCatalog((data || []).map(normalizeProduct));
    } catch (error) {
      console.error('Could not load the product catalogue:', error);
      addToast('The store catalogue could not be loaded. Please refresh and try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [saveCatalog, addToast]);

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

  // --- Supabase Auth and trusted role resolution ---
  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setUser(null);
      setAccounts([]);
      return undefined;
    }

    const applySession = (activeSession) => {
      setSession(activeSession || null);
      if (!activeSession?.user) {
        setUser(null);
        setAccounts([]);
        setOrders([]);
        setInventory([]);
        return;
      }

      const authUser = activeSession.user;
      const baseUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Customer',
        role: 'customer',
        isSupabase: true
      };
      setUser(baseUser);

      // Resolve privileges from the protected database role table, never from email text or metadata.
      Promise.resolve().then(async () => {
        const { data: roleRecord, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .maybeSingle();

        const resolvedUser = {
          ...baseUser,
          role: !roleError && roleRecord?.role === 'admin' ? 'admin' : 'customer'
        };
        setUser(current => current?.id === authUser.id ? resolvedUser : current);
        setAccounts(resolvedUser.role === 'admin' ? [resolvedUser] : []);
        if (resolvedUser.role === 'admin') {
          const { data: inventoryRows, error: inventoryError } = await supabase
            .from('product_inventory')
            .select('*')
            .order('updated_at', { ascending: false });
          if (!inventoryError) setInventory(inventoryRows || []);
        } else {
          setInventory([]);
        }

        const { data: orderRows, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!ordersError) {
          setOrders(orderRows || []);
        } else {
          console.warn('Could not load customer orders:', ordersError);
        }
      });
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn('Could not restore authentication session:', error);
      applySession(data?.session || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, activeSession) => {
      queueMicrotask(() => applySession(activeSession));
    });

    return () => listener?.subscription?.unsubscribe();
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
    const safeQty = Math.min(20, Math.floor(Number(qty) || 0));
    setCart(prev => {
      if (safeQty < 1) return prev.filter(item => item.key !== key);
      return prev.map(item => item.key === key ? { ...item, qty: safeQty } : item);
    });
  }, []);

  const removeFromCart = useCallback((key) => {
    setCart(prev => prev.filter(x => x.key !== key));
    addToast('Item removed from bag', 'info');
  }, [addToast]);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountCode('');
    setDiscountPercent(0);
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

  // --- Authentication Actions: Supabase is the only account authority ---
  const login = useCallback(async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!supabase) {
      return { success: false, error: 'Account sign-in is temporarily unavailable because the store authentication service is not configured.' };
    }
    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    if (error || !data?.user) {
      const message = error?.message || 'Unable to sign in. Please check your details.';
      addToast(message, 'error');
      return { success: false, error: message };
    }

    const { data: roleRecord } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();
    const signedInUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Customer',
      role: roleRecord?.role === 'admin' ? 'admin' : 'customer',
      isSupabase: true
    };
    setUser(signedInUser);
    setAccounts(signedInUser.role === 'admin' ? [signedInUser] : []);
    addToast(`Welcome back, ${signedInUser.name}!`, 'success');
    return { success: true, user: signedInUser };
  }, [addToast]);

  const signup = useCallback(async (name, email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    if (!supabase) {
      return { success: false, error: 'Account registration is unavailable because the store authentication service is not configured.' };
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (String(password || '').length < 10) {
      return { success: false, error: 'Use a password containing at least 10 characters.' };
    }
    if (!cleanName || cleanName.length > 100) {
      return { success: false, error: 'Please enter your name (maximum 100 characters).' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName } }
    });
    if (error) {
      addToast(error.message, 'error');
      return { success: false, error: error.message };
    }
    if (data?.session && data?.user) {
      const signedUpUser = {
        id: data.user.id,
        email: data.user.email,
        name: cleanName,
        role: 'customer',
        isSupabase: true
      };
      setUser(signedUpUser);
    }
    addToast(data?.session ? 'Your account has been created.' : 'Check your email to confirm your account.', 'success');
    return { success: true, user: data?.session ? data.user : null, requiresEmailConfirmation: !data?.session };
  }, [addToast]);

  // Administrator privileges are provisioned by a trusted project owner in Supabase.
  const deleteAdminAccount = useCallback(() => ({
    success: false,
    error: 'Administrator roles must be managed by a trusted database owner.'
  }), []);

  const logout = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addToast('Could not sign out. Please try again.', 'error');
        return { success: false, error: error.message };
      }
    }
    setUser(null);
    setSession(null);
    setAccounts([]);
    setOrders([]);
    addToast('Signed out successfully.', 'info');
    return { success: true };
  }, [addToast]);

  // --- Order Placement: all prices and totals are recalculated by PostgreSQL ---
  const saveOrder = useCallback(async (orderData) => {
    if (!supabase) {
      throw new Error('Checkout is unavailable until the store database is configured.');
    }
    const { data, error } = await supabase.rpc('place_store_order', {
      p_customer_name: orderData.customer_name,
      p_customer_email: orderData.customer_email || user?.email || null,
      p_phone: orderData.phone,
      p_state: orderData.state,
      p_location: orderData.location,
      p_notes: orderData.notes || null,
      p_items: (orderData.items || []).map(item => ({
        id: item.id,
        size: item.size,
        color: item.color,
        qty: item.qty
      })),
      p_discount_code: orderData.discount_code || null
    });
    if (error) {
      console.error('Order creation failed:', error);
      throw new Error(error.message || 'The order could not be recorded.');
    }
    const createdOrder = data;
    setOrders(prev => [createdOrder, ...prev.filter(order => order.id !== createdOrder.id)]);
    return createdOrder;
  }, [user]);

  // --- Product Management: writes require a database-verified administrator role ---
  const requireAdmin = () => {
    if (!supabase || user?.role !== 'admin') {
      throw new Error('Only an authenticated store administrator can manage products.');
    }
  };

  const saveInventoryVariant = useCallback(async (productId, size, color, quantity) => {
    try {
      requireAdmin();
      const safeQuantity = Math.floor(Number(quantity));
      if (!productId || !size || !color || !Number.isInteger(safeQuantity) || safeQuantity < 0 || safeQuantity > 100000) {
        throw new Error('Enter a valid variant and stock quantity between 0 and 100,000.');
      }
      const { data, error } = await supabase.rpc('set_product_inventory', {
        p_product_id: productId,
        p_size: String(size).trim(),
        p_color: String(color).trim(),
        p_quantity: safeQuantity
      });
      if (error) throw error;
      setInventory(prev => [
        data,
        ...prev.filter(row => !(row.product_id === productId && row.size === size && row.color === color))
      ]);
      const product = products.find(item => item.id === productId);
      if (product && !product.inventoryTracking) {
        saveCatalog(products.map(item => item.id === productId
          ? { ...item, inventoryTracking: true }
          : item));
      }
      addToast('Variant inventory saved.', 'success');
      return data;
    } catch (error) {
      addToast(error.message || 'Inventory could not be saved.', 'error');
      throw error;
    }
  }, [products, saveCatalog, addToast, user]);

  const addProduct = useCallback(async (productData) => {
    try {
      requireAdmin();
      const payload = productPayload(productData);
      if (!payload.name || !['women', 'men'].includes(payload.gender) || !Number.isFinite(payload.price) || payload.price < 0) {
        throw new Error('Enter a valid product name, department and price.');
      }
      const { data, error } = await supabase.from('products').insert(payload).select('*').single();
      if (error) throw error;
      const savedProduct = normalizeProduct(data);
      saveCatalog([savedProduct, ...products]);
      addToast('Product published to store!', 'success');
      return savedProduct;
    } catch (error) {
      addToast(error.message || 'Product could not be published.', 'error');
      throw error;
    }
  }, [products, saveCatalog, addToast, user]);

  const updateProduct = useCallback(async (id, updates) => {
    try {
      requireAdmin();
      const payload = productPayload({ ...products.find(product => product.id === id), ...updates });
      const { data, error } = await supabase.from('products').update(payload).eq('id', id).select('*').single();
      if (error) throw error;
      const savedProduct = normalizeProduct(data);
      saveCatalog(products.map(product => product.id === id ? savedProduct : product));
      addToast('Product updated successfully!', 'success');
      return savedProduct;
    } catch (error) {
      addToast(error.message || 'Product could not be updated.', 'error');
      throw error;
    }
  }, [products, saveCatalog, addToast, user]);

  const deleteProduct = useCallback(async (id) => {
    try {
      requireAdmin();
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      saveCatalog(products.filter(product => product.id !== id));
      setCart(prev => prev.filter(item => item.id !== id));
      setWishlist(prev => prev.filter(wishlistedId => wishlistedId !== id));
      addToast('Product removed from store.', 'info');
      return { success: true };
    } catch (error) {
      addToast(error.message || 'Product could not be deleted.', 'error');
      throw error;
    }
  }, [products, saveCatalog, addToast, user]);

  const resetCatalog = useCallback(() => {
    addToast('Bulk catalogue reset is disabled to protect live products.', 'error');
    return { success: false };
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
        resetCatalog,
        inventory,
        saveInventoryVariant,
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
