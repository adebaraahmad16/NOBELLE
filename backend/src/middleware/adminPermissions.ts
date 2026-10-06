import { type Permission } from '../validators/settings.validator';
export function requiredPermission(method:string,path:string,body:any):Permission | null {
 const pieces=path.split('/').filter(Boolean),resource=pieces[0],read=['GET','HEAD'].includes(method);
 if(resource==='auth')return null;
 if(resource==='settings'){
  if(['account','security'].includes(pieces[1]) || pieces[1]==='assets' && pieces[2]==='avatar')return null;
  if(pieces[1]==='staff' || pieces[1]==='permissions')return 'MANAGE_STAFF';
  return read && pieces[1]==='config'?null:'MANAGE_SETTINGS';
 }
 if(resource==='profile')return null;
 if(['products','categories','collections'].includes(resource))return read?'VIEW_PRODUCTS':method==='POST' && pieces.length===1?'CREATE_PRODUCTS':method==='DELETE' && pieces.length===2?'DELETE_PRODUCTS':'EDIT_PRODUCTS';
 if(['inventory','stock-history'].includes(resource))return 'MANAGE_INVENTORY';
 if(resource==='orders')return read?'VIEW_ORDERS':body?.status==='CANCELLED'?'CANCEL_ORDERS':'UPDATE_ORDERS';
 if(resource==='returns')return pieces.includes('refund')?'PROCESS_REFUNDS':read?'VIEW_ORDERS':'UPDATE_ORDERS';
 if(resource==='refunds')return 'PROCESS_REFUNDS';
 if(resource==='customers')return read?'VIEW_CUSTOMERS':'MANAGE_CUSTOMERS';
 if(resource==='payments')return 'VIEW_PAYMENTS';
 if(['coupons','discounts'].includes(resource))return 'MANAGE_PROMOTIONS';
 if(['website','content','homepage-sections','banners','about','contact-content','messages'].includes(resource))return 'MANAGE_WEBSITE';
 if(['reviews'].includes(resource))return 'EDIT_PRODUCTS';
 if(['delivery-zones','settings'].includes(resource))return read?null:'MANAGE_SETTINGS';
 if(resource==='staff')return 'MANAGE_STAFF';
 if(['dashboard','reports','analytics','activity-logs'].includes(resource))return 'VIEW_ANALYTICS';
 if(resource==='summary')return requiredPermission('GET',`/${pieces[1]}`,{});
 if(resource==='notifications')return null;
 return 'MANAGE_SETTINGS';
}
