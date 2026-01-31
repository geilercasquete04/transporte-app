import MapLibreGL from "@maplibre/maplibre-react-native";
import React from "react";
import { View } from "react-native";

export default function RoutePointMarker({
  id,
  coordinate,
}: {
  id: string;
  coordinate: [number, number];
}) {
  return (
    <MapLibreGL.PointAnnotation id={id} coordinate={coordinate}>
      <View
        style={{
          width: 14,
          height: 14,
          backgroundColor: "#007AFF",
          borderRadius: 7,
          borderWidth: 2,
          borderColor: "white",
        }}
      />
    </MapLibreGL.PointAnnotation>
  );
}
