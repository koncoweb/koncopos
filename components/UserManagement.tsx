import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  Edit,
  Users,
  Shield,
  ChevronDown,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import firebaseService from "../services/firebaseService";

interface UserManagementProps {
  onBack?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'warehouse_admin' | 'cashier';
  storeId?: string;
  storeName?: string;
  warehouseId?: string;
  warehouseName?: string;
  permissions?: string[];
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
  location: string;
}

interface Warehouse {
  id: string;
  name: string;
  storeId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack = () => {} }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    role: 'cashier' as 'owner' | 'warehouse_admin' | 'cashier',
    storeId: '',
    warehouseId: '',
  });

  // Check if user is owner
  const isOwner = user?.role === 'owner';

  const roles = [
    { id: 'cashier', name: 'Cashier', description: 'Can process sales transactions' },
    { id: 'warehouse_admin', name: 'Warehouse Admin', description: 'Can manage inventory and view reports' },
    { id: 'owner', name: 'Owner', description: 'Full access to all features' },
  ];

  useEffect(() => {
    if (isOwner) {
      loadData();
    }
  }, [isOwner]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (firebaseService.isInitialized()) {
        const [storesData, warehousesData, usersData] = await Promise.all([
          firebaseService.getStores(),
          firebaseService.getWarehouses(),
          firebaseService.getCollection('profiles'),
        ]);
        
        setStores(storesData);
        setWarehouses(warehousesData);
        
        // Enhance user data with store/warehouse names
        const enhancedUsers = usersData.map((userProfile: any) => {
          const store = storesData.find(s => s.id === userProfile.storeId);
          const warehouse = warehousesData.find(w => w.id === userProfile.warehouseId);
          
          return {
            ...userProfile,
            storeName: store?.name,
