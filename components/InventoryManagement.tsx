import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { Search, Plus, ArrowLeft } from "lucide-react-native";
import ProductList from "./ProductList";
import ProductDetail from "./ProductDetail";
import { storeData, getData, STORAGE_KEYS } from "../services/storage";

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  currentStock: number;
  category: string;
  location: string;
  imageUrl: string;
}

interface InventoryManagementProps {
  onBack?: () => void;
}

// Empty initial products array - data will be loaded from storage
const initialProducts: Product[] = [];

const InventoryManagement = ({
  onBack = () => {},
}: InventoryManagementProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products from storage on component mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const storedProducts = await getData<Product[]>(
          STORAGE_KEYS.PRODUCTS,
          initialProducts,
        );
        console.log(`Loaded ${storedProducts.length} products from storage`);
        setProducts(storedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts(initialProducts);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Save products to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      storeData(STORAGE_KEYS.PRODUCTS, products);
    }
  }, [products, isLoading]);

  const handleProductSelect = (product: any) => {
    // Find the full product data from the products array to ensure we have all fields
    const fullProduct = products.find((p) => p.id === product.id);
    if (fullProduct) {
      setSelectedProduct(fullProduct);
    } else {
      setSelectedProduct(product);
    }
    setIsDetailView(true);
  };

  const handleBackToList = () => {
    setIsDetailView(false);
    setSelectedProduct(null);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    // Ensure numeric values are valid numbers
    const validatedProduct = {
      ...updatedProduct,
      price: isNaN(Number(updatedProduct.price))
        ? 0
        : Number(updatedProduct.price),
      cost: isNaN(Number(updatedProduct.cost))
        ? 0
        : Number(updatedProduct.cost),
      currentStock: isNaN(Number(updatedProduct.currentStock))
        ? 0
        : Number(updatedProduct.currentStock),
    };

    // Check if this is a new product (not in the products array yet)
    const isNewProduct = !products.some((p) => p.id === validatedProduct.id);

    if (isNewProduct) {
      // Add the new product to the products array
      const newProducts = [...products, validatedProduct];
      setProducts(newProducts);
      console.log("New product added:", validatedProduct.name);
    } else {
      // Update existing product
      const updatedProducts = products.map((p) =>
        p.id === validatedProduct.id ? validatedProduct : p,
      );
      setProducts(updatedProducts);
    }

    setSelectedProduct(validatedProduct);
  };

  const handleDeleteProduct = (productId: string) => {
    const filteredProducts = products.filter((p) => p.id !== productId);
    setProducts(filteredProducts);
    setIsDetailView(false);
    setSelectedProduct(null);
  };

  const handleAddNewProduct = () => {
    const newProduct = {
      id: `${Date.now()}`,
      name: "New Product",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      description: "Product description",
      price: 0,
      cost: 0,
      currentStock: 0,
      category: "Uncategorized",
      location: "Warehouse A",
      imageUrl: "",
    };

    setSelectedProduct(newProduct);
    setIsDetailView(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!isDetailView ? (
        <>
          {/* Header */}
          <View className="bg-blue-500 p-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={onBack} className="p-2">
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">
                Inventory Management
              </Text>
              <TouchableOpacity
                onPress={handleAddNewProduct}
                className="bg-white p-2 rounded-full"
              >
                <Plus size={24} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Inventory Stats */}
          <View className="flex-row justify-between p-4 bg-gray-50">
            <View className="bg-white p-3 rounded-lg shadow-sm flex-1 mr-2">
              <Text className="text-gray-500 text-xs">Total Products</Text>
              <Text className="text-xl font-bold">{products.length}</Text>
            </View>
            <View className="bg-white p-3 rounded-lg shadow-sm flex-1 mr-2">
              <Text className="text-gray-500 text-xs">Low Stock</Text>
              <Text className="text-xl font-bold text-yellow-500">
                {products.filter((p) => p.currentStock <= 15).length}
              </Text>
            </View>
            <View className="bg-white p-3 rounded-lg shadow-sm flex-1">
              <Text className="text-gray-500 text-xs">Out of Stock</Text>
              <Text className="text-xl font-bold text-red-500">
                {products.filter((p) => p.currentStock === 0).length}
              </Text>
            </View>
          </View>

          {/* Product List */}
          <ProductList
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              stock: p.currentStock,
              category: p.category,
              location: p.location,
            }))}
            onProductSelect={handleProductSelect}
            searchEnabled={true}
            filterEnabled={true}
          />
        </>
      ) : (
        <ProductDetail
          product={selectedProduct as any}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          onBack={handleBackToList}
        />
      )}
    </SafeAreaView>
  );
};

export default InventoryManagement;
