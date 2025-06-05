export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  storeId: string;
  warehouseId?: string;
  category?: string;
  imageUrl?: string;
  [key: string]: any; // Allow for additional properties
}
