import { View } from "react-native";
import WarehouseManagement from "../components/WarehouseManagement";
import { useRouter } from "expo-router";

export default function WarehousesPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <WarehouseManagement onBack={() => router.replace("/")} />
    </View>
  );
}
