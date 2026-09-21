import { distanceBetween, geohashQueryBounds } from 'geofire-common';

export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  return distanceBetween([lat1, lon1], [lat2, lon2]); // Retorna la distancia en kilómetros
}

export { geohashQueryBounds };
