import { View } from "react-native";
import POSInterface from "../components/POSInterface";
import { useRouter } from "expo-router";

export default function POSPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <POSInterface onBack={() => router.replace("/")} />
    </View>
  );
}
