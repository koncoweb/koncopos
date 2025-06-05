import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
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
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      console.log(`Getting user role for UID: ${uid}`);

      // Check the 'users' collection for the role
      const userDoc = await getDoc(doc(this.db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || null;
        console.log(`Found user document in 'users' collection:`, userData);
        console.log(`Extracted role: ${role}`);
        return role;
      }

      console.log(`No user document found for UID: ${uid}`);
      return null;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
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

  // Get all stores from Firestore
  public async getStores() {
    if (!this.db) throw new Error("Firebase Firestore not initialized");
    try {
      console.log("Fetching stores from Firestore...");
      const storesCollection = collection(this.db, "stores");
      const storesSnapshot = await getDocs(storesCollection);
      const stores = storesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || doc.id,
      }));
      console.log(`Retrieved ${stores.length} stores from Firestore`);
      return stores;
    } catch (error) {
      console.error("Error fetching stores:", error);
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

  // Get user display name by UID
  public async getUserDisplayName(uid: string): Promise<string> {
    if (!this.db) return uid;
    try {
      const userDoc = await getDoc(doc(this.db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.displayName || userData.email?.split("@")[0] || uid;
      }
      return uid;
    } catch (error) {
      console.error("Error getting user display name:", error);
      return uid;
    }
  }

  // Transfer document generation
  public async generateTransferDocumentHTML(
    transferData: any,
  ): Promise<string> {
    const currentDate = new Date().toLocaleDateString("id-ID");
    const currentTime = new Date().toLocaleTimeString("id-ID");

    // Get user display name if createdBy is a UID
    let createdByName = transferData.createdBy || "Sistem";
    if (transferData.createdBy && transferData.createdBy.length > 10) {
      // Likely a UID, try to get display name
      createdByName = await this.getUserDisplayName(transferData.createdBy);
    }

    const productsHTML = transferData.products
      .map(
        (product: any, index: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.sku}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${product.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${(product.price || 0).toLocaleString("id-ID")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${((product.price || 0) * product.quantity).toLocaleString("id-ID")}</td>
        </tr>`,
      )
      .join("");

    const totalValue = transferData.products.reduce(
      (sum: number, product: any) =>
        sum + (product.price || 0) * product.quantity,
      0,
    );

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Dokumen Transfer - ${transferData.id || "N/A"}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 5px;
            }
            .document-title {
                font-size: 20px;
                font-weight: bold;
                margin-top: 10px;
            }
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .info-box {
                width: 48%;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .info-title {
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .info-item {
                margin-bottom: 5px;
            }
            .products-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .products-table th {
                background-color: #007bff;
                color: white;
                padding: 12px 8px;
                text-align: left;
                font-weight: bold;
            }
            .products-table td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
            }
            .products-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .summary {
                margin-top: 20px;
                padding: 15px;
                background-color: #f0f8ff;
                border: 1px solid #007bff;
                border-radius: 5px;
            }
            .summary-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .total {
                font-weight: bold;
                font-size: 18px;
                border-top: 2px solid #007bff;
                padding-top: 10px;
                margin-top: 10px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            .signature-section {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }
            .signature-box {
                width: 45%;
                text-align: center;
            }
            .signature-line {
                border-top: 1px solid #333;
                margin-top: 40px;
                padding-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">StockPoint Pro</div>
            <div class="document-title">DOKUMEN TRANSFER INVENTORI</div>
        </div>

        <div class="info-section">
            <div class="info-box">
                <div class="info-title">Informasi Transfer</div>
                <div class="info-item"><strong>ID Transfer:</strong> ${transferData.id || "N/A"}</div>
                <div class="info-item"><strong>Tanggal:</strong> ${currentDate}</div>
                <div class="info-item"><strong>Waktu:</strong> ${currentTime}</div>
                <div class="info-item"><strong>Status:</strong> ${transferData.status === "completed" ? "Selesai" : transferData.status || "Selesai"}</div>
                <div class="info-item"><strong>Dibuat Oleh:</strong> ${createdByName}</div>
            </div>
            
            <div class="info-box">
                <div class="info-title">Detail Transfer</div>
                <div class="info-item"><strong>Dari:</strong> ${transferData.sourceLocationName} (${transferData.sourceLocationType === "warehouse" ? "Gudang" : transferData.sourceLocationType === "store" ? "Toko" : transferData.sourceLocationType || "Lokasi"})</div>
                <div class="info-item"><strong>Ke:</strong> ${transferData.destinationLocationName} (${transferData.destinationLocationType === "warehouse" ? "Gudang" : transferData.destinationLocationType === "store" ? "Toko" : transferData.destinationLocationType || "Lokasi"})</div>
                <div class="info-item"><strong>Total Item:</strong> ${transferData.totalItems || 0}</div>
                ${transferData.notes ? `<div class="info-item"><strong>Catatan:</strong> ${transferData.notes}</div>` : ""}
            </div>
        </div>

        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Nama Produk</th>
                    <th style="width: 20%;">SKU</th>
                    <th style="width: 10%; text-align: center;">Jumlah</th>
                    <th style="width: 15%; text-align: right;">Harga Satuan</th>
                    <th style="width: 15%; text-align: right;">Total Nilai</th>
                </tr>
            </thead>
            <tbody>
                ${productsHTML}
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-item">
                <span>Total Item:</span>
                <span>${transferData.totalItems || 0}</span>
            </div>
            <div class="summary-item">
                <span>Total Produk:</span>
                <span>${transferData.products?.length || 0}</span>
            </div>
            <div class="summary-item total">
                <span>Total Nilai Transfer:</span>
                <span>Rp ${totalValue.toLocaleString("id-ID")}</span>
            </div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">Disiapkan Oleh</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Diterima Oleh</div>
            </div>
        </div>

        <div class="footer">
            <p>Dokumen ini dibuat secara otomatis oleh Sistem Manajemen Inventori StockPoint Pro</p>
            <p>Dibuat pada ${currentDate} pukul ${currentTime}</p>
        </div>
    </body>
    </html>
    `;
  }
}

// Create a singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
