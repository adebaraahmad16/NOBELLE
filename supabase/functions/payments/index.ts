import { endpoint,caller,value,paymentConfig,paystack,verifyPayment,verifyRefund } from '../_shared/runtime.ts';
endpoint(async req=>{
 const {user,client,admin}=await caller(req),body=await req.json();
 if(body.action==='configuration'){
  const cfg=await paymentConfig(admin);return {mode:cfg.mode,configured:!!cfg.key};
 }
 if(body.action==='initialize'){
  const order=await value(admin.from('orders').select('*').eq('id',body.orderId).eq('customerId',user.id).single());
  if(order.status!=='PENDING'||order.paymentStatus==='SUCCESS'||new Date(order.expiresAt)<=new Date())throw new Error('Order cannot accept payment');
  const cfg=await paymentConfig(admin);if(!cfg.enabled)throw new Error('Payments are currently disabled');
  if(!cfg.key){if(cfg.mode==='LIVE')throw new Error('Live payment credentials are not configured');return {testMode:true,message:'Test checkout only: Paystack test credentials are not configured. No charge was made and this order remains unpaid.'};}
  const reference=`NBL-${crypto.randomUUID()}`;
  const {error}=await admin.from('payments').insert({orderId:order.id,reference,amount:order.totalAmount,currency:order.currency,mode:cfg.mode});
  if(error&&error.code!=='23505')throw new Error(error.message);
  const payment=await value(admin.from('payments').select('*').eq('orderId',order.id).single());
  if(payment.mode!==cfg.mode)throw new Error('Payment mode changed. Cancel this order and check out again.');
  if(payment.authorizationUrl)return {authorization_url:payment.authorizationUrl,mode:cfg.mode};
  // A persistent reference makes duplicate initialize requests safe at the gateway.
  let tx;
  try{tx=await paystack('/transaction/initialize',cfg.key,{email:user.email,amount:Math.round(Number(order.totalAmount)*100),currency:order.currency,reference:payment.reference,
   callback_url:`${Deno.env.get('SITE_URL')}/checkout`,channels:[...(cfg.card?['card']:[]),...(cfg.bankTransfer?['bank_transfer']:[])]});}
  catch(error){throw new Error('Could not initialize payment. Check your order before retrying. '+(error instanceof Error?error.message:''));}
  const url=new URL(tx.authorization_url);if(url.protocol!=='https:'||!['checkout.paystack.com','checkout.paystack.co'].includes(url.hostname))throw new Error('Invalid payment destination');
  await value(admin.from('payments').update({authorizationUrl:url.href}).eq('id',payment.id));
  return {authorization_url:url.href,reference:payment.reference,mode:cfg.mode};
 }
 if(body.action==='verify'){
  const p=await value(admin.from('payments').select('*,order:orders(customerId)').eq('reference',body.reference).single());
  if(p.order.customerId!==user.id)throw new Error('Access denied');
  return verifyPayment(admin,p.reference);
 }
 if(body.action==='refund'){
  const refund=await value(client.rpc('prepare_refund',{return_id:body.returnId}));
  if(refund.gatewayId)return refund;
  const p=await value(admin.from('payments').select('*').eq('id',refund.paymentId).single());
  const key=Deno.env.get(p.mode==='LIVE'?'PAYSTACK_SECRET_KEY_LIVE':'PAYSTACK_SECRET_KEY_TEST');if(!key)throw new Error('Payment credentials not configured');
  const claimed=await value(admin.from('refunds').update({dispatchStartedAt:new Date().toISOString()}).eq('id',refund.id).is('dispatchStartedAt',null).select());
  if(!claimed.length)throw new Error('Refund already submitted or awaiting reconciliation. Check Paystack before retrying.');
  // Never automatically resubmit an uncertain refund after a network timeout.
  const tx=await paystack('/refund',key,{transaction:refund.reference,amount:Math.round(Number(refund.amount)*100),merchant_note:`NOBELLE refund ${refund.id}`});
  if(Number(tx.amount)!==Math.round(Number(refund.amount)*100)||tx.currency!==p.currency||tx.domain!==(p.mode==='LIVE'?'live':'test')||String(typeof tx.transaction==='object'?tx.transaction.id:tx.transaction)!==p.gatewayId)throw new Error('Refund response mismatch; reconcile this request in Paystack');
  await value(admin.from('refunds').update({gatewayId:String(tx.id)}).eq('id',refund.id));
  await value(admin.rpc('settle_refund',{refund_id:refund.id,gateway_id:String(tx.id),refund_status:tx.status==='processed'?'SUCCESS':tx.status==='failed'?'FAILED':'PENDING'}));
  return tx;
 }
 if(body.action==='verify-refund'){
  if(!await value(client.rpc('has_permission',{required:'PROCESS_REFUNDS'})))throw new Error('Access denied');
  const r=await value(admin.from('refunds').select('*,payment:payments(*)').eq('gatewayId',body.gatewayId).single());
  return verifyRefund(admin,r);
 }
 throw new Error('Unknown payment action');
});
