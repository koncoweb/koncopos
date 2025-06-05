import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Truck, Package } from "lucide-react-native";
import CreateTransfer from "./CreateTransfer";
import ReceiveTransfer from "./ReceiveTransfer";
import Header from "./Header";
import { storeData, getData, STORAGE_KEYS } from "../services/storage";

export interface Transfer {
  id: string;
  sourceLocation: string;
  destinationLocation: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  status: "pending" | "in-transit" | "received" | "cancelled";
  createdAt: string;
  receivedAt?: string;
}

interface TransferManagementProps {
  onClose?: () => void;
}

const TransferManagement = ({
  onClose = () => {},
}: TransferManagementProps) => {
  const [activeTab, setActiveTab] = useState<"create" | "receive">("create");
  const [transferCreated, setTransferCreated] = useState(false);
  const [transferReceived, setTransferReceived] = useState(false);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transfers from storage on component mount
  useEffect(() => {
    const loadTransfers = async () => {
      setIsLoading(true);
      try {
        const storedTransfers = await getData<Transfer[]>(
          STORAGE_KEYS.TRANSFERS,
          [],
        );
        setTransfers(storedTransfers);
      } catch (error) {
        console.error("Error loading transfers:", error);
        setTransfers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransfers();
  }, []);

  // Save transfers to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      storeData(STORAGE_KEYS.TRANSFERS, transfers);
    }
  }, [transfers, isLoading]);

  const handleTransferCreated = () => {
    setTransferCreated(true);
    // In a real implementation, we would add the new transfer to the transfers array here
    // setTransfers([...transfers, newTransfer]);

    // Reset after showing success message
    setTimeout(() => {
      setTransferCreated(false);
      setActiveTab("receive");
    }, 2000);
  };

  const handleTransferReceived = (transferId: string, status: string) => {
    setTransferReceived(true);
    // In a real implementation, we would update the transfer status in the transfers array here
    // setTransfers(transfers.map(t => t.id === transferId ? {...t, status: 'received', receivedAt: new Date().toISOString()} : t));

    // Reset after showing success message
    setTimeout(() => {
      setTransferReceived(false);
      setActiveTab("create");
    }, 2000);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Header title="Transfer Management" />

      {/* Page Description */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-gray-500">
          Create and receive inventory transfers between locations
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${activeTab === "create" ? "border-b-2 border-blue-500" : ""}`}
          onPress={() => setActiveTab("create")}
        >
          <Truck
            size={18}
            color={activeTab === "create" ? "#3b82f6" : "#6b7280"}
          />
          <Text
            className={`ml-2 font-medium ${activeTab === "create" ? "text-blue-500" : "text-gray-500"}`}
          >
            Create Transfer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${activeTab === "receive" ? "border-b-2 border-blue-500" : ""}`}
          onPress={() => setActiveTab("receive")}
        >
          <Package
            size={18}
            color={activeTab === "receive" ? "#3b82f6" : "#6b7280"}
          />
          <Text
            className={`ml-2 font-medium ${activeTab === "receive" ? "text-blue-500" : "text-gray-500"}`}
          >
            Receive Transfer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Messages */}
      {transferCreated && (
        <View className="bg-green-100 p-4 border-b border-green-200">
          <Text className="text-green-800 font-medium text-center">
            Transfer created successfully! Delivery note has been generated.
          </Text>
        </View>
      )}

      {transferReceived && (
        <View className="bg-green-100 p-4 border-b border-green-200">
          <Text className="text-green-800 font-medium text-center">
            Transfer received successfully! Inventory has been updated.
          </Text>
        </View>
      )}

      {/* Content Area */}
      <View className="flex-1">
        {activeTab === "create" ? (
          <CreateTransfer
            onTransferCreated={handleTransferCreated}
            onCancel={onClose}
          />
        ) : (
          <ReceiveTransfer onComplete={handleTransferReceived} />
        )}
      </View>
    </View>
  );
};

export default TransferManagement;
