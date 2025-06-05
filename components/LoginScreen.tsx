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
  ActivityIndicator,
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

  // Create default owner account on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if owner account already exists
        const accounts = await getData<Record<string, string>>(
          "user_accounts",
          {},
        );

        // If owner account doesn't exist, create it
        if (!accounts["owner"]) {
          const updatedAccounts = {
            ...accounts,
            owner: "password123",
          };
          await storeData("user_accounts", updatedAccounts);
          console.log("Default owner account created");
        }
      } catch (error) {
        console.error("Error creating default owner account:", error);
      }
    };

    initialize();
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    console.log("LoginScreen: handleLogin called");
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    // Clear any previous errors
    setError("");
    // Set loading state
    setIsLoggingIn(true);

    try {
      console.log("Login attempt started for user:", username);

      // Check if it's the demo account
      if (username === "demo" && password === "password") {
        console.log("Demo account login successful");
        // Store auth state first
        await storeData("auth_state", {
          isAuthenticated: true,
          userName: "Demo User",
        });
        // Call the onLogin prop with credentials
        await onLogin(username, password);
        // Let AuthContext handle navigation
        console.log(
          "Demo login complete - letting AuthContext handle navigation",
        );
        return;
      }

      // Import firebaseService dynamically to avoid circular dependencies
      const firebaseService = (await import("../services/firebaseService"))
        .default;

      // Check if Firebase is configured and initialized
      if (firebaseService.isInitialized()) {
        try {
          console.log("Firebase initialized, attempting login");
          // Try to sign in with Firebase
          // For email/password login, ensure the username is a valid email format
          const isEmail = username.includes("@");

          if (isEmail) {
            console.log("Attempting email login with Firebase");
            console.log("Attempting to sign in with:", username);
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
            console.log("Email login successful, calling onLogin");
            await onLogin(username, password);
            console.log(
              "Email login complete - letting AuthContext handle navigation",
            );
            return;
          } else {
            try {
              console.log("Attempting direct username login with Firebase");
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

              console.log("Direct login successful, calling onLogin");
              await onLogin(username, password);
              console.log(
                "Direct login complete - letting AuthContext handle navigation",
              );
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

              console.log("Email format login successful, calling onLogin");
              await onLogin(username, password);
              console.log(
                "Email format login complete - letting AuthContext handle navigation",
              );
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
            setError("An error occurred during login");
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
    } finally {
      // Set loading state back to false
      setIsLoggingIn(false);
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
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View className="mt-6 items-center">
              <Text className="text-gray-500">Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push("/register")}
                className="mt-1"
              >
                <Text className="text-blue-600 font-semibold">Sign Up</Text>
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
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
