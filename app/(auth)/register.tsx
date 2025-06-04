import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, User, Eye, EyeOff, Mail } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    console.log("RegisterScreen: handleSignup called");

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Clear any previous errors
    setError("");
    setIsSigningUp(true);

    try {
      console.log("Signup attempt started for email:", email);
      await signup(email, password, displayName || undefined);
      console.log("Signup successful, navigating to main app");

      // Show success message
      Alert.alert(
        "Account Created",
        "Your account has been created successfully! A new record has been added to the users collection.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Signup error:", error);

      // Set specific error message based on Firebase error code
      if (error.code === "auth/email-already-in-use") {
        setError("An account with this email already exists");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email format");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError(error.message || "An error occurred during signup");
      }
    } finally {
      setIsSigningUp(false);
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
                Create Account
              </Text>
              <Text className="text-gray-500 mt-2 text-center">
                Sign up to get started
              </Text>
            </View>

            {/* Error message */}
            {error ? (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-red-500">{error}</Text>
              </View>
            ) : null}

            {/* Signup Form */}
            <View className="space-y-4">
              {/* Display Name Input */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <User size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="bg-gray-100 text-gray-800 rounded-lg pl-10 pr-4 py-3 w-full"
                  placeholder="Display Name (Optional)"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>

              {/* Email Input */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <Mail size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="bg-gray-100 text-gray-800 rounded-lg pl-10 pr-4 py-3 w-full"
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
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

              {/* Confirm Password Input */}
              <View className="relative">
                <View className="absolute left-3 top-3 z-10">
                  <Lock size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="bg-gray-100 text-gray-800 rounded-lg pl-10 pr-12 py-3 w-full"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3 z-10"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-3 items-center mt-6"
                onPress={handleSignup}
                disabled={isSigningUp}
              >
                {isSigningUp ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-semibold text-lg ml-2">
                      Creating Account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <View className="mt-6 items-center">
              <Text className="text-gray-500">Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="mt-1"
              >
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Info about user record creation */}
            <View className="mt-8 p-4 bg-blue-50 rounded-lg">
              <Text className="text-blue-700 text-center text-sm">
                ℹ️ When you create an account, a new record will be
                automatically created in the "users" collection with your
                profile information.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
