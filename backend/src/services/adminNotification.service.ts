import prisma from '../repositories/prisma';
import { type Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { SettingsService } from './settings.service';
import { type NotificationEvent } from '../validators/settings.validator';
export const escapeHtml=(value:unknown)=>String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export class AdminNotificationService {
 static async emit(event:NotificationEvent,title:string,message:string,linkUrl:string,key:string,tx:Prisma.TransactionClient=prisma){
  const {settings}=await SettingsService.get(tx);const flag=(settings.notifications as Record<string,{dashboard:boolean;email:boolean}>)[event] || {dashboard:true,email:false};
  if(['lowStock','outOfStock'].includes(event) && !settings.products.lowStockNotifications)return;
  if(event==='newOrder' && !settings.orders.orderNotifications)return;
  if(flag.dashboard)await tx.notification.create({data:{title,message,linkUrl}});
  if(flag.email){const recipients=settings.store.businessEmail?[settings.store.businessEmail]:(await tx.admin.findMany({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null},select:{email:true}})).map(a=>a.email);for(const recipient of recipients)await tx.emailJob.upsert({where:{key:`admin:${event}:${key}:${recipient}`},create:{key:`admin:${event}:${key}:${recipient}`,recipient,subject:`NOBELLE: ${title}`,html:`<p>${escapeHtml(message)}</p>`},update:{}});}
 }
 static async stock(variantId:string,tx:Prisma.TransactionClient=prisma){const row=await tx.inventory.findUnique({where:{variantId},include:{variant:true}});if(!row)return;const available=row.quantity-row.reserved;if(available<=0)await this.emit('outOfStock','Out of stock',`${row.variant.sku} has no available units`,'/admin/inventory',randomUUID(),tx);else if(available<=row.lowStockAlert)await this.emit('lowStock','Low stock',`${row.variant.sku}: ${available} available`,'/admin/inventory',randomUUID(),tx);}
}
