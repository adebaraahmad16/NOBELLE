import { Link } from 'react-router-dom';
import { formatNaira } from '../../utils/currency';
export default function ProductCard({ product }) {
  return <article className="product-card"><Link to={`/product/${product.slug || product.id}`} className="block group">
    <div className="product-card-image bg-brand-beige">{product.image ? <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.image} alt={product.name} loading="lazy" /> : <div className="h-full flex items-center justify-center">Image unavailable</div>}</div>
    <h3 className="font-serif mt-4">{product.name}</h3><p>{formatNaira(product.price)}</p><p className="text-sm text-brand-gray">{product.stock > 0 ? 'Choose size and colour' : 'Sold out'}</p>
  </Link></article>;
}
