import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions
} from 'react-native';
import { Search, ShoppingCart as CartIcon, X } from 'lucide-react-native';
import Constants from 'expo-constants';
import { Product } from '../models/Product';
import { useAuth } from '../contexts/AuthContext';
import { canAccessStore } from '../utils/permissions';
import { getData, storeData } from '../services/storage';
import ProductGrid from './ProductGrid';
import ShoppingCart from './ShoppingCart';
import MobileShoppingCart from './MobileShoppingCart';
import PaymentProcessor from './PaymentProcessor';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
}

interface POSInterfaceProps {
  onBack?: () => void;
  onTransactionComplete?: () => void;
  storeId?: string;
  children?: React.ReactNode;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ 
  onBack = () => {}, 
  onTransactionComplete = () => {}, 
  storeId = ''
}) => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const effectiveStoreId = storeId || user?.storeId || '';

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const storedProducts = await getData('products');
        if (storedProducts) {
          setProducts(storedProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        Alert.alert('Error', 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [effectiveStoreId]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !activeCategory || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Cart operations
  const addToCart = useCallback((product: Product) => {
    if (!effectiveStoreId) {
      Alert.alert('Error', 'No store selected');
      return;
    }

    if (!canAccessStore(user, effectiveStoreId)) {
      Alert.alert('Error', 'You do not have permission to add items to cart in this store');
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { id: product.id, product, quantity: 1, price: product.price }];
    });
  }, [effectiveStoreId, user]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  // Payment handling
  const handleCheckout = useCallback(() => {
    if (isMobile) {
      setShowMobileCart(false);
    }
    setShowPayment(true);
  }, [isMobile]);

  const handlePaymentComplete = useCallback((paymentMethod: string, transactionId: string) => {
    setShowPayment(false);
    setCartItems([]);
    onTransactionComplete();
    Alert.alert('Success', `Payment of $${cartTotal.toFixed(2)} completed successfully!`);
  }, [cartTotal, onTransactionComplete]);

  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false);
  }, []);

  // Loading state
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Point of Sale</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => setShowMobileCart(true)}
        >
          <CartIcon size={24} color="#000" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
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
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Products */}
        <View style={styles.productsContainer}>
          <ProductGrid 
            products={filteredProducts} 
            onAddToCart={addToCart}
            isMobile={isMobile}
          />
        </View>

        {/* Cart - Desktop */}
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

      {/* Payment Processor */}
      {showPayment && (
        <PaymentProcessor
          amount={cartTotal}
          onPaymentComplete={handlePaymentComplete}
          onCancel={handlePaymentCancel}
        />
      )}
    </SafeAreaView>
  );
};

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
});

export default POSInterface;
