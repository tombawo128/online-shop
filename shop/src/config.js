export const config={storeName:'Urban Thread',currency:'$',whatsapp:(import.meta.env.VITE_SELLER_WHATSAPP||'2340000000000').replace(/\D/g,''),adminPath:import.meta.env.VITE_ADMIN_PATH||'/manage-change-this'};
export const money=n=>config.currency+Number(n).toFixed(2);
