import { useStoreSettings } from '../../context/StoreSettingsContext';
import { Link } from 'react-router-dom';
import { formatNaira } from '../../utils/currency';

export default function ProductCard({ product }) {
  const { settings } = useStoreSettings();
  const isOnSale = product.comparePrice && Number(product.comparePrice) > Number(product.price);

  return (
    <article className="group bg-white border border-[#EFE5DA] p-3 sm:p-3.5 transition-all duration-300 hover:border-[#641B32]/40 hover:shadow-lg">
      <Link to={`/product/${product.slug || product.id}`} className="block">
        <div className="bg-[#FAF7F4] relative overflow-hidden aspect-[3/4]">
          {product.image ? (
            <img
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              src={product.image}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-brand-gray text-sm">Image unavailable</div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isOnSale && (
              <span className="bg-[#641B32] text-[#F8F3ED] text-[10px] uppercase tracking-wider px-2.5 py-0.5 font-medium shadow-sm">
                Sale
              </span>
            )}
            {product.isBestSeller && !isOnSale && (
              <span className="bg-[#292323] text-[#F8F3ED] text-[10px] uppercase tracking-wider px-2.5 py-0.5 font-medium shadow-sm">
                Best Seller
              </span>
            )}
            {product.isNewArrival && !isOnSale && !product.isBestSeller && (
              <span className="bg-[#C8A96A] text-[#292323] text-[10px] uppercase tracking-wider px-2.5 py-0.5 font-medium shadow-sm">
                New
              </span>
            )}
          </div>
        </div>

        <h3 className="font-serif mt-3 text-sm sm:text-base text-[#292323] group-hover:text-[#641B32] transition-colors line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mt-1">
          <p className="font-semibold text-[#641B32] text-sm sm:text-base">{formatNaira(product.price)}</p>
          {isOnSale && (
            <p className="text-xs line-through text-[#6B6B6B]">{formatNaira(product.comparePrice)}</p>
          )}
        </div>

        <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-1">
          {product.stock > 0
            ? 'Choose size and colour'
            : settings?.products?.allowOutOfStockPurchases
            ? 'Available on backorder'
            : 'Sold out'}
        </p>
      </Link>
    </article>
  );
}
