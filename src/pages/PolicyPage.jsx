import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { api } from '../api/client';
export default function PolicyPage({id}) {
 const [policy,setPolicy]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let live=true;api(`/policies/${id}`).then(value=>{if(live)setPolicy(value);}).catch(e=>{if(live)setError(e.status===404?'This policy has not been published yet. Please contact NOBELLE for assistance.':e.message);});return()=>{live=false;};},[id]);
 return <article className="container-custom section-padding max-w-4xl"><h1 className="font-serif text-3xl mb-6">{policy?.title||{privacy:'Privacy Policy',terms:'Terms & Conditions',returns:'Return & Refund Policy',shipping:'Shipping Policy',sizes:'Size Guide'}[id]}</h1>{error?<p role="alert">{error}</p>:!policy?<p role="status">Loading policy...</p>:<><p className="text-sm text-gray-500 mb-8">Last updated: {new Date(policy.lastUpdated).toLocaleDateString()}</p><div className="leading-8 [&_h2]:text-2xl [&_h2]:my-6 [&_h3]:text-xl [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_a]:underline" dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(policy.content)}}/></>}</article>;
}
