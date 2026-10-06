import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Warehouse, Users, CreditCard, TicketPercent, Globe, BarChart3, Star, Bell, Settings, LogOut, Menu, Search, ChevronDown, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../api/client';
import './workspace.css';

const groups = [
  ['', [['Dashboard', '', LayoutDashboard]]],
  ['Store', [
    ['Orders', 'orders', ShoppingBag, [['All Orders', 'orders'], ['Returns & Refunds', 'returns'], ['Delivery', 'delivery-zones']]],
    ['Products', 'products', Package, [['All Products', 'products'], ['Add Product', 'products/new'], ['Categories', 'categories'], ['Collections', 'collections']]],
    ['Inventory', 'inventory', Warehouse, [['Stock Overview', 'inventory'], ['Stock History', 'stock-history']]],
    ['Customers', 'customers', Users],
  ]],
  ['Finance', [['Payments', 'payments', CreditCard], ['Promotions', 'coupons', TicketPercent]]],
  ['Management', [
    ['Website', 'website', Globe, [['Homepage', 'website'], ['Homepage Sections', 'homepage-sections'], ['Banners', 'banners'], ['About', 'about'], ['Contact', 'contact-content'], ['Messages', 'messages']]],
    ['Analytics', 'reports', BarChart3],
    ['Reviews', 'reviews', Star],
    ['Notifications', 'notifications', Bell],
  ]],
  ['System', [['Admin & Staff', 'staff', Users], ['Settings', 'settings', Settings]]],
];
export default function AdminWorkspace() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation(); const navigate = useNavigate();
  const [mobile,setMobile] = useState(()=>window.innerWidth<1024); const [collapsed,setCollapsed] = useState(false); const [drawer,setDrawer] = useState(false); const [expanded,setExpanded] = useState('');
  const [notificationError,setNotificationError] = useState(''); const [unreadCount,setUnreadCount] = useState(0); const [notifications,setNotifications] = useState([]); const [bell,setBell] = useState(false); const [query,setQuery] = useState(''); const [hits,setHits] = useState([]); const [searching,setSearching] = useState(false); const [error,setError] = useState('');
  const section = location.pathname.split('/')[2] || '';
  const title = groups.flatMap(g=>g[1]).flatMap(item=>[item,...(item[3] || [])]).find(i=>i[1]===section)?.[0] || 'Administration';
  useEffect(()=>{const media=window.matchMedia('(max-width: 1023px)');const change=()=>{setMobile(media.matches);setDrawer(false);};media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  useEffect(()=>{ let active=true; const refresh=()=>api('/admin/notifications?limit=20',{role:'admin'}).then(data=>{if(active){setNotifications(data.items || []);setUnreadCount(data.unreadCount || 0);setNotificationError('');}}).catch(()=>{if(active)setNotificationError('Unable to load notifications.');}); refresh(); window.addEventListener('nobelle-data-changed',refresh); return ()=>{active=false;window.removeEventListener('nobelle-data-changed',refresh);}; },[]);
  useEffect(()=>{ if(!drawer)return; const previous=document.body.style.overflow;const focus=document.activeElement;const items=()=>Array.from(document.querySelector('.nb-sidebar').querySelectorAll('a[href],button')).filter(item=>item.getClientRects().length && !item.disabled);items()[0]?.focus();document.body.style.overflow='hidden'; const close=e=>{if(e.key==='Escape')setDrawer(false);if(e.key==='Tab'){const list=items(),first=list[0],last=list[list.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}}; document.addEventListener('keydown',close); return ()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close);if(focus?.isConnected)focus.focus();}; },[drawer]);
  useEffect(()=>{ let active=true; if(!query.trim())return; const timer=setTimeout(async()=>{setSearching(true); try {const results=await Promise.allSettled(['products','orders','customers'].map(s=>api(`/admin/${s}?limit=100&search=${encodeURIComponent(query)}`,{role:'admin'}))); if(active){setHits(results.flatMap((r,i)=>r.status==='fulfilled' && Array.isArray(r.value) ? r.value.filter(item=>[item.name,item.sku,item.orderNumber,item.firstName,item.lastName,item.email,item.customer?.firstName,item.customer?.lastName,item.customer?.email].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())).slice(0,4).map(item=>({id:item.id,label:item.name || item.orderNumber || `${item.firstName} ${item.lastName}`,section:['products','orders','customers'][i]})):[]));}} finally {if(active)setSearching(false);} },250); return ()=>{active=false;clearTimeout(timer);}; },[query]);
  const compact=collapsed && !mobile;
  const unread=unreadCount;
  const close=()=>setDrawer(false);
  return <div className={`nb-workspace ${compact?'is-collapsed':''}`}>
    {drawer && <button className="nb-drawer-overlay" aria-label="Close navigation" onClick={close}/>}
    <aside id="admin-navigation" className={`nb-sidebar ${drawer?'is-open':''}`} aria-label="Admin navigation" inert={mobile && !drawer} aria-hidden={mobile && !drawer}>
      <Link to="/admin" className="nb-brand" aria-label="NOBELLE Admin Panel" onClick={close}><span className="nb-monogram">N</span><span className="nb-sidebar-label"><strong>NOBELLE</strong><small>Admin Panel</small></span></Link>
      <button className="nb-drawer-close" aria-label="Close navigation" onClick={close}><X size={20}/></button>
      <nav>{groups.map(([label,items])=><div className="nb-nav-group" key={label}>{label && <p className="nb-group-label">{label}</p>}{items.map(([name,path,Icon,children])=><div key={name}><div className={`nb-nav-row ${section===path || children?.some(c=>c[1]===section)?'active':''}`}><Link to={`/admin/${path}`} aria-current={section===path || children?.some(child=>child[1]===section) ? 'page' : undefined} title={name} onClick={close}><Icon size={18}/><span className="nb-sidebar-label">{name}</span></Link>{children && !compact && <button aria-label={`${expanded===name?'Collapse':'Expand'} ${name}`} aria-expanded={expanded===name} onClick={()=>setExpanded(expanded===name?'':name)}><ChevronDown size={14}/></button>}</div>{children && expanded===name && !compact && <div className="nb-subnav">{children.map(([label,url])=><Link key={url} to={`/admin/${url}`} aria-current={location.pathname.replace(/\/$/,'')===`/admin/${url}`?'page':undefined} onClick={close}>{label}</Link>)}</div>}</div>)}</div>)}</nav>
      <div className="nb-sidebar-footer"><Link to="/admin/settings?tab=account" className="nb-admin-person"><span className="nb-avatar">{admin?.avatarUrl?<img src={admin.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>:(admin?.name || 'Admin')[0]}</span><span className="nb-sidebar-label"><strong>{admin?.name || 'Admin'}</strong><small>{admin?.role?.replaceAll('_',' ') || 'Administrator'}</small></span></Link><button aria-label="Logout" title="Logout" data-admin-action="logout" onClick={async()=>{try{await logout();navigate('/admin/login');}catch(e){setError(e.message);}}}><LogOut size={18}/><span className="nb-sidebar-label">Logout</span></button></div>
    </aside>
    <div className="nb-main"><header className="nb-topbar"><button className="nb-menu" aria-label="Toggle navigation" aria-controls="admin-navigation" aria-expanded={mobile?drawer:!collapsed} onClick={()=>mobile?setDrawer(!drawer):setCollapsed(!collapsed)}><Menu size={21}/></button><div className="nb-header-title"><strong>{title}</strong><Link to="/admin" className="nb-header-brand">NOBELLE</Link></div><div className="nb-global-search"><Search size={17}/><input aria-label="Search products, orders and customers" placeholder="Search..." value={query} onChange={e=>{setQuery(e.target.value);setHits([]);setSearching(Boolean(e.target.value.trim()));}}/>{query && <button aria-label="Clear search" onClick={()=>setQuery('')}><X size={14}/></button>}{query.trim() && <div className="nb-search-results">{searching?<p>Searching…</p>:hits.length?hits.map(h=><Link key={`${h.section}${h.id}`} to={h.section==='products'?`/admin/products/edit/${h.id}`:`/admin/${h.section}?search=${encodeURIComponent(h.label)}`} onClick={()=>setQuery('')}><strong>{h.label}</strong><small>{h.section}</small></Link>):<p>No matching records found.</p>}<small>Searches up to 100 records per category.</small></div>}</div><div className="nb-bell"><button aria-label={`${unread} unread notifications`} onClick={()=>setBell(!bell)}><Bell size={20}/>{unread>0 && <span className="nb-unread">{unread}</span>}</button>{bell && <div className="nb-notification-popup"><strong>Notifications</strong>{notifications.slice(0,4).map(n=><Link key={n.id} to="/admin/notifications" onClick={()=>setBell(false)}><strong>{n.title}</strong><p>{n.message}</p></Link>)}{notificationError?<p role="alert">{notificationError}</p>:!notifications.length && <p>You're all caught up.</p>}<Link to="/admin/notifications" onClick={()=>setBell(false)}>View notification centre →</Link></div>}</div><Link className="nb-top-profile" to="/admin/settings?tab=account"><span className="nb-avatar">{admin?.avatarUrl?<img src={admin.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>:(admin?.name || 'Admin')[0]}</span><span>{admin?.name || 'Admin'}</span></Link></header>
    <main className="nb-content">{error && <p role="alert" className="nb-error">{error}</p>}<Outlet/></main></div>
  </div>;
}
