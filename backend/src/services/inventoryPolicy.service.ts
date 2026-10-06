import { paymentModeDefault } from './paymentConfiguration';
﻿import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError';
export type InventorySnapshot={stockDeduction:'CREATION'|'PAYMENT'|'CONFIRMATION';allowBackorders:boolean;reserved:Record<string,number>;deducted:Record<string,number>;confirmation:'MANUAL'|'AUTOMATIC';currency:string;returnPeriodDays:number;allowCancellation:boolean;cancellationPeriodMinutes:number;paymentMode:'TEST'|'LIVE'};
export function orderInventorySnapshot(order:any):InventorySnapshot {
 const raw=order.settingsSnapshot as InventorySnapshot | null;
 if(raw)return {...raw,reserved:{...raw.reserved},deducted:{...raw.deducted}};
 return {stockDeduction:'PAYMENT',allowBackorders:false,reserved:Object.fromEntries(order.items.filter((i:any)=>i.variantId).map((i:any)=>[i.variantId,order.stockCommitted?0:i.quantity])),deducted:Object.fromEntries(order.items.filter((i:any)=>i.variantId).map((i:any)=>[i.variantId,order.stockCommitted?i.quantity:0])),confirmation:'MANUAL',currency:'NGN',returnPeriodDays:14,allowCancellation:true,cancellationPeriodMinutes:30,paymentMode:paymentModeDefault()};
}
export async function deductOrderInventory(tx:Prisma.TransactionClient,order:any,reason:string,requireFull=false,onlyVariant?:string){
 const snapshot=orderInventorySnapshot(order);
 for(const item of order.items){const id=item.variantId;if(!id || onlyVariant && id!==onlyVariant)continue;const remaining=item.quantity-(snapshot.deducted[id] || 0);if(remaining<=0)continue;
  const inventory=await tx.inventory.findUnique({where:{variantId:id}});if(!inventory)throw ApiError.conflict('Inventory unavailable');
  const owned=snapshot.reserved[id] || 0,available=Math.max(0,inventory.quantity-inventory.reserved+owned),amount=Math.min(remaining,available);
  if(amount<remaining && !snapshot.allowBackorders)throw ApiError.conflict('Reserved inventory unavailable');
  if(amount){const reservedUsed=Math.min(owned,amount);await tx.inventory.update({where:{id:inventory.id},data:{quantity:{decrement:amount},reserved:{decrement:reservedUsed}}});await tx.inventoryTransaction.create({data:{inventoryId:inventory.id,type:'SALE',delta:-amount,previousQty:inventory.quantity,newQty:inventory.quantity-amount,reason}});snapshot.reserved[id]=owned-reservedUsed;snapshot.deducted[id]=(snapshot.deducted[id] || 0)+amount;}
 }
 if(requireFull && order.items.some((item:any)=>item.variantId && (snapshot.deducted[item.variantId] || 0)<item.quantity))throw ApiError.conflict('Backordered items must be in stock before packing or shipping');
 await tx.order.update({where:{id:order.id},data:{settingsSnapshot:snapshot as any}});return snapshot;
}
export async function releaseOrderInventory(tx:Prisma.TransactionClient,order:any,reason:string){const snapshot=orderInventorySnapshot(order);for(const item of order.items){const id=item.variantId;if(!id)continue;const reserved=snapshot.reserved[id] || 0,deducted=snapshot.deducted[id] || 0;if(!reserved && !deducted)continue;const inventory=await tx.inventory.findUniqueOrThrow({where:{variantId:id}});await tx.inventory.update({where:{id:inventory.id},data:{reserved:{decrement:reserved},quantity:{increment:deducted}}});if(deducted)await tx.inventoryTransaction.create({data:{inventoryId:inventory.id,type:'CANCELLATION',delta:deducted,previousQty:inventory.quantity,newQty:inventory.quantity+deducted,reason}});snapshot.reserved[id]=0;snapshot.deducted[id]=0;}await tx.order.update({where:{id:order.id},data:{settingsSnapshot:snapshot as any}});}
