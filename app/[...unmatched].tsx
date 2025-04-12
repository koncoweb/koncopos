import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Page Not Found</Text>
      <Text className="text-gray-600 mb-8 text-center">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        className="bg-blue-500 py-3 px-6 rounded-lg"
        onPress={() => router.replace("/")}
      >
        <Text className="text-white font-semibold">Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}
