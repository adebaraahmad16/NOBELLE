import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { affectsTables } from '../lib/supabase-sync.js';
import { DEMO_CATEGORIES, DEMO_COLLECTIONS } from '../data/demoData';

const Context = createContext();

export function AdminDataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [cms, setCms] = useState({ homepage: {} });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const reload = () => Promise.all([
      api('/categories'),
      api('/collections'),
      api('/content/homepage')
    ]).then(([cats, cols, content]) => {
      if (active) {
        setCategories(Array.isArray(cats) && cats.length > 0 ? cats : DEMO_CATEGORIES);
        setCollections(Array.isArray(cols) && cols.length > 0 ? cols : DEMO_COLLECTIONS);
        setCms({ homepage: content || {} });
        setError('');
      }
    }).catch(e => {
      if (active) setError(e.message);
    });

    const changed = e => {
      if (affectsTables(e, [
        'product_categories',
        'product_collections',
        'website_settings',
        'homepage_sections',
        'banners'
      ])) {
        reload();
      }
    };

    reload();
    window.addEventListener('nobelle-data-changed', changed);
    window.addEventListener('focus', reload);
    return () => {
      active = false;
      window.removeEventListener('nobelle-data-changed', changed);
      window.removeEventListener('focus', reload);
    };
  }, []);

  return (
    <Context.Provider value={{
      categories,
      collections,
      cms,
      error,
      addSubscriber: email => api('/newsletter', { method: 'POST', body: { email } })
    }}>
      {children}
    </Context.Provider>
  );
}

export const useAdminData = () => useContext(Context);
