import { useEffect,useState } from 'react';
import { api } from '../../api/client';
export default function ProductSelector({value,onChange}){
 const [query,setQuery]=useState(''),[products,setProducts]=useState([]),[selected,setSelected]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;if(value)api(`/admin/products/${value}`,{role:'admin'}).then(p=>{if(live)setSelected(p);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[value]);
 useEffect(()=>{let live=true;const timer=setTimeout(()=>{setLoading(true);api(`/admin/products?limit=20&search=${encodeURIComponent(query)}`,{role:'admin'}).then(rows=>{if(live){setProducts(rows);setError('');}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});},200);return()=>{live=false;clearTimeout(timer);};},[query]);
 const options=selected&&!products.some(p=>p.id===selected.id)?[selected,...products]:products;
 return <span className="block"><input aria-label="Search products for this discount" className="input-field my-2" placeholder="Search products" value={query} onChange={e=>setQuery(e.target.value)}/><select className="input-field" required value={value||''} onChange={e=>onChange(e.target.value)}><option value="">{loading?'Loading products…':'Choose a product'}</option>{options.map(p=><option key={p.id} value={p.id}>{p.name}{p.isActive?'':' (unpublished)'}</option>)}</select>{error&&<span role="alert" className="text-red-700">{error}</span>}</span>;
}
