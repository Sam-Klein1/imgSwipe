// App.js
import React, { useEffect, useState } from "react";
import { View, Text, Dimensions, Button, TouchableOpacity} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SwipeableImage from "./SwipeableImage";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const App = () => {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [images, setImages] = useState([]);
  const [denied, setDenied] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const { width: screenWidth } = Dimensions.get("window");
  const deleteOverlayOpacity = useSharedValue(0);
  const saveOverlayOpacity = useSharedValue(0);

  const getRandomImages = async () => {
    try {
      const { assets } = await MediaLibrary.getAssetsAsync();
      setImages(assets);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const askPermission = async () => {
    if (permissionResponse?.status === "granted") {
      getRandomImages();
    } else {
      const { status, canAskAgain } =
        await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        getRandomImages();
      } else if (!canAskAgain) {
        console.log("Media library permission denied, and cannot ask again.");
        setDenied(true);
      }
    }
  };

  useEffect(() => {
    askPermission();
  }, []);

  const handleSwipeLeft = (item) => {
    setImagesToDelete((prevImagesToDelete) => [...prevImagesToDelete, item]);
    console.log("Swiped left");
  };

  const handleSwipeRight = (item) => {
    console.log("Swiped right");
  };

  const deleteQueuedImages = async () => {
    try {
      if (imagesToDelete.length === 0) {
        console.log("No images to delete");
        return;
      }
      await MediaLibrary.deleteAssetsAsync(imagesToDelete);
      // Clear the list of images to be deleted after successful deletion
      setImagesToDelete([]);
      console.log("Images deleted successfully");
    } catch (error) {
      console.log("Error deleting images:", error);
    }
  };

  const deleteOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: deleteOverlayOpacity.value,
      backgroundColor: "rgba(255, 0, 0, 0.6)", // Light red with 30% opacity
      width: screenWidth, // Cover the entire left screen width
      zIndex: 10, // Ensure the overlay is above the images
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      pointerEvents: "none",
    };
  });

  const saveOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: saveOverlayOpacity.value,
      backgroundColor: "rgba(0, 255, 0, 0.4)", // Light red with 30% opacity
      width: screenWidth, // Cover the entire left screen width
      zIndex: 10, // Ensure the overlay is above the images
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      pointerEvents: "none",
    };
  });

  return (
    <GestureHandlerRootView className="flex-1 bg-blue-200">
      <StatusBar status="auto" />
      {!denied && images.length > 0 ? (
        <View className="flex-1 justify-center items-center">
          <SwipeableImage
            images={images}
            swipeLeft={handleSwipeLeft}
            swipeRight={handleSwipeRight}
            deleteOverlayOpacity={deleteOverlayOpacity}
            saveOverlayOpacity={saveOverlayOpacity}
            imagesToDelete={imagesToDelete}
            setImagesToDelete={setImagesToDelete}
          />

          {/* Boundaries */}
          <Animated.View style={deleteOverlayStyle} />
          <Animated.View style={saveOverlayStyle} />

          {/* Delete */}
          <TouchableOpacity className="bg-white border rounded-2xl mt-4 p-2 " onPress={deleteQueuedImages}>
          <Text className="font-bold">Delete All</Text>
          </TouchableOpacity>
          
        </View>
      ) : (
        <Text>
          {denied ? "Access To photos has been denied." : "Loading..."}
        </Text>
      )}
    </GestureHandlerRootView>
  );
};

export default App;
