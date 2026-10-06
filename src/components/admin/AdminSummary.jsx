import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatNaira } from '../../utils/currency';
export default function AdminSummary({ section }) {
 const [metrics,setMetrics]=useState([]);const [error,setError]=useState('');
 useEffect(()=>{let active=true;const load=()=>api(`/admin/summary/${section}`,{role:'admin'}).then(result=>{if(active){setMetrics(result);setError('');}}).catch(e=>{if(active)setError(e.message);});load();window.addEventListener('nobelle-data-changed',load);return()=>{active=false;window.removeEventListener('nobelle-data-changed',load);};},[section]);
 if(error)return <p role="alert" className="nb-error">Unable to load summary: {error}</p>;
 return <div className="nb-resource-summary">{metrics.map(metric=><div className="nb-card" key={metric.label}><p className="nb-stat-caption">{metric.label}</p><strong className="nb-stat-value">{metric.currency?formatNaira(Number(metric.value)):metric.value}</strong><small className="nb-stat-caption">{metric.label==='New in 30 Days'?'Last 30 days':'Store total'}</small></div>)}</div>;
}
