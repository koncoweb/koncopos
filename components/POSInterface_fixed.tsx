import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  useWindowDimensions,
  StyleSheet
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
  storeId: string;
};

interface POSInterfaceProps {
  onBack?: () => void;
  onTransactionComplete?: () => void;
  storeId?: string;
  children?: React.ReactNode;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ 
  onBack = () => {}, 
  onTransactionComplete = () => {}, 
  storeId = '',
  children
}) => {
  // Ensure we return a valid ReactNode
  if (!onBack || !onTransactionComplete) {
    return null;
  }
  // State for products and UI
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hooks
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isMobile = width < 768;
  const effectiveStoreId = storeId || '';
  
  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);
  
  // Handle payment completion
  const handlePaymentComplete = useCallback((
    paymentMethod: string,
    transactionId: string
  ) => {
    // Process payment completion
    setShowPayment(false);
    setCartItems([]);
    onTransactionComplete();
    
    // Show success message
    Alert.alert("Success", `Payment of $${cartTotal.toFixed(2)} completed successfully!`);
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
        const storedProducts = await getData(STORAGE_KEYS.PRODUCTS, []);
        if (storedProducts) {
          setProducts(storedProducts);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        Alert.alert("Error", "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products based on search, category, and permissions
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      try {
        const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
        const matchesSearch = searchQuery === '' || 
          (product.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
          (product.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const hasPermission = user?.role === 'owner' || 
          (product.storeId ? canAccessStore(user, product.storeId || '') : false);
        
        return matchesCategory && matchesSearch && hasPermission;
      } catch (error) {
        console.error("Error filtering products:", error);
        return false;
      }
    });
  }, [products, activeCategory, searchQuery, user]);

  // Add to cart function
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

  // Handle checkout
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

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <TouchableOpacity 
          onPress={() => setShowMobileCart(true)} 
          style={styles.cartButton}
        >
          <CartIcon size={24} color="#000" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIcon}>
            <Search size={20} color="#666" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.productsContainer}>
          <ProductGrid 
            products={filteredProducts} 
            onAddToCart={addToCart}
            isMobile={isMobile}
          />
        </View>

        {!isMobile && (
          <View style={styles.cartContainer}>
            <ShoppingCart
              cartItems={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
            />
          </View>
        )}
      </View>

      {isMobile && (
        <MobileShoppingCart
          visible={showMobileCart}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}

{!isMobile && (
<View style={styles.cartContainer}>
<ShoppingCart
cartItems={cartItems}
onUpdateQuantity={updateQuantity}
onRemoveItem={removeFromCart}
onCheckout={handleCheckout}
/>
</View>
)}
</View>

{isMobile && (
<MobileShoppingCart
visible={showMobileCart}
cartItems={cartItems}
onUpdateQuantity={updateQuantity}
onRemoveItem={removeFromCart}

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

    {showPayment && (
      <PaymentProcessor
        amount={cartTotal}
        onPaymentComplete={handlePaymentComplete}
        onCancel={handlePaymentCancel}
      />
    )}
  </SafeAreaView>
);

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#fff',
paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
},
header: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
padding: 16,
borderBottomWidth: 1,
borderBottomColor: '#eee',
},
backButton: {
padding: 8,
},
headerTitle: {
fontSize: 20,
fontWeight: 'bold',
},
cartButton: {
padding: 8,
position: 'relative',
},
cartBadge: {
position: 'absolute',
right: 0,
top: 0,
backgroundColor: 'red',
borderRadius: 10,
width: 20,
height: 20,
justifyContent: 'center',
alignItems: 'center',
},
cartBadgeText: {
color: '#fff',
fontSize: 12,
fontWeight: 'bold',
},
searchContainer: {
padding: 16,
borderBottomWidth: 1,
borderBottomColor: '#eee',
},
searchInputContainer: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#f5f5f5',
borderRadius: 8,
paddingHorizontal: 12,
},
searchIcon: {
marginRight: 8,
justifyContent: 'center',
alignItems: 'center',
},
searchInput: {
flex: 1,
height: 40,
fontSize: 16,
},
content: {
flex: 1,
flexDirection: 'row',
},
productsContainer: {
flex: 1,
padding: 16,
},
cartContainer: {
width: 350,
borderLeftWidth: 1,
borderLeftColor: '#eee',
},
loadingContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
},
loadingText: {
marginTop: 16,
fontSize: 16,
color: '#666',
},
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  productsContainer: {
    flex: 1,
    padding: 16,
  },
  cartContainer: {
    width: 350,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default POSInterface;
