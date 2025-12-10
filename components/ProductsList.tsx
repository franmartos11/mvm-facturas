import ProductsListClient from './ProductsListClient';

interface ProductsListProps {
  items: any[];
}

export default function ProductsList({ items }: ProductsListProps) {
  return <ProductsListClient initialItems={items || []} />;
}
