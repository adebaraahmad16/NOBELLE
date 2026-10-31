export function effectivePrice(product,priceDiff=0,now=Date.now()){
 const base=Number(product.price)+Number(priceDiff);
 const discounts=(product.discounts||[]).filter(d=>d.isActive&&(!d.startsAt||Date.parse(d.startsAt)<=now)&&(!d.expiresAt||Date.parse(d.expiresAt)>now));
 const saving=Math.max(0,...discounts.map(d=>d.discountType==='PERCENTAGE'?Math.round(base*Number(d.value))/100:Number(d.value)));
 return Math.max(0,base-saving);
}
