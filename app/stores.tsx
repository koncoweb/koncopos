import { View } from "react-native";
import StoreManagement from "../components/StoreManagement";
import { useRouter } from "expo-router";

export default function StoresPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <StoreManagement onBack={() => router.replace("/")} />
    </View>
  );
}
