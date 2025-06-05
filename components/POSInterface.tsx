import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert, 
  Platform,
  useWindowDimensions 
} from 'react-native';
import Constants from 'expo-constants';

// Import types and models
import { Product } from '../models/Product';
import { useAuth } from '../contexts/AuthContext';
import { canAccessStore } from '../utils/permissions';

// Import Lucide icons with type assertion to fix prop types
import * as LucideIcons from 'lucide-react-native';

// Create typed icon components
const Search = LucideIcons.Search as React.ComponentType<{ size: number; color: string }>;
const ArrowLeft = LucideIcons.ArrowLeft as React.ComponentType<{ size: number; color: string }>;
const Barcode = LucideIcons.Barcode as React.ComponentType<{ size: number; color: string }>;
const CartIcon = LucideIcons.ShoppingCart as React.ComponentType<{ size: number; color: string }>;

// Import components
import ShoppingCart from "./ShoppingCart";
import PaymentProcessor from "./PaymentProcessor";
import ProductGrid from "./ProductGrid";
import MobileShoppingCart from "./MobileShoppingCart";
import { getData, storeData, STORAGE_KEYS } from "../services/storage";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  storeId: string; // Add storeId to match Product type
};

interface PaymentProcessorProps {
  amount: number;
  onPaymentComplete: (method: string, id: string) => Promise<boolean>;
  onCancel: () => void;
}

interface POSInterfaceProps {
  onBack?: () => void;
  onTransactionComplete?: () => void;
  storeId?: string;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ 
  onBack = () => {}, 
  onTransactionComplete = () => {}, 
  storeId = '' 
}) => {
  // State for products and UI
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // Temporary any type, should be properly typed
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  
  // Hooks
  const { width } = useWindowDimensions();
  const auth = useAuth();
  const effectiveStoreId = storeId || '';
  
  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
    }
    setIsMobile(width < 768);
  }, [auth, width]);
  
  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);
  
  // Process payment completion
  const processPaymentComplete = useCallback(async (
    paymentMethod: string,
    transactionId: string
  ) => {
    // Process payment completion
    setShowPayment(false);
    setCartItems([]);
    onTransactionComplete();
    
    // Show success message
    Alert.alert("Success", `Payment of $${cartTotal.toFixed(2)} completed successfully!`);
    
    return true; // Indicate success
  }, [cartTotal, onTransactionComplete]);
  
  // Handle payment cancellation
  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false);
  }, []);
  

  
  // Load products from storage
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        // Use the correct getData signature with default value as second argument
        const storedProducts = (await getData(STORAGE_KEYS.PRODUCTS, [])) as Product[];

        // Map inventory products to POS product format
        const formattedProducts: Product[] = storedProducts.map((product) => ({
          ...product,
          stock: product.stock || 0, // Ensure stock is a number
          category: product.category || 'Uncategorized',
          imageUrl: product.imageUrl || '',
          // Ensure required fields have defaults
          id: product.id || '',
          name: product.name || 'Unnamed Product',
          price: product.price || 0,
          sku: product.sku || '',
          storeId: product.storeId || effectiveStoreId,
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
  const allCategories: string[] = [
    "All",
    ...Array.from(new Set(products
      .map((product: Product) => product.category)
      .filter((category): category is string => Boolean(category))
    ))
  ];
  const categories = allCategories;

  // Filter products based on search, category, and permissions
  const filteredProducts = products.filter((product: Product) => {
    try {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesSearch = searchQuery === '' || 
        (product.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (product.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const hasPermission = user?.role === 'owner' || 
        (product.storeId ? canAccessStore(user, product.storeId || '') : false);
      
      return matchesCategory && matchesSearch && hasPermission;
    } catch (error) {
      console.error('Error filtering product:', product, error);
      return false;
    }
  });
  
  // Add to cart function with proper type safety
  const addToCart = useCallback((product: Product) => {
    if (user?.role !== 'owner' && !canAccessStore(user, product.storeId || '')) {
      Alert.alert("Access Denied", "You don't have permission to add this product to cart.");
      return;
    }

    setCartItems((prevItems: CartItem[]) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          sku: product.sku || '',
          storeId: product.storeId || effectiveStoreId,
        },
      ];
    });
  }, [user, effectiveStoreId]);

  // Update product quantity in cart
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prevItems: CartItem[]) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId: string) => {
    console.log(`Removing item with id: ${productId}`);
    setCartItems((prevItems: CartItem[]) => {
      const updatedItems = prevItems.filter((item) => item.id !== productId);
      console.log("Updated cart items:", updatedItems);
      return updatedItems;
    });
  }, []);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      Alert.alert("Cart is empty", "Please add items to the cart before checking out.");
      return;
    }
    // Permission guard: Only allow checkout if user can access all products in cart
    if (user?.role !== 'owner') {
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.id);
        if (product && !canAccessStore(user, product.storeId || "")) {
          Alert.alert('Access Denied', 'You do not have permission to checkout items from this store.');
          return;
        }
      }
    }
    setShowPayment(true);
  }, [cartItems, user, products]);

  if (showPayment) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <PaymentProcessor
          cartTotal={cartTotal}
          cartItems={cartItems}
          onPaymentComplete={processPaymentComplete}
          onCancel={handlePaymentCancel}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Main POS Interface */}
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <TouchableOpacity onPress={onBack} className="p-2">
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold">Point of Sale</Text>
          <TouchableOpacity 
            onPress={() => setShowMobileCart(true)}
            className="p-2 relative"
            disabled={!isMobile}
          >
            <CartIcon size={24} color="#000" />
            {cartItems.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2"
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeCategory === category ? 'bg-blue-500' : 'bg-gray-100'
              }`}
            >
              <Text 
                className={`text-sm font-medium ${
                  activeCategory === category ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View className="flex-1 flex-row">
          <View className="flex-1">
            {isLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-4 text-gray-600">Loading products...</Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500">No products found</Text>
              </View>
            ) : (
              <ProductGrid
                products={filteredProducts}
                onAddToCart={addToCart}
                isMobile={isMobile}
              />
            )}
          </View>

          {/* Shopping Cart - Only show on desktop */}
          {!isMobile && (
            <View className="w-2/5">
              <ShoppingCart
                cartItems={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={handleCheckout}
                onBack={onBack}
              />
            </View>
          )}
        </View>

        {/* Mobile Cart Modal */}
        {isMobile && (
          <MobileShoppingCart
            visible={showMobileCart}
            cartItems={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onCheckout={handleCheckout}
            onClose={() => setShowMobileCart(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default POSInterface;
