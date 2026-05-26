export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  images: string[];
  description: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
