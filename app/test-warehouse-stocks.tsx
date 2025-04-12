import { View } from "react-native";
import WarehouseStockTest from "../components/WarehouseStockTest";
import { useRouter } from "expo-router";

export default function TestWarehouseStocksPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <WarehouseStockTest onBack={() => router.replace("/")} />
    </View>
  );
}
