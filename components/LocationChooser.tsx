import React from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import { X, MapPin, Package } from "lucide-react-native";

interface Location {
  id: string;
  name: string;
  type?: string;
}

interface LocationChooserProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: Location) => void;
  locations: Location[];
  title: string;
  excludeLocationId?: string; // For destination selection, exclude source location
}

const LocationChooser = ({
  visible,
  onClose,
  onLocationSelected,
  locations,
  title,
  excludeLocationId,
}: LocationChooserProps) => {
  const filteredLocations = excludeLocationId
    ? locations.filter((location) => location.id !== excludeLocationId)
    : locations;

  const handleSelectLocation = (location: Location) => {
    onLocationSelected(location);
    onClose();
  };

  const getLocationIcon = (type?: string) => {
    if (type === "warehouse") {
      return <Package size={20} color="#6b7280" />;
    } else if (type === "store") {
      return <MapPin size={20} color="#6b7280" />;
    }
    return <MapPin size={20} color="#6b7280" />;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white w-[90%] max-w-md rounded-lg p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {filteredLocations.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500 text-center">
                No locations available
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center p-4 border-b border-gray-200"
                  onPress={() => handleSelectLocation(item)}
                >
                  <View className="mr-3">{getLocationIcon(item.type)}</View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {item.name}
                    </Text>
                    {item.type && (
                      <Text className="text-sm text-gray-500 capitalize">
                        {item.type}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default LocationChooser;
