export const config = {
  storeName: 'Urban Thread',
  currency: '$',
  whatsapp: (import.meta.env.VITE_SELLER_WHATSAPP || '').replace(/\D/g, ''),
  adminPath: import.meta.env.VITE_ADMIN_PATH || '/admin'
};

export const money = (n) => config.currency + Number(n).toFixed(2);
