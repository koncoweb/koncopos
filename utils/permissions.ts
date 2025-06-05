import { UserProfile } from '../models/UserProfile';

export function canAccessStore(user: UserProfile | null, storeId: string): boolean {
  if (!user) return false;
  return user.role === "owner" || user.assignedStores.includes(storeId);
}

export function canAccessWarehouse(user: UserProfile | null, warehouseId: string): boolean {
  if (!user) return false;
  return user.role === "owner" || user.assignedWarehouses.includes(warehouseId);
}
