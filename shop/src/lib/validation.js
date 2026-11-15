export function validateProductInput(product) {
  const name = String(product?.name || '').trim();
  const gender = String(product?.gender || '');
  const price = Number(product?.price);
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const images = Array.isArray(product?.images) ? product.images : [];

  if (name.length < 2 || name.length > 160) return 'Product name must contain 2 to 160 characters.';
  if (!['women', 'men'].includes(gender)) return 'Select a valid product department.';
  if (!Number.isFinite(price) || price < 0 || price > 10000000) return 'Enter a valid product price.';
  if (!sizes.length || sizes.length > 30 || sizes.some(value => !String(value).trim())) return 'Add at least one valid size.';
  if (!colors.length || colors.length > 30 || colors.some(value => !String(value).trim())) return 'Add at least one valid colour.';
  if (images.length > 8 || images.some(value => !/^https?:\/\//i.test(String(value)))) return 'Use up to 8 valid HTTP(S) product image URLs.';
  const originalPrice = product?.originalPrice === '' || product?.originalPrice == null ? null : Number(product.originalPrice);
  if (originalPrice != null && (!Number.isFinite(originalPrice) || originalPrice < price)) return 'The original price must be greater than or equal to the current price.';
  return null;
}

export function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) return 'An order must contain between 1 and 30 items.';
  for (const item of items) {
    if (!/^[0-9a-f-]{36}$/i.test(String(item?.id || ''))) return 'One or more products are not available from the live catalogue.';
    if (!Number.isInteger(Number(item?.qty)) || Number(item.qty) < 1 || Number(item.qty) > 20) return 'Each item quantity must be between 1 and 20.';
    if (!String(item?.size || '').trim() || !String(item?.color || '').trim()) return 'Choose a size and colour for every item.';
  }
  return null;
}
