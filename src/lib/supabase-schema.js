// These are actual database column names, including intentional quoted camelCase.
export const storefrontSchema = {
  products: ['id', 'name', 'slug', 'sku', 'price', 'categoryId', 'collectionId', 'isActive', 'isFeatured', 'archivedAt', 'soldCount', 'createdAt'],
  product_categories: ['id', 'name', 'slug', 'description', 'imageUrl', 'isActive', 'createdAt'],
  product_collections: ['id', 'name', 'slug', 'description', 'imageUrl', 'isActive', 'createdAt'],
  product_collection_links: ['productId', 'collectionId'],
  product_images: ['id', 'productId', 'url', 'sortOrder'],
  product_variants: ['id', 'productId', 'size', 'color', 'priceDiff', 'isActive'],
  inventory: ['id', 'variantId', 'quantity', 'reserved'],
  product_reviews: ['id', 'productId', 'rating', 'isApproved'],
  discounts: ['id', 'productId', 'discountType', 'value', 'isActive', 'startsAt', 'expiresAt'],
  website_settings: ['id', 'slug', 'data', 'isActive'],
  store_settings: ['id', 'section', 'values', 'version'],
  homepage_sections: ['id', 'name', 'heading', 'description', 'imageUrl', 'linkUrl', 'sortOrder', 'isActive'],
  banners: ['id', 'title', 'subtitle', 'imageUrl', 'linkUrl', 'sortOrder', 'isActive'],
};
export const realtimeTables = [...Object.keys(storefrontSchema), 'orders', 'notifications', 'admin_notifications'];
// UI resource names are intentionally mapped to canonical database tables.
// Customer accounts live in Auth + profiles; there is no duplicate customers table.
export const resourceTables = {categories:'product_categories',collections:'product_collections',inventory:'inventory','stock-history':'inventory_movements',orders:'orders',customers:'profiles',payments:'payments',coupons:'coupons',discounts:'discounts',reviews:'product_reviews','delivery-zones':'shipping_zones','homepage-sections':'homepage_sections',banners:'banners',notifications:'admin_notifications',messages:'contact_messages',returns:'returns',staff:'admin_roles',sizes:'product_sizes',colours:'product_colours'};
export const publicReadSchema = {...storefrontSchema,
 product_sizes:['id','name','sortOrder'],product_colours:['id','name','hex','active'],
 shipping_zones:['id','name','country','states','fee','isActive'],shipping_rates:['id','zoneId','name','fee','isActive'],
 featured_products:['id','productId','sortOrder'],
};
