import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPolicy, normalizeSettings, sectionVersions, clientDevice } from '../src/services/settings.service';
import { DEFAULT_SETTINGS, PERMISSIONS, settingSchemas, passwordSchema, zoneSchema } from '../src/validators/settings.validator';
import { requiredPermission } from '../src/middleware/adminPermissions';
import { deductOrderInventory, releaseOrderInventory } from '../src/services/inventoryPolicy.service';

test('policy sanitization blocks executable HTML and unsafe links',()=>{
 const html=cleanPolicy('<p>Hello</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">Unsafe</a><a href="https://nobelle.test">Safe</a>');
 assert.ok(html.includes('<p>Hello</p>'));assert.ok(html.includes('https://nobelle.test'));assert.ok(!/script|onerror|javascript:|<img/.test(html));
});
test('legacy configuration upgrades without dropping supported defaults or super permissions',()=>{
 const result=normalizeSettings({storeName:'Custom Nobelle',contactEmail:'support@example.test',lowStockThreshold:8,permissions:{roles:{SUPER_ADMIN:[]}}});
 assert.equal(result.general.storeName,'Custom Nobelle');assert.equal(result.store.supportEmail,'support@example.test');assert.equal(result.products.lowStockThreshold,8);assert.deepEqual(result.permissions.roles.SUPER_ADMIN,[...PERMISSIONS]);
});
test('invalid settings, duplicate sizes, passwords and delivery fees are rejected',()=>{
 assert.equal(settingSchemas.products.safeParse({...DEFAULT_SETTINGS.products,sizes:['S','s']}).success,false);
 assert.equal(settingSchemas.general.safeParse({...DEFAULT_SETTINGS.general,timezone:'invalid'}).success,false);
 assert.equal(settingSchemas.payments.safeParse({...DEFAULT_SETTINGS.payments,card:false,bankTransfer:false}).success,false);
 assert.equal(passwordSchema.safeParse({currentPassword:'old-password',newPassword:'new-secure-password',confirmPassword:'different-password'}).success,false);
 assert.equal(zoneSchema.safeParse({name:'Lagos',country:'Nigeria',states:['Lagos'],fee:-1,estimatedDays:'2 days',freeDeliveryThreshold:null,isActive:true}).success,false);
});
test('API permissions cover cancellation, refunds, staff, configuration and self-account boundaries',()=>{
 assert.equal(requiredPermission('PATCH','/orders/id',{status:'CANCELLED'}),'CANCEL_ORDERS');
 assert.equal(requiredPermission('POST','/returns/id/refund',{}),'PROCESS_REFUNDS');
 assert.equal(requiredPermission('PATCH','/settings/permissions',{}),'MANAGE_STAFF');
 assert.equal(requiredPermission('DELETE','/settings/staff/id',{}),'MANAGE_STAFF');
 assert.equal(requiredPermission('PATCH','/settings/general',{}),'MANAGE_SETTINGS');
 assert.equal(requiredPermission('POST','/settings/assets/logo',{}),'MANAGE_SETTINGS');
 assert.equal(requiredPermission('POST','/settings/assets/avatar',{}),null);
 assert.equal(requiredPermission('GET','/settings/security',{}),null);
});
test('section version guards remain independent and session device data is coarse',()=>{
 const versions=sectionVersions({updatedAt:new Date('2026-01-01'),data:{_versions:{general:'general-v2',products:'products-v1'}}});
 assert.equal(versions.general,'general-v2');assert.equal(versions.products,'products-v1');
 assert.deepEqual(clientDevice('Mozilla/5.0 Windows NT Chrome/123.0'),{device:'Windows device',browser:'Chrome'});
 assert.deepEqual(clientDevice(null),{device:'Unknown device',browser:'Unknown browser'});
});
test('inventory deductions and cancellation restore exactly the stock belonging to an order',async()=>{
 const inventory={id:'inv',quantity:8,reserved:5},history:any[]=[];
 let snapshot:any={...DEFAULT_SETTINGS.orders,stockDeduction:'CREATION',allowBackorders:false,reserved:{v:3},deducted:{},confirmation:'MANUAL',currency:'NGN',returnPeriodDays:14,allowCancellation:true,cancellationPeriodMinutes:30,paymentMode:'TEST'};
 const tx:any={inventory:{findUnique:async()=>inventory,findUniqueOrThrow:async()=>inventory,update:async({data}:any)=>{for(const key of ['quantity','reserved']){inventory[key as 'quantity'|'reserved']+=(data[key]?.increment||0)-(data[key]?.decrement||0);}return inventory;}},inventoryTransaction:{create:async({data}:any)=>history.push(data)},order:{update:async({data}:any)=>{snapshot=data.settingsSnapshot;}}};
 const order:any={id:'o',items:[{variantId:'v',quantity:3}],settingsSnapshot:snapshot};
 await deductOrderInventory(tx,order,'Creation');assert.equal(inventory.quantity,5);assert.equal(inventory.reserved,2);
 order.settingsSnapshot=snapshot;await deductOrderInventory(tx,order,'Payment');assert.equal(inventory.quantity,5);assert.equal(history.length,1);
 await releaseOrderInventory(tx,order,'Cancellation');assert.equal(inventory.quantity,8);assert.equal(inventory.reserved,2);
});
test('backorders deduct available units but cannot ship until fully stocked',async()=>{
 const snapshot={stockDeduction:'PAYMENT',allowBackorders:true,reserved:{v:1},deducted:{},confirmation:'MANUAL',currency:'NGN',returnPeriodDays:14,allowCancellation:true,cancellationPeriodMinutes:30,paymentMode:'TEST'};
 const tx:any={inventory:{findUnique:async()=>({id:'inv',quantity:1,reserved:1}),update:async()=>({})},inventoryTransaction:{create:async()=>({})},order:{update:async()=>({})}};
 const order={id:'o',items:[{variantId:'v',quantity:3}],settingsSnapshot:snapshot};
 const result=await deductOrderInventory(tx,order,'Payment');assert.equal(result.deducted.v,1);assert.equal(result.reserved.v,0);
 await assert.rejects(()=>deductOrderInventory(tx,{...order,settingsSnapshot:result},'Shipping',true),/Backordered items/);
});
