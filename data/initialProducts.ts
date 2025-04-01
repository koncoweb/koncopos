import { Product } from "../components/InventoryManagement";

const initialProducts: Product[] = [
  {
    id: "1",
    name: "T-Shirt (Black)",
    sku: "TS-BLK-001",
    description:
      "Premium cotton black t-shirt, unisex design, available in multiple sizes.",
    price: 19.99,
    cost: 8.5,
    currentStock: 45,
    category: "Apparel",
    location: "Warehouse A",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
  },
  {
    id: "2",
    name: "Jeans (Blue)",
    sku: "JN-BLU-002",
    description:
      "Classic blue denim jeans with straight cut and comfortable fit.",
    price: 39.99,
    cost: 18.75,
    currentStock: 28,
    category: "Apparel",
    location: "Warehouse A",
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
  },
  {
    id: "3",
    name: "Sneakers (White)",
    sku: "SN-WHT-003",
    description:
      "Lightweight athletic sneakers with cushioned insole and durable outsole.",
    price: 59.99,
    cost: 27.5,
    currentStock: 15,
    category: "Footwear",
    location: "Warehouse B",
    imageUrl:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
  },
  {
    id: "4",
    name: "Backpack",
    sku: "BP-BLK-004",
    description:
      "Durable backpack with multiple compartments and padded laptop sleeve.",
    price: 49.99,
    cost: 22.25,
    currentStock: 32,
    category: "Accessories",
    location: "Warehouse C",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  },
  {
    id: "5",
    name: "Water Bottle",
    sku: "WB-BLU-005",
    description:
      "Insulated stainless steel water bottle that keeps drinks cold for 24 hours.",
    price: 14.99,
    cost: 6.75,
    currentStock: 67,
    category: "Accessories",
    location: "Warehouse C",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80",
  },
];

export default initialProducts;
