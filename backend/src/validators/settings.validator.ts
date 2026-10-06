import { z } from 'zod';
export const ADMIN_ROLES = ['SUPER_ADMIN','MANAGER','ORDER_MANAGER','INVENTORY_MANAGER','MARKETING_MANAGER','SUPPORT'] as const;
export const ROLE_LABELS: Record<string,string> = { SUPER_ADMIN:'Super Administrator', MANAGER:'Store Manager', ORDER_MANAGER:'Order Manager', INVENTORY_MANAGER:'Inventory Manager', MARKETING_MANAGER:'Marketing Manager', SUPPORT:'Customer Support' };
export const PERMISSIONS = ['VIEW_PRODUCTS','CREATE_PRODUCTS','EDIT_PRODUCTS','DELETE_PRODUCTS','MANAGE_INVENTORY','VIEW_ORDERS','UPDATE_ORDERS','CANCEL_ORDERS','PROCESS_REFUNDS','VIEW_CUSTOMERS','MANAGE_CUSTOMERS','MANAGE_PROMOTIONS','MANAGE_WEBSITE','VIEW_ANALYTICS','VIEW_PAYMENTS','MANAGE_SETTINGS','MANAGE_STAFF'] as const;
export type Permission = typeof PERMISSIONS[number];
export const DEFAULT_PERMISSIONS: Record<string,Permission[]> = {
 SUPER_ADMIN:[...PERMISSIONS], MANAGER:PERMISSIONS.filter(p=>p!=='MANAGE_STAFF'),
 ORDER_MANAGER:['VIEW_PRODUCTS','VIEW_ORDERS','UPDATE_ORDERS','CANCEL_ORDERS','VIEW_CUSTOMERS','VIEW_PAYMENTS'],
 INVENTORY_MANAGER:['VIEW_PRODUCTS','CREATE_PRODUCTS','EDIT_PRODUCTS','MANAGE_INVENTORY'],
 MARKETING_MANAGER:['VIEW_PRODUCTS','VIEW_CUSTOMERS','MANAGE_PROMOTIONS','MANAGE_WEBSITE','VIEW_ANALYTICS'],
 SUPPORT:['VIEW_PRODUCTS','VIEW_ORDERS','CANCEL_ORDERS','VIEW_CUSTOMERS'],
};
export const EVENTS = ['newOrder','successfulPayment','failedPayment','cancelledOrder','returnRequest','refundRequest','lowStock','outOfStock','newCustomer','newProductReview'] as const;
export type NotificationEvent = typeof EVENTS[number];
const url = z.string().trim().max(2000).refine(value=>!value || /^\/api\/v1\/store-assets\/[a-f\d-]+\.(png|jpg|webp|ico)$/.test(value) || /^https:\/\//i.test(value) && (()=>{try{return new URL(value).protocol==='https:';}catch{return false;}})(), 'Use an HTTPS image URL or an uploaded image');
const social = z.string().trim().max(500).refine(value=>!value || (()=>{try{return ['https:','http:'].includes(new URL(value).protocol);}catch{return false;}})(),'Use a valid website URL');
const email = z.string().trim().email().or(z.literal(''));
const phone = z.string().trim().max(30).refine(value=>!value || /^[+\d][\d\s().-]{5,29}$/.test(value),'Enter a valid phone number');
const cents = z.number().nonnegative().multipleOf(0.01).max(9999999999.99);
export const settingSchemas = {
 general:z.object({ storeName:z.string().trim().min(1).max(120),currency:z.enum(['NGN','USD','GBP','EUR','GHS','KES','ZAR']),timezone:z.string().max(100).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true;}catch{return false;}},'Choose a valid timezone'),language:z.literal('en'),dateFormat:z.enum(['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD','DD MMM YYYY']),status:z.enum(['ACTIVE','MAINTENANCE']),maintenanceMessage:z.string().trim().min(1).max(2000) }).strict(),
 store:z.object({ businessName:z.string().trim().min(1).max(120),businessEmail:email,supportEmail:email,phone,whatsapp:phone,address:z.string().trim().max(500),city:z.string().trim().max(100),state:z.string().trim().max(100),country:z.string().trim().min(1).max(100),logoUrl:url,faviconUrl:url,instagram:social,facebook:social,tiktok:social,twitter:social }).strict(),
 payments:z.object({ enabled:z.boolean(),card:z.boolean(),bankTransfer:z.boolean(),mode:z.enum(['TEST','LIVE']),checkoutLabel:z.string().trim().min(1).max(80) }).strict().refine(v=>!v.enabled || v.card || v.bankTransfer,{message:'Enable at least one payment method',path:['card']}),
 shipping:z.object({ defaultCountry:z.string().trim().min(1).max(100),freeDeliveryThreshold:cents.nullable() }).strict(),
 orders:z.object({ prefix:z.string().trim().regex(/^[A-Za-z0-9-]{1,16}$/,'Use letters, numbers and hyphens'),confirmation:z.enum(['MANUAL','AUTOMATIC']),allowCancellation:z.boolean(),cancellationPeriodMinutes:z.number().int().min(1).max(10080),returnPeriodDays:z.number().int().min(0).max(365),refundRule:z.enum(['RECEIVED_GOODS','MANUAL_REVIEW','DISABLED']),invoicesEnabled:z.boolean(),orderNotifications:z.boolean(),stockDeduction:z.enum(['CREATION','PAYMENT','CONFIRMATION']) }).strict(),
 products:z.object({ sizes:z.array(z.string().trim().min(1).max(30)).min(1).max(40).refine(v=>new Set(v.map(s=>s.toLowerCase())).size===v.length,'Sizes must be unique'),colours:z.array(z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(80),hex:z.string().regex(/^#[0-9a-f]{6}$/i,'Use a six-digit hex colour'),active:z.boolean()}).strict()).max(80).refine(v=>new Set(v.map(c=>c.name.toLowerCase())).size===v.length,'Colour names must be unique'),lowStockThreshold:z.number().int().min(0).max(100000),lowStockNotifications:z.boolean(),outOfStockVisibility:z.enum(['SHOW','HIDE']),allowOutOfStockPurchases:z.boolean(),automaticSku:z.boolean(),reviewsEnabled:z.boolean() }).strict(),
 notifications:z.object(Object.fromEntries(EVENTS.map(event=>[event,z.object({dashboard:z.boolean(),email:z.boolean()}).strict()]))).strict(),
 website:z.object({ logoUrl:url,faviconUrl:url,announcementEnabled:z.boolean(),announcementText:z.string().trim().max(300),footerText:z.string().trim().max(2000),copyrightText:z.string().trim().max(300),seoTitle:z.string().trim().max(160),seoDescription:z.string().trim().max(320),socialImage:url }).strict(),
 permissions:z.object({roles:z.record(z.enum(ADMIN_ROLES),z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length))}).strict(),
};
export type SettingsSection = keyof typeof settingSchemas;
export type StoreConfiguration = { [K in SettingsSection]: z.infer<typeof settingSchemas[K]> };
export const DEFAULT_SETTINGS: StoreConfiguration = {
 general:{storeName:'NOBELLE',currency:'NGN',timezone:'Africa/Lagos',language:'en',dateFormat:'DD/MM/YYYY',status:'ACTIVE',maintenanceMessage:'We are refreshing the NOBELLE store. Please check back soon.'},
 store:{businessName:'NOBELLE',businessEmail:'',supportEmail:'',phone:'',whatsapp:'',address:'',city:'',state:'',country:'Nigeria',logoUrl:'',faviconUrl:'',instagram:'',facebook:'',tiktok:'',twitter:''},
 payments:{enabled:true,card:true,bankTransfer:true,mode:'TEST',checkoutLabel:'Pay with Paystack'},
 shipping:{defaultCountry:'Nigeria',freeDeliveryThreshold:null},
 orders:{prefix:'NBL-',confirmation:'MANUAL',allowCancellation:true,cancellationPeriodMinutes:30,returnPeriodDays:14,refundRule:'RECEIVED_GOODS',invoicesEnabled:true,orderNotifications:true,stockDeduction:'PAYMENT'},
 products:{sizes:['XS','S','M','L','XL','XXL'],colours:[],lowStockThreshold:5,lowStockNotifications:true,outOfStockVisibility:'SHOW',allowOutOfStockPurchases:false,automaticSku:false,reviewsEnabled:true},
 notifications:Object.fromEntries(EVENTS.map(event=>[event,{dashboard:true,email:false}])),
 website:{logoUrl:'',faviconUrl:'',announcementEnabled:false,announcementText:'',footerText:'Modern Nigerian fashion for the contemporary African woman.',copyrightText:'NOBELLE. All rights reserved.',seoTitle:'NOBELLE',seoDescription:'',socialImage:''},
 permissions:{roles:DEFAULT_PERMISSIONS},
};
export const profileSchema = z.object({name:z.string().trim().min(1).max(120),email:z.string().trim().email().transform(v=>v.toLowerCase()),phone,avatarUrl:url,currentPassword:z.string().max(72).optional()}).strict();
export const passwordSchema = z.object({currentPassword:z.string().min(1).max(72),newPassword:z.string().min(12,'Use at least 12 characters').max(72),confirmPassword:z.string().min(12).max(72)}).strict().refine(v=>v.newPassword===v.confirmPassword,{path:['confirmPassword'],message:'The new passwords must match'}).refine(v=>v.currentPassword!==v.newPassword,{path:['newPassword'],message:'Choose a different password'});
export const zoneSchema=z.object({name:z.string().trim().min(1).max(120),country:z.string().trim().min(1).max(100),states:z.array(z.string().trim().min(1).max(100)).min(1).max(100),fee:cents,estimatedDays:z.string().trim().min(1).max(100),freeDeliveryThreshold:cents.nullable(),isActive:z.boolean()}).strict();
export const staffSchema=z.object({name:z.string().trim().min(1).max(120),email:z.string().trim().email().transform(v=>v.toLowerCase()),role:z.enum(ADMIN_ROLES),isActive:z.boolean(),password:z.string().min(12).max(72).optional()}).strict();
export const policySchema=z.object({title:z.string().trim().min(1).max(160),content:z.string().max(50000),status:z.enum(['DRAFT','PUBLISHED']),version:z.string().nullable().optional()}).strict().refine(v=>v.status==='DRAFT' || v.content.replace(/<[^>]*>/g,'').trim().length>0,{path:['content'],message:'Add policy content before publishing'});
export const POLICY_TITLES:Record<string,string>={privacy:'Privacy Policy',terms:'Terms & Conditions',returns:'Return & Refund Policy',shipping:'Shipping Policy',sizes:'Size Guide'};
