export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "owner" | "manager" | "staff";
  assignedStores: string[];      // store IDs user can access
  assignedWarehouses: string[];  // warehouse IDs user can access
}
