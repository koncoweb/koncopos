import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { Search, Plus, ArrowLeft } from "lucide-react-native";
import ProductList from "./ProductList";
import ProductDetail from "./ProductDetail";
import { useInventoryData } from "../hooks/useInventoryData";
import { useAuth } from '../contexts/AuthContext';
import { canAccessStore, canAccessWarehouse } from '../utils/permissions';

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

export interface ProductVariation {
  id: string;
  type: string; // e.g., 'size', 'flavor', 'color'
  value: string; // e.g., '1kg', 'strawberry', 'red'
  sku: string;
  price: number;
  cost: number;
  warehouseStocks: WarehouseStock[];
}

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
  warehouseStocks?: WarehouseStock[];
  variations?: ProductVariation[];
  hasVariations?: boolean;
  storeId?: string;
  warehouseId?: string;
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
  const { width } = useWindowDimensions();

  // Determine if we're on a desktop-sized screen (greater than 768px)
  const isDesktop = width > 768;

  // Use the custom hook to manage inventory data
  const { products: allProducts, isLoading, saveProduct, deleteProduct, createNewProduct } =
    useInventoryData(initialProducts);

  // Permission-based filtering
  const { user } = useAuth();
  const products = user?.role === 'owner'
    ? allProducts
    : allProducts.filter(
        (p) =>
          (p.storeId && canAccessStore(user, p.storeId)) ||
          (p.warehouseId && canAccessWarehouse(user, p.warehouseId))
      );

  const handleProductSelect = (product: any) => {
    // Find the full product data from the products array to ensure we have all fields
    const fullProduct = products.find((p) => p.id === product.id);
    if (fullProduct) {
      console.log(
        `InventoryManagement: Selected product ${fullProduct.id} with ${fullProduct.warehouseStocks?.length || 0} warehouse stocks`,
      );
      setSelectedProduct(fullProduct);
    } else {
      console.log(
        `InventoryManagement: Selected product ${product.id} not found in products array, using partial data`,
      );
      setSelectedProduct(product);
    }
    setIsDetailView(true);
  };

  const handleBackToList = () => {
    setIsDetailView(false);
    setSelectedProduct(null);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    // Permission guard
    if (
      user?.role !== 'owner' &&
      !(
        (updatedProduct.storeId && canAccessStore(user, updatedProduct.storeId)) ||
        (updatedProduct.warehouseId && canAccessWarehouse(user, updatedProduct.warehouseId))
      )
    ) {
      Alert.alert('Access Denied', 'You do not have permission to save this product.');
      return;
    }
    // Ensure product has a valid ID before saving
    if (!updatedProduct.id || updatedProduct.id === "undefined") {
      updatedProduct.id = `${Date.now()}`;
      console.log(
        `Generated new product ID: ${updatedProduct.id} before saving`,
      );
    }

    // Create a deep copy to prevent reference issues
    const productToSave = JSON.parse(JSON.stringify(updatedProduct));

    // Log the product being saved to verify warehouse stocks are included
    console.log(
      `InventoryManagement: Saving product with ID ${productToSave.id}:`,
      JSON.stringify({
        id: productToSave.id,
        name: productToSave.name,
        warehouseStocksCount: productToSave.warehouseStocks?.length || 0,
        warehouseStocks: productToSave.warehouseStocks,
      }),
    );

    // Ensure warehouseStocks is properly initialized if missing
    if (!productToSave.warehouseStocks) {
      console.log(
        "InventoryManagement: warehouseStocks is missing, initializing empty array",
      );
      productToSave.warehouseStocks = [];
    }

    const savedProduct = saveProduct(productToSave);

    // Update the selected product with the saved product to maintain state
    if (savedProduct && savedProduct.id) {
      setSelectedProduct(savedProduct);
    } else {
      console.log(
        "InventoryManagement: Warning - savedProduct is invalid, keeping current selection",
      );
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (
      user?.role !== 'owner' &&
      product &&
      !(
        (product.storeId && canAccessStore(user, product.storeId)) ||
        (product.warehouseId && canAccessWarehouse(user, product.warehouseId))
      )
    ) {
      Alert.alert('Access Denied', 'You do not have permission to delete this product.');
      return;
    }
    deleteProduct(productId);
    setSelectedProduct(null);
    setIsDetailView(false);
  };

  const handleAddNewProduct = async () => {
    const newProduct = await createNewProduct();
    // Ensure new product has warehouseStocks initialized
    if (!newProduct.warehouseStocks) {
      newProduct.warehouseStocks = [];
      console.log(
        "InventoryManagement: Initialized empty warehouseStocks for new product",
      );
    }
    console.log(
      `InventoryManagement: Created new product with ID ${newProduct.id}`,
      JSON.stringify({
        id: newProduct.id,
        name: newProduct.name,
        warehouseStocks: newProduct.warehouseStocks,
      }),
    );
    setSelectedProduct(newProduct);
    setIsDetailView(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!isDetailView || (isDesktop && selectedProduct) ? (
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

          {/* Desktop and Mobile Layout */}
          <View
            className={
              isDesktop && selectedProduct ? "flex-row flex-1" : "flex-1"
            }
          >
            {/* Product List */}
            <View className={isDesktop && selectedProduct ? "w-1/3" : "flex-1"}>
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
            </View>

            {/* Product Detail (only shown on desktop when a product is selected) */}
            {isDesktop && selectedProduct && (
              <View className="w-2/3 border-l border-gray-200">
                <ProductDetail
                  product={selectedProduct as any}
                  onSave={handleSaveProduct}
                  onDelete={handleDeleteProduct}
                  onBack={handleBackToList}
                />
              </View>
            )}
          </View>
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
