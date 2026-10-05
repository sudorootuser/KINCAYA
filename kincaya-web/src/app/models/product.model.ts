export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock?: number;
  images: string[];
  description: string;
  featured?: boolean;
  discountPercent?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
