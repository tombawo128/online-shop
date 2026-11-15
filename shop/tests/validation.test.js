import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOrderItems, validateProductInput } from '../src/lib/validation.js';

const validProduct = {
  name: 'Classic Oxford Shirt',
  gender: 'men',
  category: 'shirts',
  price: 34,
  originalPrice: 48,
  sizes: ['S', 'M', 'L'],
  colors: ['white', 'blue'],
  images: ['https://cdn.example.com/oxford.webp']
};

test('accepts a valid product draft', () => {
  assert.equal(validateProductInput(validProduct), null);
});

test('rejects invalid product pricing and department', () => {
  assert.match(validateProductInput({ ...validProduct, price: -2 }), /price/i);
  assert.match(validateProductInput({ ...validProduct, gender: 'all' }), /department/i);
});

test('rejects unsupported image URLs', () => {
  assert.match(validateProductInput({ ...validProduct, images: ['data:image/png;base64,abc'] }), /HTTP/i);
});

test('accepts valid UUID-based order items', () => {
  assert.equal(validateOrderItems([{
    id: '6f9619ff-8b86-d011-b42d-00cf4fc964ff',
    size: 'M',
    color: 'black',
    qty: 2
  }]), null);
});

test('rejects client-side demo IDs and excessive quantities', () => {
  assert.match(validateOrderItems([{ id: 'prod-1', size: 'M', color: 'black', qty: 1 }]), /live catalogue/i);
  assert.match(validateOrderItems([{
    id: '6f9619ff-8b86-d011-b42d-00cf4fc964ff',
    size: 'M',
    color: 'black',
    qty: 21
  }]), /quantity/i);
});
