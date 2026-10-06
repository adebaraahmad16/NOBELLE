import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
const Context = createContext();
export function AdminDataProvider({ children }) {
  const [categories, setCategories] = useState([]); const [collections, setCollections] = useState([]); const [cms, setCms] = useState({ homepage: {} });
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const reload = () => Promise.all([api('/categories'), api('/collections'), api('/content/homepage')]).then(([cats,cols,content]) => {
      if(active) { setCategories(cats); setCollections(cols); setCms({ homepage: content || {} }); setError(''); }
    }).catch(e => { if(active) setError(e.message); });
    reload(); window.addEventListener('nobelle-data-changed',reload); window.addEventListener('focus',reload);
    return () => { active=false; window.removeEventListener('nobelle-data-changed',reload); window.removeEventListener('focus',reload); };
  }, []);
  return <Context.Provider value={{ categories, collections, cms, error, addSubscriber: email => api('/newsletter', { method: 'POST', body: { email } }) }}>{children}</Context.Provider>;
}
export const useAdminData = () => useContext(Context);
