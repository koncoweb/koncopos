import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
} from "lucide-react-native";

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
  dateCreated: string;
  status: "pending" | "in-transit" | "received" | "partially-received";
  items: TransferItem[];
}

interface ReceiveTransferProps {
  onComplete?: (transferId: string, status: string) => void;
  transfer?: Transfer;
}

const ReceiveTransfer = ({
  onComplete,
  transfer: propTransfer,
}: ReceiveTransferProps) => {
  const defaultTransfer: Transfer = {
    id: "TR-2023-0542",
    sourceLocation: "Main Warehouse",
    destinationLocation: "Retail Store #12",
    dateCreated: "2023-10-15",
    status: "in-transit",
    items: [
      {
        id: "1",
        productName: "Wireless Headphones",
        sku: "WH-100-BLK",
        expectedQuantity: 10,
        receivedQuantity: 0,
        hasDiscrepancy: false,
        notes: "",
      },
      {
        id: "2",
        productName: "Bluetooth Speaker",
        sku: "BS-200-RED",
        expectedQuantity: 5,
        receivedQuantity: 0,
        hasDiscrepancy: false,
        notes: "",
      },
      {
        id: "3",
        productName: "USB-C Charging Cable",
        sku: "CC-300-WHT",
        expectedQuantity: 20,
        receivedQuantity: 0,
        hasDiscrepancy: false,
        notes: "",
      },
    ],
  };

  const [transfer, setTransfer] = useState<Transfer>(
    propTransfer || defaultTransfer,
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [isReviewMode, setIsReviewMode] = useState(false);

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const updateReceivedQuantity = (itemId: string, quantity: number) => {
    setTransfer((prev) => {
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
    setTransfer((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, notes };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const hasAnyDiscrepancies = transfer.items.some(
    (item) => item.hasDiscrepancy,
  );

  const confirmReceipt = () => {
    const status = hasAnyDiscrepancies ? "partially-received" : "received";
    if (onComplete) {
      onComplete(transfer.id, status);
    }
  };

  const allItemsVerified = transfer.items.every(
    (item) => item.receivedQuantity > 0,
  );

  return (
    <View className="flex-1 bg-white">
      {/* Transfer Header */}
      <View className="bg-blue-50 p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-bold text-blue-800">
              {transfer.id}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              From: {transfer.sourceLocation}
            </Text>
            <Text className="text-sm text-gray-600">
              To: {transfer.destinationLocation}
            </Text>
          </View>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-800 font-medium">
              {transfer.status.replace("-", " ")}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mt-3">
          <Truck size={16} color="#1e40af" />
          <Text className="ml-2 text-sm text-gray-700">
            Created on {transfer.dateCreated}
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
              className={`px-6 py-3 rounded-lg ${allItemsVerified ? "bg-blue-600" : "bg-gray-300"}`}
              onPress={confirmReceipt}
              disabled={!allItemsVerified}
            >
              <Text
                className={`font-medium ${allItemsVerified ? "text-white" : "text-gray-500"}`}
              >
                Confirm Receipt
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
            className={`mt-4 mb-8 p-4 rounded-lg flex-row justify-center items-center ${allItemsVerified ? "bg-blue-600" : "bg-gray-300"}`}
            onPress={() => setIsReviewMode(true)}
            disabled={!allItemsVerified}
          >
            <ClipboardCheck
              size={20}
              color={allItemsVerified ? "#ffffff" : "#9ca3af"}
            />
            <Text
              className={`ml-2 font-medium ${allItemsVerified ? "text-white" : "text-gray-500"}`}
            >
              Review & Confirm
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default ReceiveTransfer;
