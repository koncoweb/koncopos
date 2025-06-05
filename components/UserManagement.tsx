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
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  Edit,
  Users,
  Shield,
  ChevronDown,
  Trash2,
  Save,
  Search,
  Store,
  Warehouse,
  CheckCircle,
  X,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import firebaseService from "../services/firebaseService";
import { useRouter } from "expo-router";

interface UserManagementProps {
  onBack?: () => void;
}

import { UserProfile } from '../models/UserProfile';

interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Warehouse {
  id: string;
  name: string;
  storeId: string;
  storeName?: string;
  address?: string;
  createdAt?: any;
  updatedAt?: any;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack = () => {} }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [warehouseModalVisible, setWarehouseModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newStore, setNewStore] = useState<Partial<Store>>({ name: '' });
  const [newWarehouse, setNewWarehouse] = useState<Partial<Warehouse>>({ name: '', storeId: '' });
  
  // Form fields for editing user
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'owner' | 'manager' | 'staff'>('staff');
  const [editAssignedStores, setEditAssignedStores] = useState<string[]>([]);
  const [editAssignedWarehouses, setEditAssignedWarehouses] = useState<string[]>([]);
  
  // Define available roles
  const roles = [
    { id: 'staff', name: 'Staff', description: 'Can process sales and manage inventory in assigned locations' },
    { id: 'manager', name: 'Manager', description: 'Can manage assigned stores/warehouses' },
    { id: 'owner', name: 'Owner', description: 'Full access to all features' },
  ];
  
  // Check if user is owner
  const isOwner = user?.role === 'owner';
  
  useEffect(() => {
    if (isOwner) {
      loadData();
    } else {
      Alert.alert(
        "Access Denied",
        "You need owner privileges to access user management."
      );
      onBack();
    }
  }, [isOwner]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (firebaseService.isInitialized()) {
        const [storesData, warehousesData, usersData] = await Promise.all([
          firebaseService.getStores(),
          firebaseService.getWarehouses(),
          firebaseService.getUserProfiles(),
        ]);
        setStores(storesData);
        setWarehouses(warehousesData);
        // Enhance user data with store/warehouse names
        const enhancedUsers = usersData.map((userProfile: any) => {
          const store = storesData.find((s: Store) => s.id === userProfile.storeId);
          const warehouse = warehousesData.find((w: Warehouse) => w.id === userProfile.warehouseId);
          return {
            ...userProfile,
            storeName: store?.name,
            warehouseName: warehouse?.name,
          };
        });
        setUsers(enhancedUsers);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user/store/warehouse data.');
    } finally {
      setIsLoading(false);
    }
  };

  // User edit modal handlers
  const openEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditDisplayName(user.displayName);
    setEditRole(user.role);
    setEditAssignedStores(user.assignedStores || []);
    setEditAssignedWarehouses(user.assignedWarehouses || []);
    setModalVisible(true);
  };
  const closeEditUser = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };
  const saveUserEdit = async () => {
    if (!selectedUser) return;
    try {
      await firebaseService.updateUserProfile(selectedUser.id, {
        displayName: editDisplayName,
        role: editRole,
        assignedStores: editAssignedStores,
        assignedWarehouses: editAssignedWarehouses,
      });
      closeEditUser();
      loadData();
      Alert.alert('Success', 'User updated successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update user.');
    }
  };

  // UI rendering
  if (!isOwner) return null;
  if (isLoading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={{flex:1}}>
      <View style={{flexDirection:'row',alignItems:'center',padding:16}}>
        <TouchableOpacity onPress={onBack}><ArrowLeft size={24} /></TouchableOpacity>
        <Text style={{fontSize:20,fontWeight:'bold',marginLeft:12}}>User Management</Text>
      </View>
      <ScrollView style={{flex:1}}>
        <Text style={{fontWeight:'bold',margin:16}}>Users</Text>
        {users.map(u => (
          <TouchableOpacity key={u.id} style={{borderWidth:1,borderColor:'#eee',borderRadius:8,margin:8,padding:12}} onPress={()=>openEditUser(u)}>
            <Text style={{fontWeight:'bold'}}>{u.displayName} <Text style={{color:'#888'}}>({u.email})</Text></Text>
            <Text>Role: {u.role}</Text>
            <Text>Stores: {(u.assignedStores?.length ? u.assignedStores.join(', ') : '-') }</Text>
            <Text>Warehouses: {(u.assignedWarehouses?.length ? u.assignedWarehouses.join(', ') : '-') }</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Edit User Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#fff',padding:24,borderRadius:12,width:'90%'}}>
            <Text style={{fontWeight:'bold',fontSize:18,marginBottom:8}}>Edit User</Text>
            <TextInput value={editDisplayName} onChangeText={setEditDisplayName} placeholder="Display Name" style={{borderWidth:1,borderColor:'#eee',borderRadius:8,padding:8,marginBottom:8}} />
            <Text>Role:</Text>
            <View style={{flexDirection:'row',marginBottom:8}}>
              {roles.map(r => (
                <TouchableOpacity key={r.id} style={{marginRight:12,padding:8,backgroundColor:editRole===r.id?'#007bff':'#eee',borderRadius:8}} onPress={()=>setEditRole(r.id as any)}>
                  <Text style={{color:editRole===r.id?'#fff':'#333'}}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text>Assigned Stores:</Text>
            <ScrollView horizontal style={{marginBottom:8}}>
              {stores.map(s => (
                <TouchableOpacity key={s.id} style={{marginRight:12,padding:8,backgroundColor:editAssignedStores.includes(s.id)?'#007bff':'#eee',borderRadius:8}} onPress={()=>{
                  setEditAssignedStores(editAssignedStores.includes(s.id)
                    ? editAssignedStores.filter(id => id !== s.id)
                    : [...editAssignedStores, s.id]);
                }}>
                  <Text style={{color:editAssignedStores.includes(s.id)?'#fff':'#333'}}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text>Assigned Warehouses:</Text>
            <ScrollView horizontal style={{marginBottom:8}}>
              {warehouses.map(w => (
                <TouchableOpacity key={w.id} style={{marginRight:12,padding:8,backgroundColor:editAssignedWarehouses.includes(w.id)?'#007bff':'#eee',borderRadius:8}} onPress={()=>{
                  setEditAssignedWarehouses(editAssignedWarehouses.includes(w.id)
                    ? editAssignedWarehouses.filter(id => id !== w.id)
                    : [...editAssignedWarehouses, w.id]);
                }}>
                  <Text style={{color:editAssignedWarehouses.includes(w.id)?'#fff':'#333'}}>{w.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row',justifyContent:'flex-end'}}>
              <TouchableOpacity onPress={closeEditUser} style={{marginRight:16}}><Text style={{color:'#888'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveUserEdit}><Text style={{color:'#007bff',fontWeight:'bold'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default UserManagement;

