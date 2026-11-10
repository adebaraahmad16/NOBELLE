// Centralized Demo Data for NOBELLE
// 100% Authentic Nigerian and African Women's Ready-to-Wear Fashion.
// Features Ankara, Aso-Oke, Adire, Lace, Boubou, Senator sets, Iro & Buba, and Owambe wedding guest attire.
// Used strictly as a client fallback when the Supabase database has 0 products or empty collections.
// Real Supabase data ALWAYS takes priority.

export const DEMO_CATEGORIES = [
  {
    id: 'demo-cat-ankara',
    name: 'Ankara',
    slug: 'ankara',
    description: 'Vibrant high-thread African wax prints tailored into contemporary statement silhouettes.',
    imageUrl: '/images/category_ankara.jpg',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-dresses',
    name: 'Dresses',
    slug: 'dresses',
    description: 'Flattering maxi dresses, modern wrap gowns, and effortless daytime silhouettes.',
    imageUrl: '/images/category_dresses.png',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-aso-oke',
    name: 'Aso-Oke',
    slug: 'aso-oke',
    description: 'Authentic handwoven Yoruba luxury textiles crafted into striking heirloom outfits.',
    imageUrl: '/images/product_twopiece_2.png',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-adire',
    name: 'Adire',
    slug: 'adire',
    description: 'Hand-dyed Abeokuta indigo and silk resist-dyed pieces celebrating Nigerian textile artistry.',
    imageUrl: '/images/product_casual_1.png',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-two-piece-sets',
    name: 'Two-Piece Sets',
    slug: 'two-piece-sets',
    description: 'Coordinated African-inspired tops and trousers or skirts tailored for modern versatility.',
    imageUrl: '/images/product_twopiece_1.png',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-kaftans',
    name: 'Kaftans & Boubous',
    slug: 'kaftans',
    description: 'Flowing African kaftans and regal boubous offering timeless Nigerian grace and ease.',
    imageUrl: '/images/product_dress_2.png',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-occasion-wear',
    name: 'Occasion Wear',
    slug: 'occasion-wear',
    description: 'Nigerian wedding guest gowns, Owambe corset styles, and opulent celebration ensembles.',
    imageUrl: '/images/occasion_wear_banner.jpg',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-cat-jumpsuits',
    name: 'Jumpsuits',
    slug: 'jumpsuits',
    description: 'Sleek, tailored ready-to-wear Senator and African-inspired jumpsuits cut for confident elegance.',
    imageUrl: '/images/product_corporate_1.png',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const DEMO_COLLECTIONS = [
  {
    id: 'demo-col-everyday-elegance',
    name: 'Everyday Elegance',
    slug: 'everyday-elegance',
    description: 'Refined African ready-to-wear tailored for effortless chic from workdays to weekend gatherings.',
    imageUrl: '/images/everyday_naija_banner.jpg',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-col-african-luxury',
    name: 'African Luxury',
    slug: 'african-luxury',
    description: 'Handwoven Aso-Oke, authentic Dutch wax prints, Abeokuta Adire, and regal artisanal embroidery.',
    imageUrl: '/images/ankara_edit_banner.jpg',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-col-evening-collection',
    name: 'Evening Collection',
    slug: 'evening-collection',
    description: 'Dramatic burgundy silhouettes, coral beadwork accents, and opulent gala reception gowns.',
    imageUrl: '/images/occasion_wear_banner.jpg',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'demo-col-wedding-guest-edit',
    name: 'Wedding Guest Edit',
    slug: 'wedding-guest-edit',
    description: 'Turn heads at Owambe celebrations and traditional Nigerian weddings in head-to-toe grandeur.',
    imageUrl: '/images/category_lace.jpg',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const DEMO_PRODUCTS = [
  // ── 1. ANKARA MAXI DRESS ───────────────────────────────────────────────────
  {
    id: 'demo-prod-1',
    name: 'Ankara Maxi Dress',
    slug: 'ankara-maxi-dress',
    sku: 'NOB-ANK-001',
    price: 58000,
    comparePrice: 68000,
    shortDescription: 'Sweeping floor-length maxi dress cut from colourful Dutch wax Ankara with puff shoulders and tiered flounce.',
    description: 'An homage to modern Nigerian royalty, this sweeping floor-length dress is crafted from authentic Dutch wax Ankara cotton. Designed with structured puff shoulders, a fitted bodice with smocked back elasticity for an effortless silhouette, deep side pockets, and a dramatic tiered flounce hem that moves gracefully with every step.',
    material: '100% Premium African Wax Cotton (Dutch Wax Print)',
    careInstructions: 'Hand wash cold with mild bar soap or dry clean. Do not wring. Press on reverse with warm iron.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-african-luxury',
    collection: { id: 'demo-col-african-luxury', name: 'African Luxury', slug: 'african-luxury' },
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 42,
    images: [
      { url: '/images/product_dress_1.png', sortOrder: 0, isPrimary: true },
      { url: '/images/category_ankara.jpg', sortOrder: 1, isPrimary: false },
      { url: '/images/ankara_edit_banner.jpg', sortOrder: 2, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-1-s-gold', size: 'S', color: 'Burgundy & Gold Motif', priceDiff: 0, isActive: true, inventory: { quantity: 8, reserved: 0 } },
      { id: 'demo-var-1-m-gold', size: 'M', color: 'Burgundy & Gold Motif', priceDiff: 0, isActive: true, inventory: { quantity: 12, reserved: 0 } },
      { id: 'demo-var-1-l-gold', size: 'L', color: 'Burgundy & Gold Motif', priceDiff: 0, isActive: true, inventory: { quantity: 6, reserved: 0 } },
      { id: 'demo-var-1-xl-gold', size: 'XL', color: 'Burgundy & Gold Motif', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-1-1', isApproved: true, rating: 5, comment: 'The tailoring on this Ankara maxi is immaculate! Wore it to a wedding in Lagos and received compliments all afternoon.', customer: { firstName: 'Chioma' }, createdAt: '2026-03-12T14:30:00Z' },
      { id: 'rev-1-2', isApproved: true, rating: 5, comment: 'Real Dutch wax with true vibrant colours. The pockets are a massive bonus!', customer: { firstName: 'Amina' }, createdAt: '2026-03-24T10:15:00Z' },
      { id: 'rev-1-3', isApproved: true, rating: 4, comment: 'Beautiful dress. Delivery to Abuja arrived in 2 days. Fit true to size.', customer: { firstName: 'Folake' }, createdAt: '2026-04-02T18:00:00Z' },
    ],
    discounts: [],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },

  // ── 2. ASO-OKE TWO-PIECE SET ────────────────────────────────────────────────
  {
    id: 'demo-prod-2',
    name: 'Aso-Oke Two-Piece Set',
    slug: 'aso-oke-two-piece-set',
    sku: 'NOB-ASO-001',
    price: 74000,
    comparePrice: 85000,
    shortDescription: 'Coordinated handwoven Aso-Oke cropped blazer jacket with metallic threads and high-waist palazzo trousers.',
    description: 'Celebrate authentic Yoruba textile mastery with this contemporary Aso-Oke two-piece set. Woven on traditional looms with subtle lurex metallic accents, the structured cropped blazer features a notched collar and notched cuffs, paired with fluid high-waisted palazzo trousers with deep slant pockets. Designed to be worn as an impactful ensemble or as versatile separates.',
    material: 'Handwoven Nigerian Aso-Oke (Cotton & Lurex Blend) with Silk-Touch Lining',
    careInstructions: 'Specialist dry clean only to preserve metallic thread weaves.',
    categoryId: 'demo-cat-two-piece-sets',
    category: { id: 'demo-cat-two-piece-sets', name: 'Two-Piece Sets', slug: 'two-piece-sets' },
    collectionId: 'demo-col-african-luxury',
    collection: { id: 'demo-col-african-luxury', name: 'African Luxury', slug: 'african-luxury' },
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 36,
    images: [
      { url: '/images/product_twopiece_1.png', sortOrder: 0, isPrimary: true },
      { url: '/images/about_lifestyle.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-2-s-bronze', size: 'S', color: 'Royal Bronze & Gold', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
      { id: 'demo-var-2-m-bronze', size: 'M', color: 'Royal Bronze & Gold', priceDiff: 0, isActive: true, inventory: { quantity: 8, reserved: 0 } },
      { id: 'demo-var-2-l-bronze', size: 'L', color: 'Royal Bronze & Gold', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-2-1', isApproved: true, rating: 5, comment: 'The Aso-Oke weave is so soft and structured, not stiff at all. Wore it for an anniversary event in Victoria Island and felt like royalty.', customer: { firstName: 'Yetunde' }, createdAt: '2026-03-15T11:20:00Z' },
      { id: 'rev-2-2', isApproved: true, rating: 5, comment: 'Worth every kobo. The tailoring on the trousers is world class.', customer: { firstName: 'Temiloluwa' }, createdAt: '2026-03-29T16:00:00Z' },
    ],
    discounts: [],
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },

  // ── 3. ADIRE CO-ORD SET ─────────────────────────────────────────────────────
  {
    id: 'demo-prod-3',
    name: 'Adire Co-ord Set',
    slug: 'adire-co-ord-set',
    sku: 'NOB-ADR-001',
    price: 56000,
    comparePrice: 64000,
    shortDescription: 'Artisanal hand-dyed Abeokuta Adire silk blend button-down shirt paired with matching straight-leg trousers.',
    description: 'Rooted in the ancient dye pits of Abeokuta, this matching Adire co-ord set represents sustainable African luxury. Each piece is hand-dyed using organic indigo resist techniques, creating one-of-a-kind marbling patterns. Features a relaxed collared shirt with mother-of-pearl buttons and fluid straight-leg trousers with an elasticated waistband and drawstring.',
    material: '100% Hand-Dyed Adire Silk-Cotton Blend',
    careInstructions: 'Hand wash separately in cold water with mild bar soap. Air dry in shade.',
    categoryId: 'demo-cat-two-piece-sets',
    category: { id: 'demo-cat-two-piece-sets', name: 'Two-Piece Sets', slug: 'two-piece-sets' },
    collectionId: 'demo-col-everyday-elegance',
    collection: { id: 'demo-col-everyday-elegance', name: 'Everyday Elegance', slug: 'everyday-elegance' },
    isActive: true,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    soldCount: 28,
    images: [
      { url: '/images/product_twopiece_2.png', sortOrder: 0, isPrimary: true },
      { url: '/images/product_casual_2.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-3-s-indigo', size: 'S', color: 'Traditional Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 6, reserved: 0 } },
      { id: 'demo-var-3-m-indigo', size: 'M', color: 'Traditional Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 10, reserved: 0 } },
      { id: 'demo-var-3-l-indigo', size: 'L', color: 'Traditional Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 7, reserved: 0 } },
      { id: 'demo-var-3-xl-indigo', size: 'XL', color: 'Traditional Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 3, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-3-1', isApproved: true, rating: 5, comment: 'Authentic Abeokuta Adire with zero chemical smell. The silk-cotton blend feels like a dream against the skin.', customer: { firstName: 'Adeola' }, createdAt: '2026-03-21T15:10:00Z' },
      { id: 'rev-3-2', isApproved: true, rating: 4, comment: 'Great quality, beautiful drape. Fast delivery to Ibadan.', customer: { firstName: 'Bolanle' }, createdAt: '2026-04-03T09:30:00Z' },
    ],
    discounts: [],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },

  // ── 4. BOUBOU KAFTAN DRESS ──────────────────────────────────────────────────
  {
    id: 'demo-prod-4',
    name: 'Boubou Kaftan Dress',
    slug: 'boubou-kaftan-dress',
    sku: 'NOB-BOU-001',
    price: 72000,
    comparePrice: null,
    shortDescription: 'Regal, loose-fitting African Boubou gown in raw silk modal with intricate hand-embroidered gold neckline.',
    description: 'The pinnacle of effortless majesty. This authentic flowing African Boubou gown is cut with generous volume from heavyweight raw silk modal. Features masterfully applied gold cord soutache embroidery across the plunging split-mandarin collar and draped butterfly sleeves. Modest, breathable, and deeply commanding.',
    material: 'Raw Silk Modal Blend with Gold Soutache Embroidery',
    careInstructions: 'Dry clean only to maintain the hand-embroidered neckline.',
    categoryId: 'demo-cat-kaftans',
    category: { id: 'demo-cat-kaftans', name: 'Kaftans & Boubou', slug: 'kaftans' },
    collectionId: 'demo-col-african-luxury',
    collection: { id: 'demo-col-african-luxury', name: 'African Luxury', slug: 'african-luxury' },
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 40,
    images: [
      { url: '/images/ankara_edit_banner.jpg', sortOrder: 0, isPrimary: true },
      { url: '/images/product_corporate_2.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-4-free-burgundy', size: 'Free Size', color: 'Deep Burgundy & Gold', priceDiff: 0, isActive: true, inventory: { quantity: 12, reserved: 0 } },
      { id: 'demo-var-4-free-emerald', size: 'Free Size', color: 'Royal Emerald & Gold', priceDiff: 0, isActive: true, inventory: { quantity: 8, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-4-1', isApproved: true, rating: 5, comment: 'Pure luxury! The embroidery has incredible depth and sparkle. Everyone at the naming ceremony asked where I bought it.', customer: { firstName: 'Hajiya Fatima' }, createdAt: '2026-03-08T14:20:00Z' },
      { id: 'rev-4-2', isApproved: true, rating: 5, comment: 'Comfortable yet incredibly regal. Exactly what NOBELLE represents.', customer: { firstName: 'Ronke' }, createdAt: '2026-03-25T17:40:00Z' },
    ],
    discounts: [],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },

  // ── 5. LACE OCCASION DRESS ──────────────────────────────────────────────────
  {
    id: 'demo-prod-5',
    name: 'Lace Occasion Dress',
    slug: 'lace-occasion-dress',
    sku: 'NOB-LAC-001',
    price: 88000,
    comparePrice: 98000,
    shortDescription: 'Elegant Nigerian cord lace occasion dress lined with sculpted duchess satin and illusion sweetheart neckline.',
    description: 'Designed specifically for the prestige of Nigerian Owambe celebrations and church dedications. Heavyweight French cord lace is bonded with lustrous duchess satin to support its flared mermaid hemline. Finished with an illusion mesh yoke, scalloped lace sleeve hems, and an invisible back zipper.',
    material: 'French Cord Lace & Heavy Duchess Satin Lining',
    careInstructions: 'Specialist dry clean only.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-wedding-guest-edit',
    collection: { id: 'demo-col-wedding-guest-edit', name: 'Wedding Guest Edit', slug: 'wedding-guest-edit' },
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 33,
    images: [
      { url: '/images/category_lace.jpg', sortOrder: 0, isPrimary: true },
      { url: '/images/lace_collection_banner.jpg', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-5-s-champagne', size: 'S', color: 'Champagne Rose', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-5-m-champagne', size: 'M', color: 'Champagne Rose', priceDiff: 0, isActive: true, inventory: { quantity: 7, reserved: 0 } },
      { id: 'demo-var-5-l-champagne', size: 'L', color: 'Champagne Rose', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
      { id: 'demo-var-5-xl-champagne', size: 'XL', color: 'Champagne Rose', priceDiff: 0, isActive: true, inventory: { quantity: 3, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-5-1', isApproved: true, rating: 5, comment: 'The cord lace quality is breathtaking. Received endless inquiries at my cousin’s traditional wedding in Lekki.', customer: { firstName: 'Bukola' }, createdAt: '2026-03-19T20:10:00Z' },
      { id: 'rev-5-2', isApproved: true, rating: 5, comment: 'Worth every single Naira. The lining is dense and completely non-transparent.', customer: { firstName: 'Chidinma' }, createdAt: '2026-04-06T13:40:00Z' },
    ],
    discounts: [],
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
  },

  // ── 6. ANKARA JUMPSUIT ──────────────────────────────────────────────────────
  {
    id: 'demo-prod-6',
    name: 'Ankara Jumpsuit',
    slug: 'ankara-jumpsuit',
    sku: 'NOB-JMP-001',
    price: 59000,
    comparePrice: 69000,
    shortDescription: 'Modern tailored Ankara halter-neck jumpsuit with wide palazzo legs and an oversized statement sash belt.',
    description: 'Command the room in this impeccably cut Ankara jumpsuit. Tailored with a crossover halter neckline that accentuates the collarbones, an ultra-flattering cinched waist with an extra-long sash belt, and fluid palazzo legs with deep functional side pockets.',
    material: '100% Fine Grade African Wax Cotton Print',
    careInstructions: 'Hand wash cold or gentle machine wash inside out. Warm iron on reverse.',
    categoryId: 'demo-cat-african-inspired',
    category: { id: 'demo-cat-african-inspired', name: 'African-Inspired Wear', slug: 'african-inspired-wear' },
    collectionId: 'demo-col-everyday-elegance',
    collection: { id: 'demo-col-everyday-elegance', name: 'Everyday Elegance', slug: 'everyday-elegance' },
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 35,
    images: [
      { url: '/images/product_casual_1.png', sortOrder: 0, isPrimary: true },
      { url: '/images/product_dress_2.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-6-s-burgundy', size: 'S', color: 'Burgundy Swirl', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
      { id: 'demo-var-6-m-burgundy', size: 'M', color: 'Burgundy Swirl', priceDiff: 0, isActive: true, inventory: { quantity: 9, reserved: 0 } },
      { id: 'demo-var-6-l-burgundy', size: 'L', color: 'Burgundy Swirl', priceDiff: 0, isActive: true, inventory: { quantity: 6, reserved: 0 } },
      { id: 'demo-var-6-xl-burgundy', size: 'XL', color: 'Burgundy Swirl', priceDiff: 0, isActive: true, inventory: { quantity: 3, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-6-1', isApproved: true, rating: 5, comment: 'Show-stopping jumpsuit. The torso length and palazzo proportion are tailored to perfection.', customer: { firstName: 'Kemi' }, createdAt: '2026-03-15T12:00:00Z' },
      { id: 'rev-6-2', isApproved: true, rating: 4, comment: 'Love the deep pockets and print vibrancy. Arrived promptly in Port Harcourt.', customer: { firstName: 'Grace' }, createdAt: '2026-04-03T14:15:00Z' },
    ],
    discounts: [],
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
  },

  // ── 7. SENATOR-INSPIRED WOMEN'S SET ─────────────────────────────────────────
  {
    id: 'demo-prod-7',
    name: 'Senator-Inspired Women\'s Set',
    slug: 'senator-inspired-womens-set',
    sku: 'NOB-SEN-001',
    price: 66000,
    comparePrice: null,
    shortDescription: 'Tailored Nigerian female Senator-cut tunic top with chest embroidery paired with slim-fit cigarette trousers.',
    description: 'NOBELLE’s feminine reinvention of the iconic Nigerian Senator suit. Cut from structured tropical wool-crepe, the tunic features crisp tonal embroidery along the asymmetric placket, a split mandarin collar, and side vents, complemented by ankle-skimming cigarette trousers with a clean front fly.',
    material: 'Tropical Stretch Crepe with Silk Thread Embroidery',
    careInstructions: 'Dry clean recommended. Cool iron with pressing cloth.',
    categoryId: 'demo-cat-two-piece-sets',
    category: { id: 'demo-cat-two-piece-sets', name: 'Two-Piece Sets', slug: 'two-piece-sets' },
    collectionId: 'demo-col-everyday-elegance',
    collection: { id: 'demo-col-everyday-elegance', name: 'Everyday Elegance', slug: 'everyday-elegance' },
    isActive: true,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    soldCount: 21,
    images: [
      { url: '/images/product_corporate_1.png', sortOrder: 0, isPrimary: true },
      { url: '/images/product_corporate_2.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-7-s-burgundy', size: 'S', color: 'Executive Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-7-m-burgundy', size: 'M', color: 'Executive Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 7, reserved: 0 } },
      { id: 'demo-var-7-l-burgundy', size: 'L', color: 'Executive Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-7-1', isApproved: true, rating: 5, comment: 'Finally, a female Senator suit with authentic tailoring that fits African hips properly! Perfect for board meetings.', customer: { firstName: 'Damilola' }, createdAt: '2026-03-23T11:40:00Z' },
    ],
    discounts: [],
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },

  // ── 8. MODERN IRO & BUBA SET (WRAPPER & BLOUSE) ────────────────────────────
  {
    id: 'demo-prod-8',
    name: 'Modern Iro & Buba Set',
    slug: 'modern-iro-and-buba-set',
    sku: 'NOB-IRO-001',
    price: 78000,
    comparePrice: 88000,
    shortDescription: 'Contemporary pre-tied wrap skirt (Iro) paired with a modern bell-sleeve Buba top in rich African jacquard.',
    description: 'A seamless modern reinterpretation of the traditional Yoruba wrapper and blouse. Designed for effortless dressing, the pre-tied Iro wrap skirt eliminates bulky tying with concealed internal hooks and a flattering front cascade, while the Buba blouse features sheer organza flare sleeves and subtle beaded trim.',
    material: 'African Silk Jacquard & Organza Sleeve Accents',
    careInstructions: 'Dry clean only.',
    categoryId: 'demo-cat-african-inspired',
    category: { id: 'demo-cat-african-inspired', name: 'African-Inspired Wear', slug: 'african-inspired-wear' },
    collectionId: 'demo-col-wedding-guest-edit',
    collection: { id: 'demo-col-wedding-guest-edit', name: 'Wedding Guest Edit', slug: 'wedding-guest-edit' },
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 31,
    images: [
      { url: '/images/occasion_wear_banner.jpg', sortOrder: 0, isPrimary: true },
      { url: '/images/product_dress_3.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-8-s-wine', size: 'S', color: 'Wine & Gold Jacquard', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-8-m-wine', size: 'M', color: 'Wine & Gold Jacquard', priceDiff: 0, isActive: true, inventory: { quantity: 8, reserved: 0 } },
      { id: 'demo-var-8-l-wine', size: 'L', color: 'Wine & Gold Jacquard', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-8-1', isApproved: true, rating: 5, comment: 'The pre-tied Iro is a lifesaver! No stress about tying wrappers, and it stayed in place all through the reception dance.', customer: { firstName: 'Folake' }, createdAt: '2026-03-26T17:15:00Z' },
    ],
    discounts: [],
    createdAt: '2026-02-18T10:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z',
  },

  // ── 9. NIGERIAN WEDDING GUEST OUTFIT ────────────────────────────────────────
  {
    id: 'demo-prod-9',
    name: 'Nigerian Wedding Guest Outfit',
    slug: 'nigerian-wedding-guest-outfit',
    sku: 'NOB-OWB-001',
    price: 92000,
    comparePrice: 105000,
    shortDescription: 'Opulent deep burgundy Aso-Ebi wedding guest gown with an off-shoulder neckline and mermaid silhouette.',
    description: 'The definitive Owambe masterpiece. Cut from heavy duchess satin in NOBELLE’s signature burgundy, this gown features an architectural off-shoulder neckline with cord lace appliqués, internal corset boning that hugs the waist, and a regal mermaid skirt with a dramatic rear sweep.',
    material: 'Heavy Duchess Satin, French Beaded Cord Lace, Internal Boning',
    careInstructions: 'Specialist luxury dry clean only. Steam gently.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-wedding-guest-edit',
    collection: { id: 'demo-col-wedding-guest-edit', name: 'Wedding Guest Edit', slug: 'wedding-guest-edit' },
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 46,
    images: [
      { url: '/images/product_dress_3.png', sortOrder: 0, isPrimary: true },
      { url: '/images/category_lace.jpg', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-9-s-burgundy', size: 'S', color: 'Signature Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
      { id: 'demo-var-9-m-burgundy', size: 'M', color: 'Signature Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 8, reserved: 0 } },
      { id: 'demo-var-9-l-burgundy', size: 'L', color: 'Signature Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-9-1', isApproved: true, rating: 5, comment: 'Sensational! Stole the show at my sister’s traditional wedding. The satin has substantial weight and royal luster.', customer: { firstName: 'Ngozi' }, createdAt: '2026-03-05T16:10:00Z' },
      { id: 'rev-9-2', isApproved: true, rating: 5, comment: 'Fits like custom haute couture. Pure Nigerian glamour.', customer: { firstName: 'Ifeoma' }, createdAt: '2026-03-29T12:00:00Z' },
    ],
    discounts: [],
    createdAt: '2026-02-12T10:00:00Z',
    updatedAt: '2026-02-12T10:00:00Z',
  },

  // ── 10. MODERN AFRICAN ABAYA ────────────────────────────────────────────────
  {
    id: 'demo-prod-10',
    name: 'Modern African Abaya',
    slug: 'modern-african-abaya',
    sku: 'NOB-ABY-001',
    price: 76000,
    comparePrice: 86000,
    shortDescription: 'Flowing open-front abaya kimono tailored from textured linen crepe with Ankara wax print borders.',
    description: 'Modest luxury reimagined for the contemporary African woman. Cut from breathable linen-blend crepe with vibrant Ankara wax print accents framing the draped shawl lapels and flared cuffs. Includes an optional matching tie belt to transition from an open fluid layer to a belted silhouette.',
    material: 'Premium Textured Linen Crepe with 100% Cotton Wax Print Accents',
    careInstructions: 'Gentle hand wash in cold water or dry clean. Hang dry.',
    categoryId: 'demo-cat-kaftans',
    category: { id: 'demo-cat-kaftans', name: 'Kaftans & Boubou', slug: 'kaftans' },
    collectionId: 'demo-col-everyday-elegance',
    collection: { id: 'demo-col-everyday-elegance', name: 'Everyday Elegance', slug: 'everyday-elegance' },
    isActive: true,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    soldCount: 19,
    images: [
      { url: '/images/product_corporate_2.png', sortOrder: 0, isPrimary: true },
      { url: '/images/ankara_edit_banner.jpg', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-10-s-sand', size: 'S', color: 'Soft Sand & Ankara', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-10-m-sand', size: 'M', color: 'Soft Sand & Ankara', priceDiff: 0, isActive: true, inventory: { quantity: 7, reserved: 0 } },
      { id: 'demo-var-10-l-sand', size: 'L', color: 'Soft Sand & Ankara', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-10-1', isApproved: true, rating: 5, comment: 'Modest, stylish, and premium quality. The linen fabric breathes beautifully in Lagos humidity.', customer: { firstName: 'Maryam' }, createdAt: '2026-03-21T13:10:00Z' },
    ],
    discounts: [],
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
  },

  // ── 11. ADIRE STATEMENT DRESS ───────────────────────────────────────────────
  {
    id: 'demo-prod-11',
    name: 'Adire Statement Dress',
    slug: 'adire-statement-dress',
    sku: 'NOB-ADR-002',
    price: 64000,
    comparePrice: null,
    shortDescription: 'One-shoulder asymmetric cocktail dress cut from authentic hand-batik indigo Adire silk on the bias.',
    description: 'A wearable celebration of Nigerian heritage. Cut on the bias to hug curves with liquid elegance, this one-shoulder dress features an asymmetric waterfall hemline and genuine artisanal batik patterns created with centuries-old Abeokuta dye techniques.',
    material: '100% Raw Silk Adire Batik',
    careInstructions: 'Hand wash gently in cold water with mild liquid soap. Do not soak.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-african-luxury',
    collection: { id: 'demo-col-african-luxury', name: 'African Luxury', slug: 'african-luxury' },
    isActive: true,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    soldCount: 22,
    images: [
      { url: '/images/category_ankara.jpg', sortOrder: 0, isPrimary: true },
      { url: '/images/product_casual_1.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-11-s-multi', size: 'S', color: 'Sunset Orange & Violet', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-11-m-multi', size: 'M', color: 'Sunset Orange & Violet', priceDiff: 0, isActive: true, inventory: { quantity: 6, reserved: 0 } },
      { id: 'demo-var-11-l-multi', size: 'L', color: 'Sunset Orange & Violet', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-11-1', isApproved: true, rating: 5, comment: 'A wearable work of art! The pattern is unique and the silk drapes like water.', customer: { firstName: 'Eniola' }, createdAt: '2026-03-28T09:30:00Z' },
    ],
    discounts: [],
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
  },

  // ── 12. CONTEMPORARY AFRICAN PEPLUM BLOUSE ──────────────────────────────────
  {
    id: 'demo-prod-12',
    name: 'Contemporary African Peplum Blouse',
    slug: 'contemporary-african-peplum-blouse',
    sku: 'NOB-BLS-001',
    price: 42000,
    comparePrice: null,
    shortDescription: 'Structured Ankara wax print peplum blouse featuring architectural origami folds and statement balloon sleeves.',
    description: 'Elevate your everyday wardrobe with distinct African tailoring. Features a sharp jewel neckline, structured origami peplum flares that snatch the waist, and puffed balloon sleeves with buttoned cuffs. Styles effortlessly with tailored pencil skirts or trousers.',
    material: '100% Breathable Fine African Wax Cotton',
    careInstructions: 'Machine wash cold on delicate cycle or hand wash. Press with warm iron.',
    categoryId: 'demo-cat-african-inspired',
    category: { id: 'demo-cat-african-inspired', name: 'African-Inspired Wear', slug: 'african-inspired-wear' },
    collectionId: 'demo-col-everyday-elegance',
    collection: { id: 'demo-col-everyday-elegance', name: 'Everyday Elegance', slug: 'everyday-elegance' },
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    soldCount: 18,
    images: [
      { url: '/images/product_casual_2.png', sortOrder: 0, isPrimary: true },
      { url: '/images/product_corporate_1.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-12-s-gold', size: 'S', color: 'Wine & Gold Geometry', priceDiff: 0, isActive: true, inventory: { quantity: 6, reserved: 0 } },
      { id: 'demo-var-12-m-gold', size: 'M', color: 'Wine & Gold Geometry', priceDiff: 0, isActive: true, inventory: { quantity: 9, reserved: 0 } },
      { id: 'demo-var-12-l-gold', size: 'L', color: 'Wine & Gold Geometry', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-12-1', isApproved: true, rating: 4, comment: 'Chic top that works with tailored trousers or denim skirts. The peplum shape holds up wonderfully.', customer: { firstName: 'Funmi' }, createdAt: '2026-03-11T16:00:00Z' },
    ],
    discounts: [],
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
  },

  // ── 13. ANKARA SHIFT MIDI DRESS ─────────────────────────────────────────────
  {
    id: 'demo-prod-13',
    name: 'Ankara Shift Midi Dress',
    slug: 'ankara-shift-midi-dress',
    sku: 'NOB-ANK-002',
    price: 52000,
    comparePrice: null,
    shortDescription: 'Clean-cut Ankara ready-to-wear midi shift dress with jewel neckline, cap sleeves, and side pockets.',
    description: 'The epitome of refined ready-to-wear. A clean-lined midi shift dress cut from vibrant African print cotton with internal cotton lining. Features a jewel collar, cap sleeves, discreet side slant pockets, and a neat back zip.',
    material: '100% African Wax Cotton with Soft Cotton Voile Lining',
    careInstructions: 'Hand wash cold or gentle machine wash inside out. Warm iron on reverse.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-everyday-elegance',
    collection: { id: 'demo-col-everyday-elegance', name: 'Everyday Elegance', slug: 'everyday-elegance' },
    isActive: true,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    soldCount: 20,
    images: [
      { url: '/images/product_dress_2.png', sortOrder: 0, isPrimary: true },
      { url: '/images/product_dress_1.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-13-xs-terra', size: 'XS', color: 'Terracotta & Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-13-s-terra', size: 'S', color: 'Terracotta & Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 7, reserved: 0 } },
      { id: 'demo-var-13-m-terra', size: 'M', color: 'Terracotta & Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 8, reserved: 0 } },
      { id: 'demo-var-13-l-terra', size: 'L', color: 'Terracotta & Indigo', priceDiff: 0, isActive: true, inventory: { quantity: 5, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-13-1', isApproved: true, rating: 5, comment: 'My go-to dress for executive meetings and Sunday brunches. Elegant and comfortable.', customer: { firstName: 'Zainab' }, createdAt: '2026-03-18T11:20:00Z' },
    ],
    discounts: [],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },

  // ── 14. CORAL BEADED REGAL GOWN ─────────────────────────────────────────────
  {
    id: 'demo-prod-14',
    name: 'Coral Beaded Regal Gown',
    slug: 'coral-beaded-regal-gown',
    sku: 'NOB-COR-001',
    price: 135000,
    comparePrice: 150000,
    shortDescription: 'Signature NOBELLE couture gown with structured velvet bodice, handcrafted coral beadwork, and organza sweep.',
    description: 'The pinnacle of NOBELLE couture. A structured boned corset bodice in deep burgundy silk velvet is adorned with hand-strung Edo/Yoruba coral-inspired shoulder beadwork, flowing into an opulent multi-tiered silk organza skirt that commands the red carpet and high-society galas.',
    material: 'Heavy Silk Velvet, Pure Silk Organza & Hand-Sewn Coral-Toned Beads',
    careInstructions: 'Specialist luxury dry clean only.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-evening-collection',
    collection: { id: 'demo-col-evening-collection', name: 'Evening Collection', slug: 'evening-collection' },
    isActive: true,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    soldCount: 14,
    images: [
      { url: '/images/everyday_naija_banner.jpg', sortOrder: 0, isPrimary: true },
      { url: '/images/product_dress_3.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-14-s-burgundy', size: 'S', color: 'Deep Noir Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 2, reserved: 0 } },
      { id: 'demo-var-14-m-burgundy', size: 'M', color: 'Deep Noir Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 4, reserved: 0 } },
      { id: 'demo-var-14-l-burgundy', size: 'L', color: 'Deep Noir Burgundy', priceDiff: 0, isActive: true, inventory: { quantity: 2, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-14-1', isApproved: true, rating: 5, comment: 'An absolute showstopper. The corset snatched my waist with pure comfort and the coral beadwork is top tier.', customer: { firstName: 'Titilayo' }, createdAt: '2026-03-31T18:25:00Z' },
    ],
    discounts: [],
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
  },

  // ── 15. CONTEMPORARY AFRICAN WRAP DRESS ─────────────────────────────────────
  {
    id: 'demo-prod-15',
    name: 'Contemporary African Wrap Dress',
    slug: 'contemporary-african-wrap-dress',
    sku: 'NOB-WRP-001',
    price: 49000,
    comparePrice: null,
    shortDescription: 'Universally flattering crossover wrap dress featuring heritage wax geometric motifs and flare sleeves.',
    description: 'An effortless wardrobe essential that flatters every silhouette. Designed with an adjustable waist tie, tulip crossover hemline, and elbow-length flare sleeves, it moves fluidly from corporate casual settings to weekend celebrations.',
    material: '100% African Wax Cotton Print',
    careInstructions: 'Hand wash cold with mild detergent. Do not wring. Cool iron on reverse.',
    categoryId: 'demo-cat-dresses',
    category: { id: 'demo-cat-dresses', name: 'Dresses', slug: 'dresses' },
    collectionId: 'demo-col-african-luxury',
    collection: { id: 'demo-col-african-luxury', name: 'African Luxury', slug: 'african-luxury' },
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    soldCount: 38,
    images: [
      { url: '/images/category_dresses.png', sortOrder: 0, isPrimary: true },
      { url: '/images/product_casual_1.png', sortOrder: 1, isPrimary: false },
    ],
    variants: [
      { id: 'demo-var-15-s-wine', size: 'S', color: 'Marigold & Wine', priceDiff: 0, isActive: true, inventory: { quantity: 6, reserved: 0 } },
      { id: 'demo-var-15-m-wine', size: 'M', color: 'Marigold & Wine', priceDiff: 0, isActive: true, inventory: { quantity: 10, reserved: 0 } },
      { id: 'demo-var-15-l-wine', size: 'L', color: 'Marigold & Wine', priceDiff: 0, isActive: true, inventory: { quantity: 7, reserved: 0 } },
    ],
    reviews: [
      { id: 'rev-15-1', isApproved: true, rating: 5, comment: 'So comfortable and flattering on curves. I received endless compliments at church.', customer: { firstName: 'Blessing' }, createdAt: '2026-03-22T13:45:00Z' },
      { id: 'rev-15-2', isApproved: true, rating: 4, comment: 'Vibrant print, fits very well. Wrap design is secure and well-proportioned.', customer: { firstName: 'Halima' }, createdAt: '2026-04-05T15:20:00Z' },
    ],
    discounts: [],
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
];

// Helper: check if an ID or slug is a demo product
export function isDemoProduct(idOrSlug) {
  if (!idOrSlug) return false;
  return DEMO_PRODUCTS.some(p => p.id === idOrSlug || p.slug === idOrSlug);
}

// Helper: find demo product by ID or slug
export function getDemoProductByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;
  return DEMO_PRODUCTS.find(p => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

// Helper: check if a variant ID is a demo variant
export function isDemoVariant(variantId) {
  if (!variantId) return false;
  return DEMO_PRODUCTS.some(p => p.variants.some(v => v.id === variantId));
}

// Helper: find demo variant and its parent product
export function getDemoVariant(variantId) {
  for (const product of DEMO_PRODUCTS) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

// Helper: filter demo products matching the exact query parameters of ShopPage
export function filterDemoProducts(params, settings) {
  const p = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
  let list = [...DEMO_PRODUCTS];

  const search = p.get('search')?.toLowerCase().trim();
  if (search) {
    list = list.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.shortDescription.toLowerCase().includes(search) ||
      item.material.toLowerCase().includes(search)
    );
  }

  const category = p.get('category');
  if (category) {
    list = list.filter(item => {
      if (item.category?.slug === category || item.categoryId === category) return true;
      const cat = category.toLowerCase().trim();
      const n = (item.name || '').toLowerCase();
      const d = (item.description || '').toLowerCase();
      if (cat === 'ankara') return n.includes('ankara') || d.includes('ankara');
      if (cat === 'adire') return n.includes('adire') || d.includes('adire');
      if (cat === 'aso-oke' || cat === 'aso oke') return n.includes('aso-oke') || d.includes('aso-oke') || n.includes('aso oke');
      if (cat === 'kaftans') return n.includes('kaftan') || n.includes('boubou') || d.includes('boubou');
      if (cat === 'jumpsuits') return n.includes('jumpsuit') || d.includes('jumpsuit');
      if (cat === 'two-piece-sets') return n.includes('set') || n.includes('suit') || n.includes('co-ord') || n.includes('jacket');
      if (cat === 'dresses') return n.includes('dress') || n.includes('gown') || n.includes('boubou');
      if (cat === 'occasion-wear') return n.includes('wedding') || n.includes('gown') || n.includes('corset') || n.includes('lace') || n.includes('iro') || item.collectionId === 'demo-col-wedding-guest-edit' || item.collectionId === 'demo-col-evening-collection';
      return false;
    });
  }

  const collection = p.get('collection');
  if (collection) {
    list = list.filter(item => item.collection?.slug === collection || item.collectionId === collection);
  }

  const size = p.get('size');
  if (size) {
    list = list.filter(item => item.variants.some(v => v.isActive && v.size === size));
  }

  const color = p.get('color')?.toLowerCase().trim();
  if (color) {
    list = list.filter(item => item.variants.some(v => v.isActive && v.color.toLowerCase().includes(color)));
  }

  const minPrice = Number(p.get('minPrice'));
  if (!Number.isNaN(minPrice) && minPrice > 0) {
    list = list.filter(item => Number(item.price) >= minPrice);
  }

  const maxPrice = Number(p.get('maxPrice'));
  if (!Number.isNaN(maxPrice) && maxPrice > 0) {
    list = list.filter(item => Number(item.price) <= maxPrice);
  }

  const featured = p.get('featured') === 'true';
  if (featured) {
    list = list.filter(item => item.isFeatured);
  }

  const availableOnly = p.get('available') === 'true' || settings?.products?.outOfStockVisibility === 'HIDE';
  if (availableOnly) {
    list = list.filter(item => item.variants.some(v => (v.inventory?.quantity || 0) > (v.inventory?.reserved || 0)));
  }

  const sort = p.get('sort') || 'newest';
  if (sort === 'price-low') {
    list.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === 'price-high') {
    list.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === 'popular' || sort === 'best-selling') {
    list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
  } else {
    // newest
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const page = Math.max(1, Number(p.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(p.get('limit')) || 20));
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const data = list.slice(startIndex, startIndex + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
