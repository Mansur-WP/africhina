import ProductCard from './ProductCard.jsx';

/**
 * Responsive catalogue grid (organism). 2 columns on mobile, scaling up to 4
 * on wide screens — a purpose-built responsive grid, not a shrunk desktop
 * layout.
 *
 * @param {{ products: object[] }} props
 */
export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
