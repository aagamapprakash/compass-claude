import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapViewProps {
  destination: string;
  className?: string;
}

const destinationCoords: Record<string, [number, number]> = {
  'Tokyo, Japan': [35.6762, 139.6503],
  'Paris, France': [48.8566, 2.3522],
  'Barcelona, Spain': [41.3851, 2.1734],
  'New York City, USA': [40.7128, -74.0060],
  'Swiss Alps, Switzerland': [46.8182, 8.2275],
  'Bali, Indonesia': [-8.3405, 115.0920],
  'London, UK': [51.5074, -0.1278],
  'Rome, Italy': [41.9028, 12.4964],
  'Sydney, Australia': [-33.8688, 151.2093],
  'Dubai, UAE': [25.2048, 55.2708],
};

function getCoordinates(destination: string): [number, number] {
  if (destinationCoords[destination]) {
    return destinationCoords[destination];
  }
  
  const cityName = destination.split(',')[0].trim().toLowerCase();
  for (const [key, coords] of Object.entries(destinationCoords)) {
    if (key.toLowerCase().includes(cityName)) {
      return coords;
    }
  }
  
  return [40.7128, -74.0060];
}

export default function MapView({ destination, className = '' }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const coords = getCoordinates(destination);

    const map = L.map(mapRef.current, {
      center: coords,
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const marker = L.marker(coords).addTo(map);
    marker.bindPopup(destination).openPopup();

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destination]);

  return (
    <div 
      ref={mapRef} 
      className={`h-48 md:h-64 rounded-md ${className}`}
      data-testid="map-view"
    />
  );
}
