import { requireSupabase } from '../lib/supabase';
import defaults from './settings-defaults.json';
import { effectivePrice } from '../utils/pricing';
import { supabaseError } from '../lib/supabase-errors.js';
import { publicReads } from './read-cache.js';
import { resourceTables } from '../lib/supabase-schema.js';

export const productSelect = '*,discounts(*),category:product_categories(*),collection:product_collections(*),collectionLinks:product_collection_links(*),images:product_images(*),variants:product_variants(*,inventory(*)),reviews:product_reviews(*)';
const orderSelect = '*,customer:profiles(*),items:order_items(*),shippingAddress:shipping_addresses(*),statusHistory:order_status_history(*),payments(*),shipment:shipments(*)';
export const roleLabels = { SUPER_ADMIN: 'Super Admin', MANAGER: 'Store Manager', ORDER_MANAGER: 'Order Manager', INVENTORY_MANAGER: 'Inventory Manager', MARKETING_MANAGER: 'Marketing Manager', SUPPORT: 'Customer Support' };
export const permissionList = defaults.permissions.roles.SUPER_ADMIN;
export async function checked(query) {
  const { data, error, status } = await query;
  if (error) throw supabaseError(error, status);
  return data;
}
export const rpc = (name, args) => checked(requireSupabase().rpc(name, args));
export async function edge(name, body) {
  const { data, error } = await requireSupabase().functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try { message = (await error.context.json()).error || message; } catch { /* Non-JSON network response. */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function currentUser() {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) { const e = new Error('Please sign in to continue.'); e.status = 401; throw e; }
  const profile = await checked(sb.from('profiles').select('*').eq('id', data.user.id).single());
  if (!profile.isActive) { const e = new Error('Your account is inactive. Contact NOBELLE.'); e.status=403; throw e; }
  return profile;
}
export async function adminIdentity() {
  const p = await currentUser();
  const role = await checked(requireSupabase().from('admin_roles').select('*').eq('userId', p.id).eq('isActive', true).maybeSingle());
  if (!role) { const e=new Error('This account does not have administrator access.');e.status=403;throw e; }
  const permissions = role.role === 'SUPER_ADMIN' ? permissionList : (await checked(requireSupabase().from('staff_permissions').select('permission').eq('role', role.role))).map(p=>p.permission);
  return { ...p, name: p.name || `${p.firstName} ${p.lastName}`.trim() || p.email, role: role.role, permissions };
}
export async function settings(admin = false) {
  const rows = await publicReads.run('store-settings',async()=>{
    const rows=await checked(requireSupabase().from('store_settings').select('id,section,values,version'));
    const missing=['general','store','payments','shipping','orders','products','website'].filter(section=>!rows.some(row=>row.section===section));
    if(missing.length)throw new Error(`Supabase store_settings is missing required configuration sections or their read policies: ${missing.join(', ')}. Apply the defaults migration and check RLS; no placeholder settings have been substituted.`);
    return rows;
  });
  const value=Object.fromEntries(rows.map(r=>[r.section,r.values]));
  if (!admin) {
    const incomplete=['general','store','payments','shipping','orders','products','website'].flatMap(section=>Object.keys(defaults[section]).filter(key=>!Object.prototype.hasOwnProperty.call(value[section]||{},key)).map(key=>`${section}.${key}`));
    if(incomplete.length)throw new Error(`Supabase store_settings contains incomplete configuration: ${incomplete.join(', ')}. Review and save the affected sections in Admin Settings. Existing records have not been replaced with defaults.`);
    return value;
  }
  const account=await adminIdentity();
  const permissions=await checked(requireSupabase().from('staff_permissions').select('role,permission'));
  value.permissions={roles:Object.fromEntries(Object.keys(roleLabels).map(role=>[role,role==='SUPER_ADMIN'?permissionList:permissions.filter(p=>p.role===role).map(p=>p.permission)]))};
  let payments={modes:[{mode:'TEST',configured:false},{mode:'LIVE',configured:false}]};
  if(account.permissions.includes('MANAGE_SETTINGS')){
    try{payments=await edge('staff',{action:'payment-configuration'});}
    catch(error){payments={...payments,error:`Payment configuration could not be verified: ${error.message}. Deploy the staff Edge Function; other database-backed settings remain available.`};}
  }
  const incompleteSections=Object.entries(defaults).filter(([section])=>section!=='permissions').flatMap(([section,template])=>{
    const missing=Object.keys(template).filter(key=>!Object.prototype.hasOwnProperty.call(value[section]||{},key));return missing.length?[{section,fields:missing}]:[];
  });
  return { ...value, account, meta: { incompleteSections,configurationDefaults:defaults,payments,permissions:account.permissions,roleLabels,permissionList,sectionVersions:Object.fromEntries(rows.map(r=>[r.section,r.version])),currencyLocked:(await checked(requireSupabase().from('orders').select('id').limit(1))).length>0,
    paymentCapabilities:{testConfigured:false,liveConfigured:false,card:true,bankTransfer:true},paymentCredentials:{TEST:false,LIVE:false} } };
}
export function products(params, admin=false, id) {
  if(admin)return loadProducts(params,true,id);
  const canonical=new URLSearchParams(params);
  if(!canonical.has('limit'))canonical.set('limit','20');
  canonical.sort();
  return publicReads.run(`catalogue:${id||''}:${canonical}`,()=>loadProducts(params,false,id));
}
async function loadProducts(params, admin=false, id) {
  let q=requireSupabase().from('products').select(productSelect,{count:'exact'}).is('archivedAt',null);
  if(!admin) q=q.eq('isActive',true);
  if(id) q=q.eq(/^[\da-f]{8}-[\da-f-]{27}$/i.test(id)?'id':'slug',id);
  if(params.get('search')) q=q.ilike('name',`%${params.get('search').replace(/[%_]/g,'')}%`);
  if(params.get('category')) { const c=await checked(requireSupabase().from('product_categories').select('id').eq('slug',params.get('category')).maybeSingle());if(!c)return {data:[],pagination:{page:1,totalPages:0,total:0}};q=q.eq('categoryId',c.id); }
  if(params.get('collection')) { const c=await checked(requireSupabase().from('product_collections').select('id').eq('slug',params.get('collection')).maybeSingle());if(!c)return {data:[],pagination:{page:1,totalPages:0,total:0}};const links=await checked(requireSupabase().from('product_collection_links').select('productId').eq('collectionId',c.id));q=q.or(`collectionId.eq.${c.id}${links.length?`,id.in.(${links.map(l=>l.productId).join(',')})`:''}`); }
  if(params.get('minPrice')) q=q.gte('price',Number(params.get('minPrice')));
  if(params.get('maxPrice')) q=q.lte('price',Number(params.get('maxPrice')));
  if(params.get('featured')==='true') q=q.eq('isFeatured',true);
  // Variant filters are resolved before pagination so counts and page boundaries agree.
  const productSettings=(await settings()).products;
  const availableOnly=params.get('available')==='true'||(!admin&&productSettings.outOfStockVisibility==='HIDE');
  if(params.get('size')||params.get('color')||availableOnly) {
    let v=requireSupabase().from('product_variants').select('productId,inventory(quantity,reserved)').eq('isActive',true);
    if(params.get('size'))v=v.eq('size',params.get('size'));
    if(params.get('color'))v=v.ilike('color',params.get('color'));
    const vs=(await checked(v)).filter(v=>!availableOnly||(v.inventory?.quantity||0)>(v.inventory?.reserved||0));
    q=q.in('id',[...new Set(vs.map(v=>v.productId))]);
  }
  const page=Math.max(1,Number(params.get('page'))||1),limit=Math.min(100,Math.max(1,Number(params.get('limit'))||20));
  q=q.order(params.get('sort')?.startsWith('price-')?'price':['popular','best-selling'].includes(params.get('sort'))?'soldCount':'createdAt',{ascending:params.get('sort')==='price-low'});
  if(id)return checked(q.single());
  const {data,error,count,status}=await q.range((page-1)*limit,page*limit-1);if(error)throw supabaseError(error,status);
  return {data,pagination:{page,limit,total:count,totalPages:Math.ceil(count/limit)}};
}
async function parent(table, verifiedUser) {
  const user=verifiedUser||await currentUser();
  return checked(requireSupabase().from(table).upsert({customerId:user.id},{onConflict:'customerId'}).select('*').single());
}
export async function cart(path,method,body) {
  let user;try {user=await currentUser();} catch(e) {if(method==='GET'&&e.status===401)return {items:[],subtotal:0};throw e;}
  const sb=requireSupabase(),p=await parent('carts',user),id=path.split('/')[3];
  if(method==='POST') {
    const v=await checked(sb.from('product_variants').select('*,inventory(*)').eq('id',body.variantId).eq('isActive',true).single());
    const old=await checked(sb.from('cart_items').select('*').eq('cartId',p.id).eq('variantId',v.id).maybeSingle());
    const quantity=(old?.quantity||0)+Number(body.quantity);
    if(!Number.isInteger(quantity)||quantity<1||quantity>100||quantity>(v.inventory?.quantity||0)-(v.inventory?.reserved||0))throw new Error('Choose a quantity within available stock.');
    await checked(sb.from('cart_items').upsert({cartId:p.id,variantId:v.id,quantity},{onConflict:'cartId,variantId'}));
  }
  if(method==='PATCH')await checked(sb.from('cart_items').update({quantity:Number(body.quantity)}).eq('cartId',p.id).eq('id',id).select().single());
  if(method==='DELETE') {let q=sb.from('cart_items').delete().eq('cartId',p.id);if(id)q=q.eq('id',id);await checked(q);}
  const items=await checked(sb.from('cart_items').select('*,variant:product_variants(*,inventory(*),product:products(*,discounts(*),images:product_images(*)))').eq('cartId',p.id).order('createdAt'));
  const result=items.map(i=>i.variant?.product?({id:i.id,variantId:i.variantId,productId:i.variant.product.id,productName:i.variant.product.name,size:i.variant.size,color:i.variant.color,quantity:i.quantity,unitPrice:effectivePrice(i.variant.product,i.variant.priceDiff),image:i.variant.product.images?.[0]?.url||'',slug:i.variant.product.slug}):({id:i.id,variantId:i.variantId,productId:i.variantId,productName:'Unavailable product — remove this item before checkout',size:'',color:'',quantity:i.quantity,unitPrice:0,image:'',unavailable:true}));
  for(const item of result){const source=items.find(i=>i.id===item.id);item.availableStock=Math.max(0,(source?.variant?.inventory?.quantity||0)-(source?.variant?.inventory?.reserved||0));}
  return {items:result,subtotal:result.reduce((s,i)=>s+i.quantity*i.unitPrice,0)};
}
export async function upload(bucket,file,prefix) {
  if(!file)throw new Error('Choose an image.');
  if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp','image/x-icon','image/vnd.microsoft.icon'].includes(file.type))throw new Error('Choose a PNG, JPEG, WebP or favicon image smaller than 5 MB.');
  const path=`${prefix}/${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;
  await checked(requireSupabase().storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type}));
  return {path,url:requireSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl};
}
export async function request(path,{method='GET',body={},role,full=false}={}) {
  const sb=requireSupabase();const url=new URL(path,'https://nobelle.invalid');const parts=url.pathname.split('/').filter(Boolean);const admin=parts[0]==='admin';const p=admin?parts.slice(1):parts;const [resource,id,action,childId]=p;const params=url.searchParams;
  if(resource==='store'&&id==='settings')return settings();
  if(resource==='products'&&method==='GET'){const result=await products(params,admin,id);return id?result:full?result:result.data;}
  if(resource==='content') {
    if(method!=='GET')return rpc('save_content',{content_slug:id,content_data:body.data});
    const row=await checked(sb.from('website_settings').select('data').eq('slug',id).maybeSingle());
    if(id==='homepage'){
      const [sections,banners]=await Promise.all([checked(sb.from('homepage_sections').select('*').eq('isActive',true).order('sortOrder')),checked(sb.from('banners').select('*').eq('isActive',true).order('sortOrder'))]);
      return {...(row?.data||{}),sections:sections.map(s=>({id:s.id,data:s})),banners:banners.map(b=>({...b,image:b.imageUrl,link:b.linkUrl}))};
    }
    if(id==='contact'){const cfg=await settings();return {email:cfg.store.supportEmail,phone:cfg.store.phone,address:cfg.store.address,...(row?.data||{})};}
    return row?.data||{};
  }
  if(resource==='policies'&&!admin){const row=await rpc('published_policy',{policy_id:id});if(!row){const e=new Error('Policy has not been published.');e.status=404;throw e;}return row;}
  if(resource==='contact'||resource==='newsletter')return edge('public-forms',{kind:resource,...body});
  if(resource==='cart')return cart(url.pathname,method,body);
  if(resource==='wishlist'){
    const w=await parent('wishlists');
    if(method==='POST')await checked(sb.from('wishlist_items').upsert({wishlistId:w.id,productId:id},{onConflict:'wishlistId,productId'}));
    if(method==='DELETE')await checked(sb.from('wishlist_items').delete().eq('wishlistId',w.id).eq('productId',id));
    return (await checked(sb.from('wishlist_items').select(`*,product:products(${productSelect})`).eq('wishlistId',w.id))).map(item=>({...item,product:item.product||{id:item.productId,name:'Unavailable product',slug:item.productId,variants:[]}}));
  }
  if(resource==='addresses'){
    const me=await currentUser();
    if(method==='GET')return checked(sb.from('customer_addresses').select('*').eq('customerId',me.id).order('createdAt'));
    if(method==='DELETE')return checked(sb.from('customer_addresses').delete().eq('id',id).eq('customerId',me.id));
    // Default changes are transactional, including concurrent browser tabs.
    return rpc('save_address',{address_id:id||null,payload:body});
  }
  if(resource==='profile'&&!admin){
    if(id==='password')return changePassword(body);
    const me=await currentUser();const clean=Object.fromEntries(['firstName','lastName','phone','name','avatarUrl'].filter(k=>k in body).map(k=>[k,body[k]]));
    return checked(sb.from('profiles').update(clean).eq('id',me.id).select().single());
  }
  if(resource==='profile'&&admin)return settingsRequest(['account'],method,body);
  if(resource==='orders'&&method==='POST'&&!id)return edge('checkout',{payload:body});
  if(resource==='orders'&&action==='cancel')return rpc('cancel_order',{order_id:id});
  if(resource==='orders'&&action==='status')return rpc('transition_order',{order_id:id,next_status:body.status});
  if(resource==='orders'&&action==='shipment')return rpc('save_shipment',{order_id:id,carrier_name:body.carrier,tracking_number:body.trackingNumber});
  if(resource==='orders'&&method==='GET'){
    let q=sb.from('orders').select(orderSelect).order('createdAt',{ascending:false});
    if(!admin)q=q.eq('customerId',(await currentUser()).id);
    if(id&&id!=='my-orders'){
      const o=await checked(q.eq('id',id).single());
      if(action==='invoice'){const cfg=await settings();return {...o,storeName:cfg.store.businessName,address:cfg.store.address,total:o.totalAmount};}return o;
    }
    if(params.get('search'))q=q.ilike('orderNumber',`%${params.get('search')}%`);
    return checked(paginate(q,params));
  }
  if(resource==='payments'&&!admin)return edge('payments',{action:id==='paystack'?(action==='initialize'?'initialize':'verify'):id,...body,reference:childId});
  if(resource==='returns'&&!admin&&method==='POST')return rpc('request_return',{payload:body});
  if(resource==='returns'&&action==='status')return rpc('transition_return',{return_id:id,next_status:body.status});
  if(resource==='returns'&&action==='refund')return edge('payments',{action:'refund',returnId:id});
  if(resource==='refunds'&&action==='verify')return edge('payments',{action:'verify-refund',gatewayId:id});
  if(resource==='products'&&action==='reviews')return rpc('submit_review',{product_id:id,stars:body.rating,review_text:body.comment});
  if(resource==='notifications'&&action==='read')return checked(sb.from(admin?'admin_notifications':'notifications').update({isRead:true}).eq('id',id).select().single());
  if(resource==='notifications'&&method==='GET') {const items=await checked(paginate(sb.from(admin?'admin_notifications':'notifications').select('*').order('createdAt',{ascending:false}),params));const {count,error}=await sb.from(admin?'admin_notifications':'notifications').select('id',{count:'exact',head:true}).eq('isRead',false);if(error)throw error;return {items,unreadCount:count};}
  if(resource==='dashboard')return rpc('admin_dashboard');
  if(resource==='reports')return rpc('admin_report',{date_from:params.get('from')||'-infinity',date_to:params.get('to')||'infinity'});
  if(resource==='summary')return summary(id);
  if(resource==='staff'&&admin)return edge('staff',{method,id,...body});
  if(resource==='customers'&&id&&method==='GET')return rpc('admin_customer',{customer_id:id});
  if(resource==='inventory'&&method!=='GET')return rpc('adjust_inventory',{variant_id:id,new_quantity:Number(body.quantity),note:body.reason});
  if(resource==='settings')return settingsRequest(p.slice(1),method,body);
  if(admin&&resource==='categories'&&method!=='GET')return rpc('manage_category',{category_id:id||null,payload:body,operation:method});
  if(admin&&resource==='products'&&action==='images'){
    if(method==='POST') {
      for(const file of body.getAll('images')) {const asset=await upload('product-images',file,id);try{await rpc('admin_write',{resource:'images',record_id:null,payload:{productId:id,...asset},operation:'POST'});}catch(e){await sb.storage.from('product-images').remove([asset.path]);throw e;}}
      return true;
    }
    if(childId==='order') {for(const [index,imageId] of body.ids.entries())await rpc('admin_write',{resource:'images',record_id:imageId,payload:{sortOrder:index,isPrimary:index===0},operation:'PATCH'});return true;}
    const image=await checked(sb.from('product_images').select('*').eq('id',childId).eq('productId',id).single());
    await rpc('admin_write',{resource:'images',record_id:childId,payload:{},operation:'DELETE'});if(image.path)await checked(sb.storage.from('product-images').remove([image.path]));return true;
  }
  if(admin&&resource==='products'&&action==='variants')return rpc('admin_write',{resource:'variants',record_id:childId||null,payload:{...body,productId:id},operation:method});
  if(admin&&method!=='GET')return rpc('admin_write',{resource,record_id:id||null,payload:body,operation:method});
  const table=resourceTables[resource];if(!table)throw new Error(`Unsupported Supabase operation: ${method} ${url.pathname}`);
  let select=resource==='inventory'?'*,variant:product_variants(*,product:products(*))':resource==='stock-history'?'*,variant:product_variants(*,product:products(*))':resource==='returns'?'*,order:orders(*),items:return_items(*),refund:refunds(*)':resource==='reviews'?'*,product:products(*),customer:profiles(*)':resource==='payments'?'*,order:orders(*,customer:profiles(*))':resource==='customers'?'*,orders:orders(id,totalAmount,paymentStatus)':resource==='coupons'?'*,usages:coupon_usage(id)':'*';
  let q=sb.from(table).select(select).order('createdAt',{ascending:false});
  if(!admin&&['categories','collections','delivery-zones'].includes(resource))q=q.eq('isActive',true);
  if(!admin&&resource==='returns')q=q.eq('customerId',(await currentUser()).id);
  const records=await checked(paginate(q,params));
  return records.map(r=>resource==='customers'?{...r,_count:{orders:r.orders.length},totalSpent:r.orders.filter(o=>o.paymentStatus==='SUCCESS').reduce((n,o)=>n+Number(o.totalAmount),0)}:resource==='coupons'?{...r,usedCount:r.usages.length}:r);
}
function paginate(query,params){const page=Math.max(1,Number(params.get('page'))||1),limit=Math.min(100,Math.max(1,Number(params.get('limit'))||20));return query.range((page-1)*limit,page*limit-1);}
export async function changePassword(body){
  if((body.newPassword||'').length<12)throw new Error('Use at least 12 characters.');
  if(body.confirmPassword&&body.newPassword!==body.confirmPassword)throw new Error('Passwords must match.');
  const me=await currentUser();await checked(requireSupabase().auth.signInWithPassword({email:me.email,password:body.currentPassword}));
  await checked(requireSupabase().auth.updateUser({password:body.newPassword}));await checked(requireSupabase().auth.signOut({scope:'others'}));return true;
}
async function settingsRequest(p,method,body){
  const [section,id,child,childId]=p,sb=requireSupabase();
  if(section==='config')return settings(true);
  if(section==='account'){
    if(id==='password')return changePassword(body);
    const me=await currentUser();
    if(body.email&&body.email!==me.email){await checked(sb.auth.signInWithPassword({email:me.email,password:body.currentPassword}));await checked(sb.auth.updateUser({email:body.email}));}
    return checked(sb.from('profiles').update({name:body.name,phone:body.phone,avatarUrl:body.avatarUrl}).eq('id',me.id).select().single());
  }
  if(section==='assets'){const me=await currentUser();return upload(id==='avatar'?'avatars':'store-assets',body.get('image'),me.id);}
  if(section==='shipping'&&id==='zones')return request(`/admin/delivery-zones${child?`/${child}`:''}`,{method,body});
  if(section==='policies'){
    const shape=r=>({...r,lastUpdated:r.updatedAt,hasPublished:!!r.published,publishedAt:r.published?.lastUpdated});
    return method==='GET'?(await checked(sb.from('policies').select('*').order('createdAt'))).map(shape):shape(await rpc('save_policy',{policy_id:id,payload:body}));
  }
  if(section==='staff')return edge('staff',{id,method,...body});
  if(section==='security'){
    if(method==='DELETE'){if(child)return rpc('revoke_admin_session',{session_id:child});await checked(sb.auth.signOut({scope:'others'}));return true;}
    return rpc('admin_security_data');
  }
  return rpc('save_settings',{setting_section:section,setting_values:body.values,expected_version:body.version??null});
}
async function summary(resource){
  const table=resourceTables[resource]||(resource==='products'?'products':null);if(!table)return [];
  const {count,error}=await requireSupabase().from(table).select('id',{count:'exact',head:true});if(error)throw error;
  return [{label:'Total records',value:count}];
}
