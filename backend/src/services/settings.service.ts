import prisma from '../repositories/prisma';
import { serializable } from '../database/transaction';
import { ApiError } from '../utils/apiError';
import { PasswordUtil } from '../utils/password';
import sanitizeHtml from 'sanitize-html';
import { randomUUID } from 'crypto';
import { DEFAULT_SETTINGS, settingSchemas, type SettingsSection, type StoreConfiguration, PERMISSIONS, DEFAULT_PERMISSIONS, ROLE_LABELS, POLICY_TITLES, type Permission } from '../validators/settings.validator';
import { paymentCapabilities, paymentModeDefault, paymentCredentials } from './paymentConfiguration';
const slug='store-settings';
export function sectionVersions(record:any){const prior=record?.data?._versions || {};return Object.fromEntries(Object.keys(settingSchemas).map(key=>[key,Object.prototype.hasOwnProperty.call(prior,key)?prior[key]:record?.updatedAt?.toISOString() || null]));}
export const safeAdminSelect={id:true,name:true,email:true,phone:true,avatarUrl:true,role:true,isActive:true,lastLoginAt:true,createdAt:true} as const;
export function normalizeSettings(raw:any):StoreConfiguration {
 const defaults=structuredClone(DEFAULT_SETTINGS);
 if(!raw?.payments?.mode)defaults.payments.mode=paymentModeDefault();
 if(raw?.storeName)defaults.general.storeName=raw.storeName;
 if(raw?.currency)defaults.general.currency=raw.currency;
 if(raw?.contactEmail)defaults.store.supportEmail=raw.contactEmail;
 if(raw?.contactPhone)defaults.store.phone=raw.contactPhone;
 if(raw?.address)defaults.store.address=raw.address;
 if(Number.isInteger(raw?.lowStockThreshold))defaults.products.lowStockThreshold=raw.lowStockThreshold;
 const result:any={};
 for(const key of Object.keys(settingSchemas) as SettingsSection[]){const candidate={...defaults[key],...(raw?.[key] || {})};const parsed=settingSchemas[key].safeParse(candidate);result[key]=parsed.success?parsed.data:defaults[key];}
 result.permissions.roles={...DEFAULT_PERMISSIONS,...result.permissions.roles,SUPER_ADMIN:[...PERMISSIONS]};
 result.website.logoUrl=result.store.logoUrl;result.website.faviconUrl=result.store.faviconUrl;
 return result;
}
export function cleanPolicy(html:string){return sanitizeHtml(html,{allowedTags:['p','br','h2','h3','h4','strong','b','em','i','u','ul','ol','li','a','blockquote','hr'],allowedAttributes:{a:['href','target','rel']},allowedSchemes:['https','http','mailto'],allowProtocolRelative:false,transformTags:{a:(_tag,attrs)=>({tagName:'a',attribs:{...attrs,rel:'noopener noreferrer'}})}});}
export function clientDevice(agent:string | null | undefined){const ua=agent || '';return {device:/iPad/i.test(ua)?'iPad':/iPhone/i.test(ua)?'iPhone':/Android/i.test(ua)?'Android device':/Windows/i.test(ua)?'Windows device':/Macintosh|Mac OS/i.test(ua)?'Mac':/Linux/i.test(ua)?'Linux device':'Unknown device',browser:/Edg\//i.test(ua)?'Microsoft Edge':/OPR\//i.test(ua)?'Opera':/Firefox\//i.test(ua)?'Firefox':/Chrome\//i.test(ua)?'Chrome':/Safari\//i.test(ua)?'Safari':'Unknown browser'};}
export class SettingsService {
 static async get(database:Pick<typeof prisma,'websiteContent'>=prisma){const record=await database.websiteContent.findUnique({where:{slug}});return {settings:normalizeSettings(record?.data),version:record?.updatedAt.toISOString() || null,sectionVersions:sectionVersions(record)};}
 static async permissions(role:string){if(role==='SUPER_ADMIN')return [...PERMISSIONS];const {settings}=await this.get();return (settings.permissions.roles as Record<string,Permission[]>)[role] || [];}
 static async root(adminId:string){const [configuration,account,count]=await Promise.all([this.get(),prisma.admin.findFirst({where:{id:adminId,deletedAt:null},select:safeAdminSelect}),prisma.order.count()]);if(!account)throw ApiError.notFound('Account not found');const permissions=await this.permissions(account.role);return {...(permissions.includes('MANAGE_SETTINGS')?configuration.settings:{}),...(permissions.includes('MANAGE_STAFF')?{permissions:configuration.settings.permissions}:{}),account,meta:{version:configuration.version,sectionVersions:configuration.sectionVersions,currencyLocked:count>0,payments:paymentCapabilities(),roleLabels:ROLE_LABELS,permissions,permissionList:PERMISSIONS}};}
 static async publicSettings(){const {settings}=await this.get();const {businessEmail,...store}=settings.store;return {general:settings.general,store,website:settings.website,orders:{invoicesEnabled:settings.orders.invoicesEnabled,returnPeriodDays:settings.orders.returnPeriodDays},products:settings.products,payments:{enabled:settings.payments.enabled,card:settings.payments.card,bankTransfer:settings.payments.bankTransfer,checkoutLabel:settings.payments.checkoutLabel}};}
 static async save(section:SettingsSection,input:any,version:string|null|undefined,adminRole:string){
  const parsed=settingSchemas[section]?.safeParse(input);
  if(!parsed?.success)throw ApiError.unprocessable('Invalid settings',parsed && !parsed.success?parsed.error.issues.map(e=>({field:e.path.join('.'),message:e.message})):[]);
  if(section==='permissions' && adminRole!=='SUPER_ADMIN')throw ApiError.forbidden('Only a Super Administrator can change role permissions');
  return serializable(async tx=>{
   const current=await tx.websiteContent.findUnique({where:{slug}});
   if(version!==undefined && sectionVersions(current)[section]!==version)throw ApiError.conflict('Settings changed in another session. Reload the latest settings before saving.');
   const settings=normalizeSettings(current?.data);
   if(section==='general' && (parsed.data as any).currency!==settings.general.currency && await tx.order.count())throw ApiError.conflict('Currency cannot change after the first order. Existing prices and payment history must remain consistent.');
   const next:any=parsed.data;
   if(section==='payments'){
    if(next.enabled && !paymentCredentials(next.mode).secret)throw ApiError.unprocessable('Configure the selected payment mode on the server before activating it');
    if(next.enabled && !paymentCapabilities().currencies.includes(settings.general.currency))throw ApiError.unprocessable('This currency is not configured for your Paystack account');
   }
   if(section==='general' && settings.payments.enabled && !paymentCapabilities().currencies.includes(next.currency))throw ApiError.unprocessable('This currency is not configured for your Paystack account');
   (settings as any)[section]=next;
   if(section==='website'){settings.store.logoUrl=next.logoUrl;settings.store.faviconUrl=next.faviconUrl;}
   if(section==='store'){settings.website.logoUrl=next.logoUrl;settings.website.faviconUrl=next.faviconUrl;}
   settings.permissions.roles.SUPER_ADMIN=[...PERMISSIONS];
   const previous:any=current?.data || {};
   const versions={...sectionVersions(current),[section]:randomUUID()};if(section==='website' && settings.store.logoUrl!==(normalizeSettings(current?.data).store.logoUrl))versions.store=randomUUID();if(section==='store')versions.website=randomUUID();
   const data={...previous,...settings,_versions:versions,storeName:settings.general.storeName,currency:settings.general.currency,contactEmail:settings.store.supportEmail,contactPhone:settings.store.phone,address:settings.store.address,lowStockThreshold:settings.products.lowStockThreshold};
   const result=await tx.websiteContent.upsert({where:{slug},create:{slug,title:'Store settings',data},update:{data}});
   if(section==='store'){
    const contact=await tx.websiteContent.findUnique({where:{slug:'contact'}});const contactData={...(contact?.data as object || {}),email:settings.store.supportEmail || settings.store.businessEmail,phone:settings.store.phone,address:[settings.store.address,settings.store.city,settings.store.state,settings.store.country].filter(Boolean).join(', ')};
    await tx.websiteContent.upsert({where:{slug:'contact'},create:{slug:'contact',title:'Contact information',data:contactData},update:{data:contactData}});
   }
   if(section==='permissions'){const before=normalizeSettings(current?.data).permissions.roles;const changed=Object.keys(settings.permissions.roles).filter(role=>role!=='SUPER_ADMIN' && JSON.stringify((before as any)[role])!==JSON.stringify((settings.permissions.roles as any)[role]));if(changed.length)await tx.refreshToken.updateMany({where:{admin:{role:{in:changed as any}}},data:{revoked:true}});}
   return {settings:normalizeSettings(result.data),version:result.updatedAt.toISOString(),sectionVersions:sectionVersions(result)};
  });
 }
 static async profile(adminId:string,data:any){
  const current=await prisma.admin.findUniqueOrThrow({where:{id:adminId}});
  if(data.email!==current.email && (!data.currentPassword || !await PasswordUtil.compare(data.currentPassword,current.passwordHash)))throw ApiError.unprocessable('Confirm your current password to change your email',[{field:'currentPassword',message:'Current password is required or incorrect'}]);
  if(await prisma.admin.findFirst({where:{email:data.email,id:{not:adminId}}}))throw ApiError.conflict('This email address is already in use');
  return serializable(async tx=>{const latest=await tx.admin.findUniqueOrThrow({where:{id:adminId}});if(latest.passwordHash!==current.passwordHash)throw ApiError.conflict('Your account changed. Please retry.');return tx.admin.update({where:{id:adminId},data:{name:data.name,email:data.email,phone:data.phone || null,avatarUrl:data.avatarUrl || null},select:safeAdminSelect});});
 }
 static async changePassword(adminId:string,sid:string,data:any){
  const admin=await prisma.admin.findUniqueOrThrow({where:{id:adminId}});
  if(!await PasswordUtil.compare(data.currentPassword,admin.passwordHash))throw ApiError.unprocessable('Current password is incorrect',[{field:'currentPassword',message:'Current password is incorrect'}]);
  const passwordHash=await PasswordUtil.hash(data.newPassword);
  await serializable(async tx=>{const latest=await tx.admin.findUniqueOrThrow({where:{id:adminId}});if(latest.passwordHash!==admin.passwordHash)throw ApiError.conflict('Your password changed. Please retry.');await tx.admin.update({where:{id:adminId},data:{passwordHash}});await tx.refreshToken.updateMany({where:{adminId,id:{not:sid}},data:{revoked:true}});});return {changed:true};
 }
 static async security(adminId:string,sid:string){const [sessions,history]=await Promise.all([
  prisma.refreshToken.findMany({where:{adminId,revoked:false,expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'},take:100,select:{id:true,userAgent:true,createdAt:true,loginAt:true,lastActiveAt:true}}),
  prisma.activityLog.findMany({where:{adminId,action:{in:['LOGIN_SUCCESS','LOGIN_FAILURE']}},orderBy:{createdAt:'desc'},take:30,select:{id:true,createdAt:true,action:true,metadata:true}}),
 ]);return {twoFactorSupported:false,sessions:sessions.map(s=>({id:s.id,...clientDevice(s.userAgent),loginAt:s.loginAt || s.createdAt,lastActiveAt:s.lastActiveAt || s.createdAt,current:s.id===sid,location:null})),history:history.map(h=>({id:h.id,date:h.createdAt,status:h.action==='LOGIN_SUCCESS'?'Successful':'Failed',device:(h.metadata as any)?.device || 'Unknown device',browser:(h.metadata as any)?.browser || 'Unknown browser'}))};}
 static async revokeSessions(adminId:string,sid:string,id?:string){if(id===sid)throw ApiError.badRequest('Use Logout to end your current session');if(id && !await prisma.refreshToken.findFirst({where:{id,adminId,revoked:false}}))throw ApiError.notFound('Session not found');await prisma.refreshToken.updateMany({where:{adminId,revoked:false,id:id || {not:sid}},data:{revoked:true}});return {revoked:true};}
 static async zones(){const [{settings},rows]=await Promise.all([this.get(),prisma.deliveryZone.findMany({orderBy:{name:'asc'}})]);const record=await prisma.websiteContent.findUnique({where:{slug}});const rules=(record?.data as any)?.zoneRules || {};return rows.map(row=>({...row,country:rules[row.id]?.country || settings.shipping.defaultCountry,freeDeliveryThreshold:rules[row.id]?.freeDeliveryThreshold ?? null}));}
 static async saveZone(id:string|undefined,data:any){return serializable(async tx=>{const {country,freeDeliveryThreshold,...fields}=data;const row=id?await tx.deliveryZone.update({where:{id},data:fields}):await tx.deliveryZone.create({data:fields});const record=await tx.websiteContent.findUnique({where:{slug}});const settings:any=record?.data || {};const next={...settings,_versions:sectionVersions(record),zoneRules:{...(settings.zoneRules || {}),[row.id]:{country,freeDeliveryThreshold}}};await tx.websiteContent.upsert({where:{slug},create:{slug,title:'Store settings',data:next},update:{data:next}});return {...row,country,freeDeliveryThreshold};});}
 static async removeZone(id:string){await serializable(async tx=>{await tx.deliveryZone.delete({where:{id}});const record=await tx.websiteContent.findUnique({where:{slug}});if(record){const next:any=record.data;const zoneRules={...(next.zoneRules || {})};delete zoneRules[id];await tx.websiteContent.update({where:{slug},data:{data:{...next,_versions:sectionVersions(record),zoneRules}}});}});return {deleted:true};}
 static async zoneRules(database:Pick<typeof prisma,'websiteContent'>=prisma){const record=await database.websiteContent.findUnique({where:{slug}});return (record?.data as any)?.zoneRules || {};}
 static async policies(){const rows=await prisma.websiteContent.findMany({where:{slug:{in:Object.keys(POLICY_TITLES).map(id=>`policy-${id}`)}}});return Object.entries(POLICY_TITLES).map(([id,title])=>{const row=rows.find(r=>r.slug===`policy-${id}`);const raw:any=row?.data || {};const draft=raw.draft || {title,content:''};return {id,...draft,status:raw.published && draft.title===raw.published.title && draft.content===raw.published.content?'PUBLISHED':'DRAFT',hasPublished:Boolean(raw.published),lastUpdated:row?.updatedAt || null,publishedAt:raw.published?.updatedAt || null};});}
 static async savePolicy(id:string,data:any){if(!POLICY_TITLES[id])throw ApiError.notFound('Policy not found');return serializable(async tx=>{const key=`policy-${id}`,record=await tx.websiteContent.findUnique({where:{slug:key}}),raw:any=record?.data || {};if(data.version!==undefined && data.version!==(record?.updatedAt.toISOString() || null))throw ApiError.conflict('This policy changed in another session. Reload before saving.');const draft={title:data.title,content:cleanPolicy(data.content),updatedAt:new Date().toISOString()};if(data.status==='PUBLISHED' && !draft.content.replace(/<[^>]*>/g,'').trim())throw ApiError.unprocessable('Add policy content before publishing');const next={...raw,draft,...(data.status==='PUBLISHED'?{published:draft}:{})};const row=await tx.websiteContent.upsert({where:{slug:key},create:{slug:key,title:data.title,data:next},update:{title:data.title,data:next}});return {id,...draft,status:data.status,hasPublished:Boolean(next.published),lastUpdated:row.updatedAt,publishedAt:next.published?.updatedAt || null};});}
 static async publishedPolicy(id:string){if(!POLICY_TITLES[id])throw ApiError.notFound('Policy not found');const row=await prisma.websiteContent.findUnique({where:{slug:`policy-${id}`}});const data=(row?.data as any)?.published;if(!data)throw ApiError.notFound('This policy has not been published');return {title:data.title,content:cleanPolicy(data.content),lastUpdated:data.updatedAt};}
 static async staff(){return prisma.admin.findMany({where:{deletedAt:null},orderBy:{createdAt:'desc'},select:{...safeAdminSelect,refreshTokens:{where:{revoked:false},orderBy:{lastActiveAt:'desc'},take:1,select:{lastActiveAt:true}}}}).then(rows=>rows.map(({refreshTokens,...admin})=>({...admin,lastActiveAt:refreshTokens[0]?.lastActiveAt || admin.lastLoginAt})));}
 static async saveStaff(actorId:string,actorRole:string,id:string|undefined,data:any){
  const permissions=await this.permissions(actorRole);const wanted=await this.permissions(data.role);
  if(actorRole!=='SUPER_ADMIN' && (data.role==='SUPER_ADMIN' || wanted.some(p=>!permissions.includes(p))))throw ApiError.forbidden('You cannot grant permissions you do not have');
  const passwordHash=data.password?await PasswordUtil.hash(data.password):undefined;
  if(!id && !passwordHash)throw ApiError.unprocessable('Set an initial password for the staff member');
  return serializable(async tx=>{if(id){const target=await tx.admin.findUniqueOrThrow({where:{id}});if(target.deletedAt)throw ApiError.notFound('Staff member not found');if(id===actorId && data.email!==target.email)throw ApiError.forbidden('Change your email in Account & Profile');if(id===actorId && passwordHash)throw ApiError.forbidden('Change your own password in Account & Profile');if(actorRole!=='SUPER_ADMIN' && target.role==='SUPER_ADMIN')throw ApiError.forbidden('Only a Super Administrator can manage this account');if(id===actorId && (!data.isActive || data.role!==target.role))throw ApiError.conflict('You cannot disable or change the role of your current account');if(target.role==='SUPER_ADMIN' && target.isActive && (data.role!=='SUPER_ADMIN' || !data.isActive) && await tx.admin.count({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}})<=1)throw ApiError.conflict('Keep at least one active Super Administrator');}
   const fields={name:data.name,email:data.email,role:data.role,isActive:data.isActive,...(passwordHash?{passwordHash}:{})};
   const row=id?await tx.admin.update({where:{id},data:fields,select:safeAdminSelect}):await tx.admin.create({data:{...fields,passwordHash:passwordHash!},select:safeAdminSelect});if(id && id!==actorId)await tx.refreshToken.updateMany({where:{adminId:id},data:{revoked:true}});return row;});
 }
 static async removeStaff(actorId:string,actorRole:string,id:string){if(id===actorId)throw ApiError.conflict('You cannot delete your current account');return serializable(async tx=>{const row=await tx.admin.findUniqueOrThrow({where:{id}});if(actorRole!=='SUPER_ADMIN' && row.role==='SUPER_ADMIN')throw ApiError.forbidden('Only a Super Administrator can manage this account');if(row.role==='SUPER_ADMIN' && row.isActive && await tx.admin.count({where:{role:'SUPER_ADMIN',isActive:true,deletedAt:null}})<=1)throw ApiError.conflict('Keep at least one active Super Administrator');await tx.admin.update({where:{id},data:{isActive:false,deletedAt:new Date()}});await tx.refreshToken.updateMany({where:{adminId:id},data:{revoked:true}});return {deleted:true};});}
}
