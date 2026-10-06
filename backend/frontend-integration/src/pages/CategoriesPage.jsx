import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
export default function CategoriesPage() {
 const [categories,setCategories] = useState([]); const [loading,setLoading] = useState(true); const [error,setError] = useState('');
 useEffect(() => { api('/categories').then(setCategories).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
 return <section className="container-custom section-padding"><h1 className="font-serif text-3xl mb-8">Categories</h1>{error && <p role="alert">{error}</p>}{loading ? <p>Loading categories?</p> : !error && !categories.length ? <p>No categories have been published yet.</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{categories.map(category => <Link key={category.id} to={`/shop?category=${encodeURIComponent(category.slug)}`} className="bg-brand-cream p-5">{category.imageUrl && <img className="w-full aspect-[4/3] object-cover mb-4" src={category.imageUrl} alt={category.name} />}<h2 className="font-serif text-xl">{category.name}</h2><p>{category.description}</p><span className="underline block mt-4">View products</span></Link>)}</div>}</section>;
}
