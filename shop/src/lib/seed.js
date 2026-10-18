const S = ['XS', 'S', 'M', 'L', 'XL'];
const N = ['38', '39', '40', '41', '42', '43', '44'];

export const seed = [
  {
    id: 'prod-1',
    name: 'Linen Summer Dress',
    gender: 'women',
    category: 'dresses',
    price: 48,
    originalPrice: 65,
    sizes: S,
    colors: ['oatmeal', 'noir', 'sage'],
    soldout: ['XS'],
    rating: 4.9,
    reviewCount: 38,
    isNew: true,
    description: 'Crafted from 100% natural airy French flax linen. Features delicate mother-of-pearl buttons, a flattering cinched waist tie, and hidden side seam pockets for effortless summer refinement.',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prod-2',
    name: 'Classic Silk-Blend Blouse',
    gender: 'women',
    category: 'tops',
    price: 38,
    originalPrice: 50,
    sizes: S,
    colors: ['ivory', 'black', 'rose'],
    soldout: [],
    rating: 4.8,
    reviewCount: 24,
    isNew: false,
    description: 'A luxurious drape in breathable mulberry silk and organic cotton blend. Designed with a clean Mandarin collar, soft dropped shoulders, and subtle cuff gathers for a polished silhouette.',
    images: [
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'prod-3',
    name: 'High-Waist Tailored Trousers',
    gender: 'women',
    category: 'trousers',
    price: 54,
    originalPrice: 72,
    sizes: S,
    colors: ['slate', 'camel', 'midnight'],
    soldout: ['XL'],
    rating: 5.0,
    reviewCount: 42,
    isNew: true,
    description: 'Impeccably tailored wide-leg trousers cut in structured mid-weight drape fabric. Features front double pleats, high-rise contoured waistband, and welt back pockets.',
    images: [
      'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'prod-4',
    name: 'Ribbed Cashmere-Blend Cardigan',
    gender: 'women',
    category: 'tops',
    price: 68,
    originalPrice: 85,
    sizes: S,
    colors: ['beige', 'charcoal', 'taupe'],
    soldout: [],
    rating: 4.9,
    reviewCount: 19,
    isNew: false,
    description: 'Ultra-soft spun Mongolian cashmere blended with extra-fine merino wool. Rib-knit trims, tortoiseshell buttons, and a relaxed boxy cut make it an indispensable layering piece.',
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'prod-5',
    name: 'Pleated Satin Midi Skirt',
    gender: 'women',
    category: 'skirts',
    price: 45,
    originalPrice: 60,
    sizes: S,
    colors: ['champagne', 'emerald', 'black'],
    soldout: ['XS'],
    rating: 4.7,
    reviewCount: 31,
    isNew: false,
    description: 'Sunburst accordion pleats caught in fluid satin with a luminous pearlescent sheen. Features a hidden elastic comfort waistband that flows gracefully with every stride.',
    images: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582142306909-195724d33ffc?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'prod-6',
    name: 'Italian Leather Chelsea Boots',
    gender: 'women',
    category: 'shoes',
    price: 110,
    originalPrice: 140,
    sizes: N,
    colors: ['black', 'cognac'],
    soldout: ['38'],
    rating: 5.0,
    reviewCount: 52,
    isNew: true,
    description: 'Handcrafted full-grain Tuscan leather Chelsea boot with elasticated goring and reinforced pull tabs. Features stacked leather bevel heel and cushioned arch-support insole.',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'prod-7',
    name: 'Structured Wool Trench Coat',
    gender: 'women',
    category: 'jackets',
    price: 145,
    originalPrice: 180,
    sizes: S,
    colors: ['camel', 'black', 'houndstooth'],
    soldout: ['L'],
    rating: 4.9,
    reviewCount: 29,
    isNew: true,
    description: 'A contemporary take on the timeless belted trench. Heavyweight virgin wool blend, storm flap, horn buckles, and satin lining engineered for wind resistance and warm sophistication.',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'prod-8',
    name: 'Tailored Oxford Cotton Shirt',
    gender: 'men',
    category: 'tops',
    price: 42,
    originalPrice: 55,
    sizes: S,
    colors: ['sky-blue', 'white', 'stripes'],
    soldout: [],
    rating: 4.8,
    reviewCount: 46,
    isNew: false,
    description: 'Woven from two-ply 80s organic cotton oxford cloth. Crisp button-down collar, box pleat with locker loop, and durable natural shell buttons. Designed to soften gracefully with each wash.',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'prod-9',
    name: 'Premium Slim-Fit Chinos',
    gender: 'men',
    category: 'trousers',
    price: 49,
    originalPrice: 65,
    sizes: S,
    colors: ['sand', 'charcoal', 'olive'],
    soldout: ['XL'],
    rating: 4.9,
    reviewCount: 37,
    isNew: false,
    description: 'Precision-tailored from combed cotton twill with 2% elastane for seamless flex. Clean front, coin pocket, and vintage wash for a lived-in softness from day one.',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'prod-10',
    name: 'Heavyweight Organic Crew T-Shirt',
    gender: 'men',
    category: 'tops',
    price: 26,
    originalPrice: 32,
    sizes: S,
    colors: ['chalk-white', 'faded-black', 'heather'],
    soldout: [],
    rating: 4.9,
    reviewCount: 65,
    isNew: false,
    description: '240 GSM heavy jersey spun from 100% GOTS-certified combed organic cotton. Preshrunk with a tight 1x1 rib collar that holds shape forever. An essential foundational tee.',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 9).toISOString()
  },
  {
    id: 'prod-11',
    name: 'Vintage Selvedge Denim Jacket',
    gender: 'men',
    category: 'jackets',
    price: 89,
    originalPrice: 110,
    sizes: S,
    colors: ['indigo', 'washed-black'],
    soldout: [],
    rating: 4.9,
    reviewCount: 28,
    isNew: true,
    description: '13.5oz Japanese shuttle-loom selvedge denim. Antique brass shank buttons, side waist adjuster tabs, and red-line selvedge visible on interior placket. Destined to patina beautifully.',
    images: [
      'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prod-12',
    name: 'Minimalist Wool Blend Overcoat',
    gender: 'men',
    category: 'jackets',
    price: 155,
    originalPrice: 195,
    sizes: S,
    colors: ['charcoal', 'camel', 'black'],
    soldout: ['XS'],
    rating: 5.0,
    reviewCount: 22,
    isNew: true,
    description: 'Understated single-breasted overcoat tailored in double-faced Italian wool blend. Notch lapels, concealed horn button closure, deep interior slip pockets, and a clean back vent.',
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 11).toISOString()
  },
  {
    id: 'prod-13',
    name: 'Heritage Leather Low-Top Sneakers',
    gender: 'men',
    category: 'shoes',
    price: 95,
    originalPrice: 120,
    sizes: N,
    colors: ['white', 'black-sole'],
    soldout: [],
    rating: 4.8,
    reviewCount: 58,
    isNew: false,
    description: 'Buttery smooth calfskin leather upper lined with glove leather. Stitched rubber cupsole with memory foam insole for all-day comfort. Clean, logo-free Scandinavian minimalism.',
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'prod-14',
    name: 'Fine Knit Merino Wool Polo',
    gender: 'men',
    category: 'tops',
    price: 58,
    originalPrice: 75,
    sizes: S,
    colors: ['navy', 'charcoal', 'olive'],
    soldout: ['XL'],
    rating: 4.9,
    reviewCount: 16,
    isNew: true,
    description: 'Spun from 100% extra-fine 19.5 micron Australian merino wool. Naturally thermo-regulating and anti-wrinkle. Clean 3-button placket with ribbed hem and cuffs.',
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];
