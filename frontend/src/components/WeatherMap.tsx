import "leaflet/dist/leaflet.css";

import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { CurrentWeather, Place } from "../api/types";
import { capitalize, placeLabel } from "../utils/format";

// Leaflet's default icon guesses its image URLs at runtime from where
// leaflet.css was loaded, which breaks once Vite bundles the assets.
// Importing the PNGs lets Vite resolve them, so we build the icon ourselves.
const markerIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const WORLD_CENTER: L.LatLngTuple = [20, 0];
const WORLD_ZOOM = 2;
const PLACE_ZOOM = 8;

type Props = {
  place: Place | null;
  /** Weather for `place`, or null while it loads. */
  weather: CurrentWeather | null;
  onPick: (place: Place) => void;
};

export function WeatherMap({ place, weather, onPick }: Props) {
  const position: L.LatLngTuple | null = place ? [place.lat, place.lon] : null;

  return (
    <div className="weather-map card">
      {/* MapContainer reads center/zoom only on mount; later moves go through FlyTo. */}
      <MapContainer
        center={position ?? WORLD_CENTER}
        zoom={position ? PLACE_ZOOM : WORLD_ZOOM}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickOnClick onPick={onPick} />
        {place && position && (
          <>
            <FlyTo lat={place.lat} lon={place.lon} />
            <Marker position={position} icon={markerIcon}>
              <Popup>
                {weather ? <PopupContent place={place} weather={weather} /> : "Cargando clima…"}
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

/** The bridge between React and Leaflet: a prop change becomes an imperative map call. */
function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    // Zoom in if we're looking at the whole world; otherwise keep the user's zoom.
    map.flyTo([lat, lon], Math.max(map.getZoom(), PLACE_ZOOM));
  }, [map, lat, lon]);

  return null;
}

function PickOnClick({ onPick }: { onPick: (place: Place) => void }) {
  useMapEvents({
    click(event) {
      // The world map repeats horizontally, so a click can land on lng 200°.
      // wrap() brings it back into -180..180, which is what the API accepts.
      const { lat, lng } = event.latlng.wrap();
      onPick({ lat, lon: lng });
    },
  });
  return null;
}

function PopupContent({ place, weather }: { place: Place; weather: CurrentWeather }) {
  const { name, country } = placeLabel(place, weather);
  const condition = weather.weather[0];

  return (
    <div className="weather-map__popup">
      <strong>
        {name}
        {country && `, ${country}`}
      </strong>
      <span>
        {Math.round(weather.main.temp)}°C{condition && ` · ${capitalize(condition.description)}`}
      </span>
    </div>
  );
}
