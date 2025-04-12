import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, User, Eye, EyeOff } from "lucide-react-native";
import { getData, storeData } from "../services/storage";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";

interface LoginScreenProps {
  onLogin?: (username: string, password: string) => void;
}

const LoginScreen = ({ onLogin = () => {} }: LoginScreenProps) => {
  const { isConfigured } = useFirebaseConfig();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Create default admin account on component mount
  useEffect(() => {
    const createDefaultAdmin = async () => {
      try {
        // Check if admin account already exists
        const accounts = await getData<Record<string, string>>(
          "user_accounts",
          {},
        );

        // If admin account doesn't exist, create it
        if (!accounts["admin"]) {
          const updatedAccounts = {
            ...accounts,
            admin: "password123",
          };
          await storeData("user_accounts", updatedAccounts);
          console.log("Default admin account created");
        }
      } catch (error) {
        console.error("Error creating default admin account:", error);
      }
    };

    createDefaultAdmin();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    // Clear any previous errors
    setError("");

    try {
      // Check if it's the demo account
      if (username === "demo" && password === "password") {
        // Call the onLogin prop with credentials
        await onLogin(username, password);
        // Navigate to the main dashboard
        router.replace("/");
        return;
      }

      // Import firebaseService dynamically to avoid circular dependencies
      const firebaseService = (await import("../services/firebaseService"))
        .default;

      // Check if Firebase is configured and initialized
      if (firebaseService.isInitialized()) {
        try {
          // Try to sign in with Firebase
          // For email/password login, ensure the username is a valid email format
          const isEmail = username.includes("@");

          if (isEmail) {
            // Use Firebase email/password authentication
            const userCredential = await firebaseService.signIn(
              username,
              password,
            );
            const user = userCredential.user;

            // Store user info in local storage for persistence
            await storeData("auth_state", {
              isAuthenticated: true,
              userName: user.displayName || user.email || username,
              userId: user.uid,
              email: user.email,
              photoURL: user.photoURL,
            });

            // Call the onLogin prop with credentials
            await onLogin(username, password);
            // Force a small delay to ensure state updates
            setTimeout(() => {
              // Navigate to the main dashboard
              router.replace("/");
            }, 100);
            return;
          } else {
            try {
              // First try with the username directly (for existing accounts)
              const directCredential = await firebaseService.signIn(
                username,
                password,
              );
              const directUser = directCredential.user;

              await storeData("auth_state", {
                isAuthenticated: true,
                userName: directUser.displayName || username,
                userId: directUser.uid,
                email: directUser.email,
                photoURL: directUser.photoURL,
              });

              await onLogin(username, password);
              setTimeout(() => {
                router.replace("/");
              }, 100);
              return;
            } catch (directLoginError) {
              console.log("Direct login failed, trying with email format");
              // If direct login fails, try with email format
              const userCredential = await firebaseService.signIn(
                username + "@example.com",
                password,
              );
              const user = userCredential.user;

              await storeData("auth_state", {
                isAuthenticated: true,
                userName: user.displayName || username,
                userId: user.uid,
                email: user.email,
                photoURL: user.photoURL,
              });

              await onLogin(username, password);
              setTimeout(() => {
                router.replace("/");
              }, 100);
              return;
            }
          }
        } catch (firebaseError: any) {
          console.error("Firebase login error:", firebaseError);
          // Set specific error message based on Firebase error code
          if (
            firebaseError.code === "auth/user-not-found" ||
            firebaseError.code === "auth/wrong-password"
          ) {
            setError("Invalid email or password");
          } else if (firebaseError.code === "auth/invalid-email") {
            setError("Invalid email format");
          } else if (firebaseError.code === "auth/too-many-requests") {
            setError("Too many failed login attempts. Please try again later.");
          } else {
            // If Firebase auth fails, fall back to local auth
            console.log("Falling back to local auth");
          }
        }
      }

      // Fall back to local authentication if Firebase is not available
      // Check if it's the admin account
      const accounts = await getData<Record<string, string>>(
        "user_accounts",
        {},
      );

      if (accounts[username] === password) {
        // Store auth state for local authentication
        await storeData("auth_state", {
          isAuthenticated: true,
          userName: username,
        });

        // Call the onLogin prop with credentials
        await onLogin(username, password);
        // Add a small delay to ensure state updates
        setTimeout(() => {
          // Navigate to the main dashboard
          router.replace("/");
        }, 100);
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center">
        <View className="flex-1 justify-center items-center p-6 bg-white">
          <View className="w-full max-w-sm">
            {/* Logo and Header */}
            <View className="items-center mb-8">
              <Image
                source={{
                  uri: "https://api.dicebear.com/7.x/avataaars/svg?seed=POS",
                }}
                className="w-24 h-24 mb-4"
                style={{ width: 96, height: 96 }}
              />
              <Text className="text-2xl font-bold text-gray-800">
                POS & Inventory
              </Text>
              <Text className="text-gray-500 mt-2 text-center">
                Sign in to access your account
              </Text>
            </View>

            {/* Error message */}
            {error ? (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-red-500">{error}</Text>
              </View>
            ) : null}

            {/* Login Form */}
            <View className="space-y-4">
              {/* Username Input */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <User size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="bg-gray-100 text-gray-800 rounded-lg pl-10 pr-4 py-3 w-full"
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <Lock size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="bg-gray-100 text-gray-800 rounded-lg pl-10 pr-12 py-3 w-full"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3 z-10"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="self-end">
                <Text className="text-blue-600">Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-3 items-center mt-2"
                onPress={handleLogin}
              >
                <Text className="text-white font-semibold text-lg">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Demo Credentials */}
            <View className="mt-8 p-4 bg-gray-50 rounded-lg">
              <Text className="text-gray-500 text-center text-sm">
                Available Accounts
              </Text>
              <Text className="text-gray-700 text-center mt-1">
                Demo - Username: demo / Password: password
              </Text>
              <Text className="text-gray-700 text-center">
                Admin - Username: admin / Password: password123
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
