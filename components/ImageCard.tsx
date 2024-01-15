import { Image } from "expo-image";
import React, { memo, useMemo } from "react";

const ImageCard = ({ item }) => {

  const source = useMemo(() => ({ uri: item.uri }), [item.uri]);

  return (
    <Image
      source={source}
      key={item.creationTime}
      contentFit="cover"
      className="flex-1 rounded-2xl"
    />
  );
};

export default memo(ImageCard);
