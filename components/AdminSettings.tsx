import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react-native";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";
import firebaseService, { FirebaseConfig } from "../services/firebaseService";
import { useAuth } from "../contexts/AuthContext";

interface AdminSettingsProps {
  onBack?: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onBack = () => {} }) => {
  const { config, isConfigured, updateConfig, resetConfig } =
    useFirebaseConfig();
  const { user } = useAuth();
  const isAdmin = user?.role === "owner"; // Only 'owner' is now superuser
  const [formData, setFormData] = useState<FirebaseConfig>({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Load current config into form
    setFormData(config);
  }, [config]);

  const handleInputChange = (field: keyof FirebaseConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear test result when form is modified
    setTestResult(null);
  };

  const handleSave = async () => {
    // Check if user has owner role
    if (!isAdmin) {
      Alert.alert(
        "Access Denied",
        "You need owner privileges to modify these settings.",
      );
      return;
    }

    setIsSaving(true);
    try {
      // Validate form data
      const requiredFields = [
        "apiKey",
        "authDomain",
        "projectId",
        "storageBucket",
        "messagingSenderId",
        "appId",
      ];
      const missingFields = requiredFields.filter(
        (field) => !formData[field as keyof FirebaseConfig],
      );

      if (missingFields.length > 0) {
        Alert.alert(
          "Validation Error",
          `Please fill in all required fields: ${missingFields.join(", ")}`,
        );
        return;
      }

      const success = await updateConfig(formData, isAdmin);
      if (success) {
        Alert.alert("Success", "Firebase configuration saved successfully");
      } else {
        Alert.alert("Error", "Failed to save Firebase configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while saving configuration",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Check if user has owner role
    if (!isAdmin) {
      Alert.alert(
        "Access Denied",
        "You need owner privileges to reset these settings.",
      );
      return;
    }

    Alert.alert(
      "Reset Configuration",
      "Are you sure you want to reset the Firebase configuration? This will disable Firebase integration.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetConfig(isAdmin);
              setFormData({
                apiKey: "",
                authDomain: "",
                projectId: "",
                storageBucket: "",
                messagingSenderId: "",
                appId: "",
              });
              Alert.alert("Success", "Firebase configuration has been reset");
              setTestResult(null);
            } catch (error) {
              Alert.alert("Error", "Failed to reset configuration");
            }
          },
        },
      ],
    );
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Save current config temporarily for testing
      await firebaseService.saveConfig(formData);

      // Try to initialize Firebase with the new config
      if (firebaseService.isInitialized()) {
        setTestResult({
          success: true,
          message: "Connection successful! Firebase is properly configured.",
        });
      } else {
        setTestResult({
          success: false,
          message:
            "Failed to initialize Firebase. Please check your configuration.",
        });
      }
    } catch (error) {
      console.error("Test connection error:", error);
      setTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 p-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Firebase Configuration
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`p-2 rounded-full ${isSaving ? "opacity-50" : ""}`}
          >
            <Save size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {!isAdmin && (
          <View className="mb-6 p-4 rounded-lg bg-red-100">
            <View className="flex-row items-center">
              <ShieldAlert size={24} color="#b91c1c" className="mr-2" />
              <Text className="text-red-800 font-medium">
                Access Restricted: You need owner privileges to modify
                these settings.
              </Text>
            </View>
          </View>
        )}
        {/* Status Indicator */}
        <View
          className={`mb-6 p-4 rounded-lg ${isConfigured ? "bg-green-100" : "bg-yellow-100"}`}
        >
          <Text
            className={`text-lg font-medium ${isConfigured ? "text-green-800" : "text-yellow-800"}`}
          >
            {isConfigured
              ? "Firebase is configured"
              : "Firebase is not configured"}
          </Text>
          <Text
            className={`mt-1 ${isConfigured ? "text-green-600" : "text-yellow-600"}`}
          >
            {isConfigured
              ? "Your app is connected to Firebase. You can update the configuration below."
              : "Please configure Firebase to enable cloud features."}
          </Text>
        </View>

        {/* Test Result */}
        {testResult && (
          <View
            className={`mb-6 p-4 rounded-lg ${testResult.success ? "bg-green-100" : "bg-red-100"}`}
          >
            <View className="flex-row items-center">
              {testResult.success ? (
                <Text className="text-green-800 font-medium">
                  {testResult.message}
                </Text>
              ) : (
                <>
                  <AlertTriangle size={20} color="#b91c1c" className="mr-2" />
                  <Text className="text-red-800 font-medium">
                    {testResult.message}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Form Fields */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 mb-1 font-medium">API Key</Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-lg text-gray-800"
              value={formData.apiKey}
              onChangeText={(text) => handleInputChange("apiKey", text)}
              placeholder="Enter API Key"
              editable={isAdmin}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-1 font-medium">Auth Domain</Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-lg text-gray-800"
              value={formData.authDomain}
              onChangeText={(text) => handleInputChange("authDomain", text)}
              placeholder="Enter Auth Domain"
              editable={isAdmin}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-1 font-medium">Project ID</Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-lg text-gray-800"
              value={formData.projectId}
              onChangeText={(text) => handleInputChange("projectId", text)}
              placeholder="Enter Project ID"
              editable={isAdmin}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-1 font-medium">
              Storage Bucket
            </Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-lg text-gray-800"
              value={formData.storageBucket}
              onChangeText={(text) => handleInputChange("storageBucket", text)}
              placeholder="Enter Storage Bucket"
              editable={isAdmin}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-1 font-medium">
              Messaging Sender ID
            </Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-lg text-gray-800"
              value={formData.messagingSenderId}
              onChangeText={(text) =>
                handleInputChange("messagingSenderId", text)
              }
              placeholder="Enter Messaging Sender ID"
              editable={isAdmin}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-1 font-medium">App ID</Text>
            <TextInput
              className="bg-gray-100 p-3 rounded-lg text-gray-800"
              value={formData.appId}
              onChangeText={(text) => handleInputChange("appId", text)}
              placeholder="Enter App ID"
              editable={isAdmin}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-8 space-y-4">
          <TouchableOpacity
            className={`${isAdmin ? "bg-blue-500" : "bg-gray-400"} p-4 rounded-lg flex-row justify-center items-center`}
            onPress={testConnection}
            disabled={isTesting || !isAdmin}
          >
            {isTesting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <RefreshCw size={20} color="white" className="mr-2" />
                <Text className="text-white font-medium">Test Connection</Text>
              </>
            )}
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              className="bg-red-500 p-4 rounded-lg flex-row justify-center items-center"
              onPress={handleReset}
            >
              <Text className="text-white font-medium">
                Reset Configuration
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <View className="mt-8 p-4 bg-gray-100 rounded-lg">
          <Text className="text-gray-700 font-medium mb-2">
            How to get Firebase credentials:
          </Text>
          <Text className="text-gray-600 mb-1">
            1. Go to the Firebase console (firebase.google.com)
          </Text>
          <Text className="text-gray-600 mb-1">
            2. Create a new project or select an existing one
          </Text>
          <Text className="text-gray-600 mb-1">
            3. Add a web app to your project
          </Text>
          <Text className="text-gray-600 mb-1">
            4. Copy the configuration values from the Firebase SDK snippet
          </Text>
          <Text className="text-gray-600">
            5. Paste them into the fields above
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminSettings;
