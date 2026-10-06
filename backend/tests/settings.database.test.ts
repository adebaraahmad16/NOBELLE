import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();
const url=process.env.TEST_DATABASE_URL;
if(url && (new URL(url).protocol!=='mysql:' || !new URL(url).pathname.endsWith('_test')))throw Error('Use a dedicated test database');
if(url)process.env.DATABASE_URL=url;

test('Settings MySQL integration: persistence, policies, authorization, sessions and stock deduction rules',{skip:!url?'TEST_DATABASE_URL is not configured':false},async()=>{
 const {default:prisma}=await import('../src/repositories/prisma');
 const {SettingsService}=await import('../src/services/settings.service');
 const {AdminAuthService}=await import('../src/services/adminAuth.service');
 const {PasswordUtil}=await import('../src/utils/password');
 const {DEFAULT_SETTINGS}=await import('../src/validators/settings.validator');
 const {ProductService}=await import('../src/services/product.service');
 const {CartService}=await import('../src/services/cart.service');
 const {CheckoutService}=await import('../src/services/checkout.service');
 const {PaymentService}=await import('../src/services/payment.service');
 const {OrderService}=await import('../src/services/order.service');
 const key=randomUUID(),password='Settings-integration-password';
 const admin=await prisma.admin.create({data:{name:'Settings fixture',email:`${key}@example.test`,passwordHash:await PasswordUtil.hash(password)}});
 const original=await prisma.websiteContent.findUnique({where:{slug:'store-settings'}});
 const originalPolicy=await prisma.websiteContent.findUnique({where:{slug:'policy-privacy'}});
 await prisma.websiteContent.deleteMany({where:{slug:'policy-privacy'}});
 const category=await prisma.category.create({data:{name:key,slug:key}});
 const customer=await prisma.customer.create({data:{email:`${key}-customer@example.test`,passwordHash:await PasswordUtil.hash(password),firstName:'Settings',lastName:'Fixture'}});
 let staffId:string|undefined,zoneId:string|undefined,productId:string|undefined;
 let server:any;
 try{
  await SettingsService.save('general',{...DEFAULT_SETTINGS.general,storeName:'Settings integration fixture'},undefined,'SUPER_ADMIN');
  const first=await SettingsService.get();assert.equal(first.settings.general.storeName,'Settings integration fixture');
  await SettingsService.save('products',{...first.settings.products,automaticSku:true,lowStockThreshold:7},first.sectionVersions.products,'SUPER_ADMIN');
  await SettingsService.save('general',{...first.settings.general,dateFormat:'YYYY-MM-DD'},first.sectionVersions.general,'SUPER_ADMIN');
  await assert.rejects(()=>SettingsService.save('general',first.settings.general,first.sectionVersions.general,'SUPER_ADMIN'),/another session/);
  const zone=await SettingsService.saveZone(undefined,{name:key,country:'Nigeria',states:['Lagos'],fee:3500,estimatedDays:'1–3 business days',freeDeliveryThreshold:100,isActive:true});zoneId=zone.id;
  assert.equal((await SettingsService.zones()).find(z=>z.id===zone.id)?.freeDeliveryThreshold,100);
  const draft=await SettingsService.savePolicy('privacy',{title:'Private draft',content:'<p>Safe</p><script>alert(1)</script>',status:'DRAFT'});assert.ok(!draft.content.includes('script'));
  await assert.rejects(()=>SettingsService.publishedPolicy('privacy'),/not been published/);
  await SettingsService.savePolicy('privacy',{title:'Published',content:'<p>Live content</p>',status:'PUBLISHED'});
  await SettingsService.savePolicy('privacy',{title:'Unpublished revision',content:'<p>New draft</p>',status:'DRAFT'});
  assert.equal((await SettingsService.publishedPolicy('privacy')).title,'Published');
  const member=await SettingsService.saveStaff(admin.id,'SUPER_ADMIN',undefined,{name:'Support fixture',email:`${key}-staff@example.test`,role:'SUPPORT',isActive:true,password});staffId=member.id;
  const login=await AdminAuthService.login(member.email,password,false,'Mozilla/5.0 Windows NT Chrome/123');
  const {default:app}=await import('../src/app');server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
  const address=server.address();const base=`http://127.0.0.1:${address.port}/api/v1/admin`;
  const forbidden=await fetch(`${base}/settings/general`,{method:'PATCH',headers:{Authorization:`Bearer ${login.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({values:DEFAULT_SETTINGS.general})});assert.equal(forbidden.status,403);
  const root=await fetch(`${base}/settings/config`,{headers:{Authorization:`Bearer ${login.accessToken}`}});const rootData:any=await root.json();assert.equal(root.status,200);assert.equal(rootData.data.general,undefined);assert.equal(rootData.data.account.email,member.email);assert.equal(JSON.stringify(rootData).includes('passwordHash'),false);
  const sessions=await SettingsService.security(member.id,(await prisma.refreshToken.findFirstOrThrow({where:{adminId:member.id,revoked:false}})).id);assert.equal(sessions.sessions[0].browser,'Chrome');assert.equal('tokenHash' in sessions.sessions[0],false);
  await SettingsService.removeStaff(admin.id,'SUPER_ADMIN',member.id);
  const revoked=await fetch(`${base}/settings/config`,{headers:{Authorization:`Bearer ${login.accessToken}`}});assert.equal(revoked.status,401);
  const product=await ProductService.createProduct({name:'Settings fixture dress',description:'A test garment',categoryId:category.id,price:200,isActive:true,variants:[{size:'S',color:'Red',quantity:6}]},admin.id);productId=product.id;assert.ok(product.sku.startsWith('NBL-'));assert.equal(product.variants[0].inventory?.lowStockAlert,7);
  const variantId=product.variants[0].id;
  for(const deduction of ['CREATION','PAYMENT','CONFIRMATION'] as const){
   const config=await SettingsService.get();await SettingsService.save('orders',{...config.settings.orders,stockDeduction:deduction,confirmation:'MANUAL'},config.sectionVersions.orders,'SUPER_ADMIN');
   await CartService.addItem(customer.id,variantId,1);
   const before=await prisma.inventory.findUniqueOrThrow({where:{variantId}});
   const order=await CheckoutService.create(customer.id,{idempotencyKey:randomUUID(),deliveryZoneId:zone.id,shippingAddress:{recipient:'Fixture',phoneNumber:'08012345678',street:'Test address',city:'Lagos',state:'Lagos',country:'Nigeria'}});
   assert.equal(Number(order.deliveryFee),0);assert.ok(order.orderNumber.startsWith('NBL-'));
   let stock=await prisma.inventory.findUniqueOrThrow({where:{variantId}});assert.equal(stock.quantity,before.quantity-(deduction==='CREATION'?1:0));
   const reference=`settings-${randomUUID()}`;await prisma.payment.create({data:{orderId:order.id,reference,amount:order.totalAmount}});
   await PaymentService.confirm(reference,{reference,currency:'NGN',amount:20000,status:'success',customer:{email:customer.email}});
   stock=await prisma.inventory.findUniqueOrThrow({where:{variantId}});assert.equal(stock.quantity,before.quantity-(deduction==='CONFIRMATION'?0:1));
   await OrderService.updateOrderStatus(order.id,'PROCESSING',admin.id);stock=await prisma.inventory.findUniqueOrThrow({where:{variantId}});assert.equal(stock.quantity,before.quantity-1);assert.equal(stock.reserved,0);
  }
 }finally{
  if(server){server.closeAllConnections();await new Promise<void>(r=>server.close(r));}
  await prisma.return.deleteMany({where:{customerId:customer.id}});await prisma.order.deleteMany({where:{customerId:customer.id}});await prisma.customer.delete({where:{id:customer.id}});
  if(productId)await prisma.product.delete({where:{id:productId}});await prisma.category.delete({where:{id:category.id}});if(zoneId)await SettingsService.removeZone(zoneId);
  await prisma.activityLog.deleteMany({where:{adminId:admin.id}});if(staffId)await prisma.admin.delete({where:{id:staffId}});await prisma.admin.delete({where:{id:admin.id}});
  if(original)await prisma.websiteContent.update({where:{slug:'store-settings'},data:{data:original.data as any}});else await prisma.websiteContent.deleteMany({where:{slug:'store-settings'}});
  if(originalPolicy)await prisma.websiteContent.upsert({where:{slug:'policy-privacy'},create:{slug:'policy-privacy',title:originalPolicy.title,data:originalPolicy.data as any},update:{data:originalPolicy.data as any,title:originalPolicy.title}});else await prisma.websiteContent.deleteMany({where:{slug:'policy-privacy'}});
  await prisma.$disconnect();
 }
});
