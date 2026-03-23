import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import 'leaflet/dist/leaflet.css';
import './EventMap.css';

// Fix per le icone di default di Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente interno per gestire l'auto-fit dei bordi
const ChangeView = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
};

const EventMap = ({ mapPolyline }) => {
  // Decodifica la polilinea di Strava in coordinate [lat, lng]
  const coordinates = useMemo(() => {
    if (!mapPolyline) return [];
    try {
      return polyline.decode(mapPolyline);
    } catch (e) {
      console.error("Errore decodifica polyline:", e);
      return [];
    }
  }, [mapPolyline]);

  const bounds = useMemo(() => {
    if (coordinates.length === 0) return null;
    return L.latLngBounds(coordinates);
  }, [coordinates]);

  if (coordinates.length === 0) {
    return (
      <div className="map-error">
        <p>Dati mappa non disponibili per questo evento.</p>
      </div>
    );
  }

  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];

  return (
    <div className="event-map-wrapper">
      <MapContainer 
        center={startPoint} 
        zoom={13} 
        scrollWheelZoom={false}
        className="leaflet-container-custom"
      >
        {/* Tile Layer Dark Mode (CartoDB) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <Polyline 
          positions={coordinates} 
          pathOptions={{ color: '#fc4c02', weight: 4, opacity: 0.8 }} 
        />
        
        <Marker position={startPoint}>
          <Popup>Partenza 🚩</Popup>
        </Marker>

        <Marker position={endPoint}>
          <Popup>Arrivo 🏁</Popup>
        </Marker>

        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
};

export default EventMap;
