import { Link } from 'react-router-dom';
import { formatNaira } from '../../utils/currency';
const pretty = value => String(value || '—').replaceAll('_',' ').toLowerCase();
export const columnsFor = section => ({
 staff:['Administrator','Email','Role','Status','Last login'],
 'stock-history':['Product','Variant','Change','Previous','New','Reason','Recorded by','Date'],
 products:['Product','Category','Collection','Price','Stock','Status'],
 orders:['Order ID','Customer','Items','Amount','Payment','Status','Date'],
 inventory:['Product','Variant','SKU','Stock','Reserved','Available','Status'],
 customers:['Customer','Email','Phone','Orders','Status'],
 payments:['Transaction','Order','Customer','Amount','Method','Reference','Status','Date'],
 reviews:['Product','Customer','Rating','Review','Date','Status'],
 notifications:['Notification','Message','Date','Status'],
 coupons:['Coupon','Discount','Minimum order','Usage','Expires','Status'],
}[section] || ['Record','Details','Date']);
const name = customer => [customer?.firstName,customer?.lastName].filter(Boolean).join(' ') || customer?.email || '—';
const date = value => value ? new Date(value).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
const badge = (value,cls='') => <span className={`nb-badge ${cls}`}>{pretty(value)}</span>;
export function RecordCells({ section, item }) {
 let cells;
 if(section==='staff')cells=[item.name,item.email,pretty(item.role),badge(item.isActive?'Active':'Disabled'),date(item.lastLoginAt)];
 else if(section==='stock-history')cells=[item.inventory?.variant?.product?.name,`${item.inventory?.variant?.color} / ${item.inventory?.variant?.size}`,`${item.delta>0?'+':''}${item.delta}`,item.previousQty,item.newQty,item.reason,item.recordedByName,date(item.createdAt)];
 else if(section==='products')cells=[<div className="nb-table-product">{item.images?.[0]?.url && <img src={item.images[0].url} alt={item.name}/>}<Link to={`/admin/products/edit/${item.id}`}><strong>{item.name}</strong><small>{item.sku}</small></Link></div>,item.category?.name || '—',item.collection?.name || '—',formatNaira(Number(item.price)),item.variants?.reduce((n,v)=>n+Math.max(0,(v.inventory?.quantity || 0)-(v.inventory?.reserved || 0)),0) ?? '—',badge(item.isActive?'Active':'Draft')];
 else if(section==='orders')cells=[<strong>{item.orderNumber}</strong>,name(item.customer),item.items?.reduce((n,i)=>n+i.quantity,0) ?? '—',formatNaira(Number(item.totalAmount)),badge(item.payments?.find(p=>p.status==='SUCCESS')?'Paid':item.payments?.[0]?.status || 'Pending',item.payments?.some(p=>p.status==='SUCCESS')?'paid':''),badge(item.status,pretty(item.status)),date(item.createdAt)];
 else if(section==='inventory')cells=[item.variant?.product?.name,`${item.variant?.color} / ${item.variant?.size}`,item.variant?.sku,item.quantity,item.reserved,Math.max(0,item.quantity-item.reserved),badge(item.quantity-item.reserved<=0?'Out of stock':item.quantity-item.reserved<=5?'Low stock':'In stock')];
 else if(section==='customers')cells=[name(item),item.email,item.phone || '—',item._count?.orders ?? 0,badge(item.isActive?'Active':'Disabled')];
 else if(section==='payments')cells=[item.id,item.order?.orderNumber,name(item.order?.customer),formatNaira(Number(item.amount)),item.channel || item.provider || 'Paystack',item.reference,badge(item.status),date(item.createdAt)];
 else if(section==='reviews')cells=[item.product?.name,name(item.customer),`${item.rating} / 5`,item.comment,date(item.createdAt),badge(item.isApproved?'Approved':'Hidden')];
 else if(section==='notifications')cells=[item.title,item.message,date(item.createdAt),badge(item.isRead?'Read':'Unread')];
 else if(section==='coupons')cells=[<strong>{item.code}</strong>,item.discountType==='PERCENTAGE'?`${item.value}% off`:formatNaira(Number(item.value)),formatNaira(Number(item.minSpend || 0)),`${item.usedCount ?? item.usageCount ?? 0} / ${item.usageLimit || 'Unlimited'}`,date(item.expiresAt),badge(item.isActive?'Active':'Paused')];
 else cells=[item.name || item.title || item.subject || item.order?.orderNumber || item.id,item.description || item.message || pretty(item.status),date(item.createdAt)];
 return cells.map((cell,i)=><td className="p-4" key={i}>{cell ?? '—'}</td>);
}
