import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  getStorage,
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Default Firebase configuration
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyDxw5Zr9PDj9b0gY8SkWMn6y2PJu601Hek",
  authDomain: "stockpoint-pro.firebaseapp.com",
  projectId: "stockpoint-pro",
  storageBucket: "stockpoint-pro.firebasestorage.app",
  messagingSenderId: "43986157653",
  appId: "1:43986157653:web:11053f1d6c0e5eeb7154dc",
};

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private storage: Storage | null = null;
  private config: FirebaseConfig = DEFAULT_CONFIG;

  constructor() {
    this.loadConfig();
  }

  // Load Firebase configuration from AsyncStorage
  private async loadConfig() {
    try {
      // Skip AsyncStorage on server-side rendering
      if (
        typeof window === "undefined" ||
        typeof global.localStorage === "undefined"
      ) {
        console.log(
          "Running on server or AsyncStorage not available, using default Firebase config",
        );
        this.initializeFirebase();
        return;
      }

      try {
        const configString = await AsyncStorage.getItem("firebase_config");
        if (configString) {
          this.config = JSON.parse(configString);
        }
      } catch (asyncError) {
        console.warn("AsyncStorage error, using default config:", asyncError);
      }

      this.initializeFirebase();
    } catch (error) {
      console.error("Error loading Firebase config:", error);
      // Initialize with default config on error
      this.initializeFirebase();
    }
  }

  // Save Firebase configuration to AsyncStorage
  public async saveConfig(config: FirebaseConfig) {
    try {
      // Skip AsyncStorage on server-side rendering
      if (
        typeof window !== "undefined" &&
        typeof global.localStorage !== "undefined"
      ) {
        try {
          await AsyncStorage.setItem("firebase_config", JSON.stringify(config));
        } catch (asyncError) {
          console.warn("AsyncStorage error while saving config:", asyncError);
          // Continue with the rest of the function even if AsyncStorage fails
        }
      }
      this.config = config;
      this.initializeFirebase();
      return true;
    } catch (error) {
      console.error("Error saving Firebase config:", error);
      return false;
    }
  }

  // Initialize Firebase with the current configuration
  private initializeFirebase() {
    try {
      // Check if all required fields are present
      const requiredFields = [
        "apiKey",
        "authDomain",
        "projectId",
        "storageBucket",
        "messagingSenderId",
        "appId",
      ];
      const missingFields = requiredFields.filter(
        (field) => !this.config[field as keyof FirebaseConfig],
      );

      if (missingFields.length > 0) {
        console.warn(
          `Firebase initialization skipped. Missing fields: ${missingFields.join(", ")}`,
        );
        return;
      }

      // Check if Firebase is already initialized with the same config
      if (this.app) {
        // If the app is already initialized, check if the config has changed
        const currentConfig = this.app.options as FirebaseConfig;
        const configChanged = Object.keys(this.config).some(
          (key) =>
            this.config[key as keyof FirebaseConfig] !==
            currentConfig[key as keyof FirebaseConfig],
        );

        // If config hasn't changed, no need to reinitialize
        if (!configChanged) {
          console.log("Firebase already initialized with the same config");
          return;
        }

        // If config has changed, we need to reinitialize
        console.log("Firebase config changed, reinitializing...");
      }

      // Initialize Firebase app
      this.app = initializeApp(this.config);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);

      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }

  // Check if Firebase is initialized
  public isInitialized(): boolean {
    return this.app !== null && this.auth !== null && this.db !== null;
  }

  // Get current configuration
  public getConfig(): FirebaseConfig {
    return { ...this.config };
  }

  // Authentication methods
  public async signIn(email: string, password: string) {
    if (!this.auth) throw new Error("Firebase Auth not initialized");
    try {
      console.log(`Attempting to sign in with: ${email}`);
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      console.error(
        `Firebase signIn error with ${email}:`,
        error.code,
        error.message,
      );
      throw error;
    }
  }

  public async signUp(email: string, password: string, displayName?: string) {
    if (!this.auth) throw new Error("Firebase Auth not initialized");
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );

    // Create user record in Firestore 'users' collection
    if (this.db && userCredential.user) {
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || email.split("@")[0],
        role: "user", // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(this.db, "users", userCredential.user.uid), userData);
        console.log("User record created in 'users' collection:", userData);
      } catch (error) {
        console.error("Error creating user record in Firestore:", error);
        // Don't throw here as the user account was created successfully
      }
    }

    return userCredential;
  }

  public async logOut() {
    if (!this.auth) throw new Error("Firebase Auth not initialized");
    return await signOut(this.auth);
  }

  public getCurrentUser() {
    if (!this.auth) return null;
    return this.auth.currentUser;
  }

  // Get user role from Firestore
  public async getUserRole(uid: string): Promise<string | null> {
    try {
      if (!this.db) throw new Error("Firebase Firestore not initialized");
      console.log(`Getting user role for uid: ${uid}`);

      const userDoc = await this.getDocument("profiles", uid);
      console.log(`User document retrieved:`, userDoc);

      if (userDoc && userDoc.role) {
        console.log(`User role found: ${userDoc.role}`);
        return userDoc.role;
      }

      console.log("No role found for user");
      return null;
    } catch (error) {
      console.error(`Error getting user role for ${uid}:`, error);
      return null;
    }
  }

  // User Management Methods
  public async createUserProfile(uid: string, userData: any) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      const profileData = {
        ...userData,
        id: uid,
        createdAt: serverTimestamp(),
        role: userData.role || "cashier", // Default role is cashier
        permissions: userData.permissions || [],
      };

      await this.addDocument("profiles", profileData, uid);
      console.log(`Created user profile for ${uid}`);
      return profileData;
    } catch (error) {
      console.error(`Error creating user profile for ${uid}:`, error);
      throw error;
    }
  }

  public async updateUserProfile(uid: string, userData: any) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      await this.updateDocument("profiles", uid, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
      console.log(`Updated user profile for ${uid}`);
      return true;
    } catch (error) {
      console.error(`Error updating user profile for ${uid}:`, error);
      throw error;
    }
  }

  public async getUserProfiles() {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      const profiles = await this.getCollection("profiles");
      return profiles;
    } catch (error) {
      console.error("Error getting user profiles:", error);
      return [];
    }
  }

  // Store Management Methods
  public async getStores() {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      const stores = await this.getCollection("stores");
      return stores;
    } catch (error) {
      console.error("Error getting stores:", error);
      return [];
    }
  }

  public async createStore(storeData: any) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      const store = await this.addDocument("stores", {
        ...storeData,
        createdAt: serverTimestamp(),
      });
      console.log(`Created store: ${store.id}`);
      return store;
    } catch (error) {
      console.error("Error creating store:", error);
      throw error;
    }
  }

  public async updateStore(storeId: string, storeData: any) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      await this.updateDocument("stores", storeId, {
        ...storeData,
        updatedAt: serverTimestamp(),
      });
      console.log(`Updated store: ${storeId}`);
      return true;
    } catch (error) {
      console.error(`Error updating store ${storeId}:`, error);
      throw error;
    }
  }

  public async deleteStore(storeId: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      await this.deleteDocument("stores", storeId);
      console.log(`Deleted store: ${storeId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting store ${storeId}:`, error);
      throw error;
    }
  }

  // Warehouse Management Methods
  public async getWarehouses() {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      const warehouses = await this.getCollection("warehouses");
      return warehouses;
    } catch (error) {
      console.error("Error getting warehouses:", error);
      return [];
    }
  }

  public async getWarehousesByStore(storeId: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      if (!this.db) return [];

      const warehousesRef = collection(this.db, "warehouses");
      const q = query(warehousesRef, where("storeId", "==", storeId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`Error getting warehouses for store ${storeId}:`, error);
      return [];
    }
  }

  public async createWarehouse(warehouseData: any) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      const warehouse = await this.addDocument("warehouses", {
        ...warehouseData,
        createdAt: serverTimestamp(),
      });
      console.log(`Created warehouse: ${warehouse.id}`);
      return warehouse;
    } catch (error) {
      console.error("Error creating warehouse:", error);
      throw error;
    }
  }

  public async updateWarehouse(warehouseId: string, warehouseData: any) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      await this.updateDocument("warehouses", warehouseId, {
        ...warehouseData,
        updatedAt: serverTimestamp(),
      });
      console.log(`Updated warehouse: ${warehouseId}`);
      return true;
    } catch (error) {
      console.error(`Error updating warehouse ${warehouseId}:`, error);
      throw error;
    }
  }

  public async deleteWarehouse(warehouseId: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      await this.deleteDocument("warehouses", warehouseId);
      console.log(`Deleted warehouse: ${warehouseId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting warehouse ${warehouseId}:`, error);
      throw error;
    }
  }

  // Get all warehouses from Firestore
  public async getWarehouses() {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      console.log("Fetching warehouses from Firestore...");
      const warehousesCollection = collection(this.db, "warehouses");
      const warehousesSnapshot = await getDocs(warehousesCollection);
      const warehouses = warehousesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || doc.id,
      }));
      console.log(`Retrieved ${warehouses.length} warehouses from Firestore`);
      return warehouses;
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      return [];
    }
  }

  // Get warehouse stocks for a specific product
  public async getWarehouseStocksForProduct(productId: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      // Validate productId to prevent errors
      if (!productId || productId === "undefined") {
        console.warn(
          "getWarehouseStocksForProduct called with invalid productId: " +
            productId,
        );
        return [];
      }

      console.log(`Fetching warehouse stocks for product ${productId}...`);
      const stocksCollection = collection(this.db, "warehouseStocks");
      const q = query(stocksCollection, where("productId", "==", productId));
      const stocksSnapshot = await getDocs(q);
      const stocks = stocksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(
        `Retrieved ${stocks.length} warehouse stocks for product ${productId}`,
      );
      return stocks;
    } catch (error) {
      console.error(
        `Error fetching warehouse stocks for product ${productId}:`,
        error,
      );
      return [];
    }
  }

  public onAuthStateChanged(callback: (user: any) => void) {
    if (!this.auth) return () => {};
    return this.auth.onAuthStateChanged(callback);
  }

  // Firestore CRUD operations
  public async getDocument(collectionName: string, docId: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    const docRef = doc(this.db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  public async getCollection(collectionName: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      console.log(`Getting collection: ${collectionName}`);
      const collectionRef = collection(this.db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      console.log(
        `Retrieved ${querySnapshot.size} documents from ${collectionName}`,
      );
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      return [];
    }
  }

  // Check if a collection exists in Firestore
  public async collectionExists(collectionName: string): Promise<boolean> {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      console.log(`Checking if collection ${collectionName} exists...`);
      const collectionRef = collection(this.db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      const exists = !querySnapshot.empty;
      console.log(
        `Collection ${collectionName} exists: ${exists} (${querySnapshot.size} documents)`,
      );
      // A collection technically exists if it has at least one document
      return exists;
    } catch (error) {
      console.error(
        `Error checking if collection ${collectionName} exists:`,
        error,
      );
      return false;
    }
  }

  public async addDocument(
    collectionName: string,
    data: any,
    customId?: string,
  ) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    const collectionRef = collection(this.db, collectionName);
    const docRef = customId
      ? doc(this.db, collectionName, customId)
      : doc(collectionRef);
    await setDoc(docRef, data);
    return { id: docRef.id, ...data };
  }

  public async updateDocument(
    collectionName: string,
    docId: string,
    data: any,
  ) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    const docRef = doc(this.db, collectionName, docId);
    await updateDoc(docRef, data);
    return { id: docId, ...data };
  }

  public async deleteDocument(collectionName: string, docId: string) {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    const docRef = doc(this.db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  }

  // Storage methods
  public async uploadFile(path: string, file: Blob) {
    if (!this.storage) throw new Error("Firebase Storage not initialized");
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  public async getFileUrl(path: string) {
    if (!this.storage) throw new Error("Firebase Storage not initialized");
    const storageRef = ref(this.storage, path);
    return await getDownloadURL(storageRef);
  }
}

// Create a singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
