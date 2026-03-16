export const mofitnessDarkMapStyle = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#111111" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1A1A1A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0D2035" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0A1A0A" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4A4A4A" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0A0A0A" }],
  },
] as const;
