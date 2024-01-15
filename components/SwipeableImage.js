import { useState, useEffect } from "react";
import { Dimensions, View, TouchableOpacity, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  runOnJS,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

const ROTATION_ANGLE = 30;

const formatEpochTime = (epochTime) => {
  const date = new Date(epochTime); // Remove the * 1000

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayOfWeek = daysOfWeek[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  const formattedDate = `${dayOfWeek} ${month} ${day}, ${year}, at ${
    hours % 12
  }:${String(minutes).padStart(2, "0")} ${ampm}`;

  return formattedDate;
};

const SwipeableImage = ({
  images,
  swipeLeft,
  swipeRight,
  deleteOverlayOpacity,
  saveOverlayOpacity,
  setImagesToDelete,
  renderItem
}) => {
  const { width: screenWidth } = Dimensions.get("window");

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const tapStartX = useSharedValue(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = images[currentIndex];
  const [nextIndex, setNextIndex] = useState(currentIndex+1);
  const nextItem = images[nextIndex];

  const hiddenTranslateX = 2 * screenWidth;

  const rewind = () => {
    // Ensure currentIndex is not at the first image
    if (currentIndex > 0) {
      // Remove the last item from imagesToDelete
      setImagesToDelete((prevImagesToDelete) =>
        prevImagesToDelete.slice(0, -1)
      );

      translateY.value = withSpring(-1000, {}, () => {
        runOnJS(setCurrentIndex)(currentIndex - 1);
      });
    }
  };

  const queueDelete = () => {
    setImagesToDelete((prevImagesToDelete) => [
      ...prevImagesToDelete,
      currentItem,
    ]);
    deleteOverlayOpacity.value = withTiming(0.3);
    springImage(-1);

    // Delay the setting of deleteOverlayOpacity to 0
    setTimeout(() => {
      deleteOverlayOpacity.value = withTiming(0);
    }, 500);
  };

  const save = () => {
    saveOverlayOpacity.value = withTiming(0.3);
    springImage(1);
    setTimeout(() => {
      saveOverlayOpacity.value = withTiming(0);
    }, 500);
  };

  const springImage = (velocityX) => {
    translateX.value = withSpring(
      Math.sign(velocityX) * hiddenTranslateX,
      {},
      () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
      }
    );
  };

  const drag = Gesture.Pan()
    .onStart((event) => {
      // Record the initial tap position
      tapStartX.value = event.x;
    })
    .onChange((event) => {
      translateX.value += event.changeX;
      translateY.value += event.changeY;

      const center_x = tapStartX.value + event.translationX;

      // Check if the center_x is over the left boundary
      if (center_x < screenWidth * 0.25) {
        // OTouchableOpacity the left side in red
        deleteOverlayOpacity.value = withTiming(0.4); // Animate in with 40% opacity
      } else deleteOverlayOpacity.value = withTiming(0);

      // Check if the center_x is over the right boundary
      if (center_x > screenWidth * 0.65) {
        // OTouchableOpacity the right side in blue
        saveOverlayOpacity.value = withTiming(0.4);
      } else saveOverlayOpacity.value = withTiming(0);
    })
    .onEnd((event) => {
      const center_x = tapStartX.value + event.translationX;

      if (center_x < screenWidth * 0.25) {
        runOnJS(swipeLeft)(currentItem);
        translateX.value = withSpring(
          Math.sign(event.velocityX) * hiddenTranslateX,
          {},
          () => {
            runOnJS(setCurrentIndex)(currentIndex + 1);
          }
        );
        deleteOverlayOpacity.value = withTiming(0, { duration: 1500 });
        return;
      }

      if (center_x > screenWidth * 0.65) {
        runOnJS(swipeRight)(currentItem);
        translateX.value = withSpring(
          Math.sign(event.velocityX) * hiddenTranslateX,
          {},
          () => {
            runOnJS(setCurrentIndex)(currentIndex + 1);
          }
        );
        saveOverlayOpacity.value = withTiming(0, { duration: 1500 });
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const rotate = useDerivedValue(
    () =>
      interpolate(
        translateX.value,
        [0, hiddenTranslateX],
        [0, ROTATION_ANGLE]
      ) + "deg"
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
        {
          rotate: rotate.value,
        },
      ],
    };
  });

  const nextItemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [-hiddenTranslateX, 0, hiddenTranslateX],
          [1, 0.8, 1]
        ),
      },
    ],
    opacity: interpolate(
      translateX.value,
      [-hiddenTranslateX, 0, hiddenTranslateX],
      [1, 0.6, 1]
    ),
  }));

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 0 }
    );
    translateY.value = withTiming(0, { duration: 0 }, () =>
    runOnJS(setNextIndex)(currentIndex + 1))
  }, [currentIndex]);

  return (
    <View className="w-full">
      {!images[currentIndex] ? (
        <View className="h-[75%] items-center justify-center">
          <Text className="text-2xl">No more images!</Text>
        </View>
      ) : (
        <>
          {/* Metadata */}
          <View className="flex-row items-center justify-center">
            <Text className="font-bold">Taken on:</Text>
            <Text className="p-4">
              {formatEpochTime(images[currentIndex].creationTime)}
            </Text>
          </View>
          <View className="w-5/6 h-[75%] z-10 self-center">
            {nextItem && (
              <Animated.View
                className="flex-1 bottom-0 left-0 absolute right-0 top-0 border rounded-2xl"
                style={nextItemAnimatedStyle}
                key={currentIndex + 1}
              >
                {renderItem(nextItem, currentIndex+1)}
              </Animated.View>
            )}
            {currentItem && (
              <GestureDetector gesture={drag}>
                <Animated.View
                  className="flex-1 w-full border rounded-2xl"
                  style={animatedStyle}
                >
                  {renderItem(currentItem, currentIndex)}
                </Animated.View>
              </GestureDetector>
            )}
          </View>
          <View className="flex-1 flex-row items-center justify-center space-x-4 mt-2">
            <TouchableOpacity
              onPress={queueDelete}
              className="rounded-full w-24 h-24 border items-center justify-center bg-gray-300"
            >
              <Text className="text-4xl">❌</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={rewind}
              className="rounded-full w-20 h-20 border self-end items-center justify-center bg-gray-400"
            >
              <Text className="text-5xl top-1">{"\u21BA"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={save}
              className="rounded-full w-24 h-24 border items-center justify-center bg-gray-300"
            >
              <Text className="text-6xl text-green-500 top-1">✓</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default SwipeableImage;
