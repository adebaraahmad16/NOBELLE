import { useEffect, useState } from 'react';
import { api } from '../api/client';
export default function AboutPage() {
 const [content,setContent] = useState(null); const [error,setError] = useState('');
 useEffect(() => { api('/content/about').then(value => setContent(value || {})).catch(e => setError(e.message)); }, []);
 return <section className="container-custom section-padding"><h1 className="font-serif text-3xl mb-6">{content?.title || 'About NOBELLE'}</h1>{error && <p role="alert">{error}</p>}{!content && !error ? <p>Loading?</p> : <p className="whitespace-pre-wrap max-w-3xl">{content?.content || 'NOBELLE celebrates modern Nigerian women?s fashion.'}</p>}</section>;
}
