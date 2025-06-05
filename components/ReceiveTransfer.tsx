import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Truck,
  Package,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react-native";
import firebaseService from "../services/firebaseService";
import { useInventoryData } from "../hooks/useInventoryData";
import { useAuth } from "../contexts/AuthContext";

interface TransferItem {
  id: string;
  productName: string;
  sku: string;
  expectedQuantity: number;
  receivedQuantity: number;
  hasDiscrepancy: boolean;
  notes: string;
}

interface Transfer {
  id: string;
  sourceLocation: string;
  destinationLocation: string;
  sourceLocationName: string;
  destinationLocationName: string;
  sourceLocationType: string;
  destinationLocationType: string;
  dateCreated: string;
  status: "pending" | "in-transit" | "received" | "partially-received";
  items: TransferItem[];
  products: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
  }>;
  createdBy: string;
  notes?: string;
}

interface ReceiveTransferProps {
  onComplete?: (transferId: string, status: string) => void;
  transfer?: Transfer;
}

const ReceiveTransfer = ({
  onComplete,
  transfer: propTransfer,
}: ReceiveTransferProps) => {
  const { user } = useAuth();
  const { updateStockForTransfer } = useInventoryData();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null,
  );
  const [transfer, setTransfer] = useState<Transfer | null>(
    propTransfer || null,
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);

  // Load pending transfers from Firebase
  useEffect(() => {
    loadPendingTransfers();
  }, []);

  const loadPendingTransfers = async () => {
    if (!firebaseService.isInitialized()) {
      console.log("Firebase not initialized, cannot load transfers");
      setIsLoadingTransfers(false);
      return;
    }

    try {
      setIsLoadingTransfers(true);
      console.log("Loading pending transfers from Firebase...");

      const transfersData = await firebaseService.getCollection("transfers");
      const pendingTransfers = transfersData
        .filter((t: any) => t.status === "in-transit" || t.status === "pending")
        .map((t: any) => ({
          ...t,
          items:
            t.products?.map((product: any, index: number) => ({
              id: product.id || String(index),
              productName: product.name,
              sku: product.sku || `SKU-${product.id}`,
              expectedQuantity: product.quantity,
              receivedQuantity: 0,
              hasDiscrepancy: false,
              notes: "",
            })) || [],
        }));

      setTransfers(pendingTransfers);
      console.log(`Loaded ${pendingTransfers.length} pending transfers`);

      // If no transfer is selected and we have transfers, select the first one
      if (!transfer && pendingTransfers.length > 0) {
        setTransfer(pendingTransfers[0]);
        setSelectedTransfer(pendingTransfers[0]);
      }
    } catch (error) {
      console.error("Error loading transfers:", error);
      Alert.alert("Error", "Failed to load transfers. Please try again.");
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const updateReceivedQuantity = (itemId: string, quantity: number) => {
    if (!transfer) return;

    setTransfer((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const hasDiscrepancy = quantity !== item.expectedQuantity;
          return { ...item, receivedQuantity: quantity, hasDiscrepancy };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    if (!transfer) return;

    setTransfer((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, notes };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const hasAnyDiscrepancies =
    transfer?.items.some((item) => item.hasDiscrepancy) || false;

  const confirmReceipt = async () => {
    if (!transfer || !firebaseService.isInitialized()) {
      Alert.alert("Error", "Cannot process transfer at this time.");
      return;
    }

    try {
      setIsLoading(true);
      const status = hasAnyDiscrepancies ? "partially-received" : "received";

      console.log(
        `Processing transfer receipt: ${transfer.id} with status: ${status}`,
      );

      // Update transfer status in Firebase
      await firebaseService.updateDocument("transfers", transfer.id, {
        status: status,
        receivedAt: new Date().toISOString(),
        receivedBy: user?.uid || "unknown",
        receivedItems: transfer.items.map((item) => ({
          productId: item.id,
          expectedQuantity: item.expectedQuantity,
          receivedQuantity: item.receivedQuantity,
          hasDiscrepancy: item.hasDiscrepancy,
          notes: item.notes,
        })),
        updatedAt: new Date().toISOString(),
      });

      // Update inventory stock levels
      const transferProducts = transfer.items
        .filter((item) => item.receivedQuantity > 0)
        .map((item) => ({
          id: item.id,
          quantity: item.receivedQuantity,
        }));

      if (transferProducts.length > 0) {
        console.log(`Updating stock for ${transferProducts.length} products`);
        await updateStockForTransfer(
          transferProducts,
          transfer.sourceLocation,
          transfer.destinationLocation,
        );
      }

      Alert.alert(
        "Success",
        hasAnyDiscrepancies
          ? "Transfer partially received. Inventory has been updated with received quantities."
          : "Transfer received successfully. Inventory has been updated.",
        [
          {
            text: "OK",
            onPress: () => {
              if (onComplete) {
                onComplete(transfer.id, status);
              }
              // Reload transfers to refresh the list
              loadPendingTransfers();
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error confirming receipt:", error);
      Alert.alert(
        "Error",
        "Failed to process transfer receipt. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const allItemsVerified =
    transfer?.items.every((item) => item.receivedQuantity > 0) || false;

  const selectTransfer = (selectedTransfer: Transfer) => {
    setTransfer(selectedTransfer);
    setSelectedTransfer(selectedTransfer);
    setIsReviewMode(false);
    setExpandedItems({});
  };

  if (isLoadingTransfers) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <RefreshCw size={32} color="#3b82f6" />
        <Text className="mt-2 text-gray-600">Loading transfers...</Text>
      </View>
    );
  }

  if (!transfer && transfers.length === 0) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Package size={48} color="#9ca3af" />
        <Text className="text-lg font-medium text-gray-600 mt-4 text-center">
          No Pending Transfers
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          There are no transfers waiting to be received.
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
          onPress={loadPendingTransfers}
        >
          <Text className="text-white font-medium">Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!transfer) {
    return (
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold mb-2">
            Select Transfer to Receive
          </Text>
          <Text className="text-gray-600">
            Choose a transfer from the list below:
          </Text>
        </View>
        <ScrollView className="flex-1">
          {transfers.map((t) => (
            <TouchableOpacity
              key={t.id}
              className="p-4 border-b border-gray-100"
              onPress={() => selectTransfer(t)}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-medium text-blue-800">{t.id}</Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    From: {t.sourceLocationName || t.sourceLocation}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    To: {t.destinationLocationName || t.destinationLocation}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {t.products?.length || 0} items • Created:{" "}
                    {new Date(t.dateCreated).toLocaleDateString()}
                  </Text>
                </View>
                <View className="bg-orange-100 px-3 py-1 rounded-full">
                  <Text className="text-orange-800 text-xs font-medium">
                    {t.status.replace("-", " ")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Transfer Header */}
      <View className="bg-blue-50 p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-lg font-bold text-blue-800">
              {transfer.id}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              From: {transfer.sourceLocationName || transfer.sourceLocation}
            </Text>
            <Text className="text-sm text-gray-600">
              To:{" "}
              {transfer.destinationLocationName || transfer.destinationLocation}
            </Text>
          </View>
          <View>
            <View className="bg-blue-100 px-3 py-1 rounded-full mb-2">
              <Text className="text-blue-800 font-medium text-xs">
                {transfer.status.replace("-", " ")}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-gray-200 px-3 py-1 rounded-full"
              onPress={() => setTransfer(null)}
            >
              <Text className="text-gray-700 text-xs">Change Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center mt-3">
          <Truck size={16} color="#1e40af" />
          <Text className="ml-2 text-sm text-gray-700">
            Created on {new Date(transfer.dateCreated).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {isReviewMode ? (
        <ScrollView className="flex-1 p-4">
          <Text className="text-xl font-bold mb-4">Review Transfer</Text>

          {hasAnyDiscrepancies && (
            <View className="bg-amber-50 p-4 rounded-lg mb-4 flex-row items-center">
              <AlertCircle size={20} color="#b45309" />
              <Text className="ml-2 text-amber-800 flex-1">
                There are discrepancies in this transfer. Please review before
                confirming.
              </Text>
            </View>
          )}

          {transfer.items.map((item) => (
            <View
              key={item.id}
              className="border border-gray-200 rounded-lg mb-3 p-3"
            >
              <View className="flex-row justify-between">
                <Text className="font-medium">{item.productName}</Text>
                {item.hasDiscrepancy ? (
                  <View className="bg-amber-100 px-2 py-0.5 rounded">
                    <Text className="text-amber-800 text-xs">Discrepancy</Text>
                  </View>
                ) : (
                  <View className="bg-green-100 px-2 py-0.5 rounded">
                    <Text className="text-green-800 text-xs">Verified</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 text-xs mt-1">{item.sku}</Text>

              <View className="flex-row justify-between mt-2">
                <Text>Expected: {item.expectedQuantity}</Text>
                <Text>Received: {item.receivedQuantity}</Text>
              </View>

              {item.notes && (
                <View className="mt-2 bg-gray-50 p-2 rounded">
                  <Text className="text-xs text-gray-700">{item.notes}</Text>
                </View>
              )}
            </View>
          ))}

          <View className="flex-row justify-between mt-4 mb-8">
            <TouchableOpacity
              className="bg-gray-200 px-6 py-3 rounded-lg"
              onPress={() => setIsReviewMode(false)}
            >
              <Text className="text-gray-800 font-medium">Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-6 py-3 rounded-lg ${allItemsVerified && !isLoading ? "bg-blue-600" : "bg-gray-300"}`}
              onPress={confirmReceipt}
              disabled={!allItemsVerified || isLoading}
            >
              <Text
                className={`font-medium ${allItemsVerified && !isLoading ? "text-white" : "text-gray-500"}`}
              >
                {isLoading ? "Processing..." : "Confirm Receipt"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 p-4">
          <Text className="text-xl font-bold mb-4">Verify Received Items</Text>

          {transfer.items.map((item) => (
            <View
              key={item.id}
              className="border border-gray-200 rounded-lg mb-3 overflow-hidden"
            >
              <TouchableOpacity
                className="flex-row justify-between items-center p-3 bg-gray-50"
                onPress={() => toggleItemExpand(item.id)}
              >
                <View className="flex-1">
                  <Text className="font-medium">{item.productName}</Text>
                  <Text className="text-gray-500 text-xs">{item.sku}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="mr-2 text-gray-700">
                    Expected: {item.expectedQuantity}
                  </Text>
                  {expandedItems[item.id] ? (
                    <ChevronUp size={20} color="#4b5563" />
                  ) : (
                    <ChevronDown size={20} color="#4b5563" />
                  )}
                </View>
              </TouchableOpacity>

              {expandedItems[item.id] && (
                <View className="p-3 bg-white">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-700">Received Quantity:</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
                      <TouchableOpacity
                        className="bg-gray-100 px-3 py-2"
                        onPress={() => {
                          if (item.receivedQuantity > 0) {
                            updateReceivedQuantity(
                              item.id,
                              item.receivedQuantity - 1,
                            );
                          }
                        }}
                      >
                        <Text className="font-bold">-</Text>
                      </TouchableOpacity>

                      <TextInput
                        className="w-12 text-center"
                        keyboardType="numeric"
                        value={item.receivedQuantity.toString()}
                        onChangeText={(text) => {
                          const quantity = parseInt(text) || 0;
                          updateReceivedQuantity(item.id, quantity);
                        }}
                      />

                      <TouchableOpacity
                        className="bg-gray-100 px-3 py-2"
                        onPress={() =>
                          updateReceivedQuantity(
                            item.id,
                            item.receivedQuantity + 1,
                          )
                        }
                      >
                        <Text className="font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {item.hasDiscrepancy && (
                    <View className="mb-3">
                      <Text className="text-amber-700 mb-1">
                        Please note any discrepancies:
                      </Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg p-2 h-20"
                        multiline
                        placeholder="Enter notes about missing or damaged items"
                        value={item.notes}
                        onChangeText={(text) => updateItemNotes(item.id, text)}
                      />
                    </View>
                  )}

                  <View className="flex-row items-center">
                    {item.receivedQuantity > 0 ? (
                      <View className="flex-row items-center">
                        <Check size={16} color="#16a34a" />
                        <Text className="ml-1 text-green-600">Verified</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <X size={16} color="#dc2626" />
                        <Text className="ml-1 text-red-600">Not verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            className={`mt-4 mb-8 p-4 rounded-lg flex-row justify-center items-center ${allItemsVerified && !isLoading ? "bg-blue-600" : "bg-gray-300"}`}
            onPress={() => setIsReviewMode(true)}
            disabled={!allItemsVerified || isLoading}
          >
            <ClipboardCheck
              size={20}
              color={allItemsVerified && !isLoading ? "#ffffff" : "#9ca3af"}
            />
            <Text
              className={`ml-2 font-medium ${allItemsVerified && !isLoading ? "text-white" : "text-gray-500"}`}
            >
              {isLoading ? "Processing..." : "Review & Confirm"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default ReceiveTransfer;
