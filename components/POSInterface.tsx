import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import {
  Search,
  ArrowLeft,
  Barcode,
  ShoppingCart as CartIcon,
} from "lucide-react-native";
import ShoppingCart from "./ShoppingCart";
import PaymentProcessor from "./PaymentProcessor";
import ProductGrid from "./ProductGrid";
import MobileShoppingCart from "./MobileShoppingCart";
import { getData, storeData, STORAGE_KEYS } from "../services/storage";

type Product = {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  category: string;
  image?: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
};

interface POSInterfaceProps {
  onBack?: () => void;
}

const POSInterface = ({ onBack = () => {} }: POSInterfaceProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showMobileCart, setShowMobileCart] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products from storage
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const storedProducts = await getData(STORAGE_KEYS.PRODUCTS, []);
        console.log(
          `Loaded ${storedProducts.length} products from storage for POS`,
        );

        // Map inventory products to POS product format
        const formattedProducts = storedProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          sku: product.sku,
          stock: product.currentStock,
          category: product.category,
          image: product.imageUrl,
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Error loading products for POS:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Extract unique categories from products
  const allCategories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];
  const categories = allCategories.filter(Boolean); // Remove any empty categories

  const filteredProducts = products.filter(
    (product) =>
      (activeCategory === "All" || product.category === activeCategory) &&
      (searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            sku: product.sku,
          },
        ];
      }
    });
  };

  const updateCartItemQuantity = (id: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeCartItem = (id: string) => {
    console.log(`Removing item with id: ${id}`);
    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id);
      console.log("Updated cart items:", updatedItems);
      return updatedItems;
    });
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setShowPayment(true);
    }
  };

  const handlePaymentComplete = (
    paymentMethod: string,
    transactionId: string,
  ) => {
    // In a real app, you would process the transaction and update inventory
    console.log(
      `Payment completed with ${paymentMethod}, transaction ID: ${transactionId}`,
    );

    // Reset cart and return to product selection
    setTimeout(() => {
      setCartItems([]);
      setShowPayment(false);
    }, 3000);
  };

  const calculateCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  if (showPayment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <PaymentProcessor
          cartTotal={calculateCartTotal()}
          cartItems={cartItems}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setShowPayment(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={onBack} className="mr-3">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Point of Sale</Text>

          {isMobile && (
            <TouchableOpacity
              onPress={() => setShowMobileCart(true)}
              className="ml-auto flex-row items-center bg-blue-600 px-3 py-2 rounded-lg"
            >
              <CartIcon size={20} color="white" />
              <Text className="text-white font-medium ml-1">
                {cartItems.length}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search and Scan */}
        <View className="flex-row mb-4">
          <View className="flex-1 flex-row items-center bg-white rounded-lg px-3 mr-2 border border-gray-200">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-2 px-2"
              placeholder="Search products by name or SKU"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity className="bg-blue-600 p-3 rounded-lg">
            <Barcode size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View className="mb-4">
          <ScrollView
            horizontal={isMobile}
            showsHorizontalScrollIndicator={false}
            className="-mx-1"
          >
            <View className={`flex-row ${isMobile ? "" : "flex-wrap"}`}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  className={`m-1 px-4 py-3 rounded-lg items-center justify-center ${isMobile ? "w-[100px]" : "w-[80px] h-[80px]"} ${activeCategory === category ? "bg-blue-600" : "bg-white border border-gray-200"}`}
                >
                  <Text
                    className={`${activeCategory === category ? "text-white" : "text-gray-700"} text-center font-medium`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className={`flex-1 ${isMobile ? "" : "flex-row"}`}>
          {/* Product Grid */}
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="mt-4 text-gray-600">Loading products...</Text>
            </View>
          ) : products.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-600 text-center">
                No products found. Add products in the Inventory section.
              </Text>
            </View>
          ) : (
            <ProductGrid
              products={filteredProducts}
              isMobile={isMobile}
              onAddToCart={addToCart}
            />
          )}

          {/* Shopping Cart - Only show on desktop */}
          {!isMobile && (
            <View className="w-2/5">
              <ShoppingCart
                items={cartItems}
                onUpdateQuantity={updateCartItemQuantity}
                onRemoveItem={removeCartItem}
                onCheckout={handleCheckout}
              />
            </View>
          )}
        </View>

        {/* Mobile Cart Modal */}
        <MobileShoppingCart
          visible={isMobile && showMobileCart}
          cartItems={cartItems}
          onUpdateQuantity={updateCartItemQuantity}
          onRemoveItem={removeCartItem}
          onCheckout={handleCheckout}
          onClose={() => setShowMobileCart(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default POSInterface;
