import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import polyline from '@mapbox/polyline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

// Fix per le icone di Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente interno per gestire lo zoom automatico sui bounds del percorso
const ChangeView = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
};

const RouteMap = ({ encodedPolyline, startLatLng }) => {
  // Decodifica la polyline in un array di coordinate [lat, lng]
  const positions = useMemo(() => {
    if (!encodedPolyline) return [];
    try {
      return polyline.decode(encodedPolyline);
    } catch (err) {
      console.error('Error decoding polyline:', err);
      return [];
    }
  }, [encodedPolyline]);

  if (positions.length === 0) {
    return (
      <div className="map-placeholder-error">
        <p>Incompleto data: Unable to render route map.</p>
      </div>
    );
  }

  // Se non abbiamo startLatLng, usiamo la prima posizione del percorso
  const center = startLatLng || positions[0];

  return (
    <div className="route-map-container">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="leaflet-map-frame"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline 
          positions={positions} 
          pathOptions={{ 
            color: '#fc4c02', // Colore arancione Strava
            weight: 4,
            opacity: 0.8
          }} 
        />
        <ChangeView bounds={positions} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
