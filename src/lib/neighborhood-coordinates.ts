 // Neighborhood coordinates for proximity-based detection (5km radius)
 // Coordinates represent approximate center of each neighborhood
 
 export interface NeighborhoodCoord {
   name: string;
   lat: number;
   lng: number;
 }
 
 export interface CityCoordinates {
   city: string;
   countryCode: string;
   neighborhoods: NeighborhoodCoord[];
 }
 
 // Haversine formula to calculate distance between two points in km
 export function calculateDistanceKm(
   lat1: number,
   lng1: number,
   lat2: number,
   lng2: number
 ): number {
   const R = 6371; // Earth's radius in km
   const dLat = toRad(lat2 - lat1);
   const dLng = toRad(lng2 - lng1);
   const a =
     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
     Math.sin(dLng / 2) * Math.sin(dLng / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
 }
 
 function toRad(deg: number): number {
   return deg * (Math.PI / 180);
 }
 
 // Find the nearest neighborhood within a given radius
 export function findNearestNeighborhood(
   lat: number,
   lng: number,
   countryCode: string,
   cityName: string,
   maxRadiusKm: number = 5
 ): { neighborhood: string; distance: number } | null {
   const cityData = NEIGHBORHOOD_COORDINATES.find(
     c => c.countryCode === countryCode && c.city === cityName
   );
   
   if (!cityData || !cityData.neighborhoods.length) {
     return null;
   }
   
   let nearest: { neighborhood: string; distance: number } | null = null;
   
   for (const hood of cityData.neighborhoods) {
     const distance = calculateDistanceKm(lat, lng, hood.lat, hood.lng);
     if (distance <= maxRadiusKm) {
       if (!nearest || distance < nearest.distance) {
         nearest = { neighborhood: hood.name, distance };
       }
     }
   }
   
   return nearest;
 }
 
 // Luanda neighborhoods with approximate coordinates
 export const NEIGHBORHOOD_COORDINATES: CityCoordinates[] = [
   {
     city: 'Luanda',
     countryCode: 'AO',
     neighborhoods: [
       // Central Luanda
       { name: 'Mutamba', lat: -8.8147, lng: 13.2302 },
       { name: 'Maianga', lat: -8.8283, lng: 13.2344 },
       { name: 'Maculusso', lat: -8.8225, lng: 13.2389 },
       { name: 'Vila Alice', lat: -8.8308, lng: 13.2456 },
       { name: 'Alvalade', lat: -8.8356, lng: 13.2522 },
       { name: 'Prenda', lat: -8.8419, lng: 13.2406 },
       { name: 'Rocha Pinto', lat: -8.8364, lng: 13.2267 },
       { name: 'Sambizanga', lat: -8.8083, lng: 13.2411 },
       { name: 'Rangel', lat: -8.8217, lng: 13.2533 },
       { name: 'Marçal', lat: -8.8142, lng: 13.2478 },
       { name: 'São Paulo', lat: -8.8194, lng: 13.2189 },
       
       // Southern Luanda
        { name: 'Talatona', lat: -8.917, lng: 13.183 }, // Wikipedia official
        { name: 'Morro Bento', lat: -8.8954, lng: 13.2045 }, // Yandex verified
       { name: 'Benfica', lat: -8.8833, lng: 13.2167 },
       { name: 'Camama', lat: -8.8917, lng: 13.2333 },
        { name: 'Kilamba', lat: -9.000, lng: 13.267 }, // Wikipedia official (Quilamba)
        { name: 'Lar do Patriota', lat: -8.915, lng: 13.188 },
       { name: 'Golf 2', lat: -8.8750, lng: 13.2000 },
       { name: 'Zona Verde', lat: -8.8833, lng: 13.1917 },
       { name: 'Gamek', lat: -8.8694, lng: 13.2028 },
       { name: 'Samba', lat: -8.8500, lng: 13.2167 },
       
       // Eastern Luanda
       { name: 'Cazenga', lat: -8.8000, lng: 13.2833 },
       { name: 'Viana', lat: -8.8833, lng: 13.3667 },
       { name: 'Zango', lat: -8.9333, lng: 13.3500 },
       { name: 'Dangereux', lat: -8.8167, lng: 13.2667 },
     ]
   },
   {
     city: 'Benguela',
     countryCode: 'AO',
     neighborhoods: [
       { name: 'Centro', lat: -12.5763, lng: 13.4055 },
       { name: 'Lobito', lat: -12.3644, lng: 13.5361 },
       { name: 'Catumbela', lat: -12.4319, lng: 13.5472 },
       { name: 'Bairro 11', lat: -12.5800, lng: 13.4100 },
       { name: 'Bairro da Graça', lat: -12.5750, lng: 13.4000 },
     ]
   },
   {
     city: 'Huambo',
     countryCode: 'AO',
     neighborhoods: [
       { name: 'Centro', lat: -12.7761, lng: 15.7394 },
       { name: 'Caála', lat: -12.8500, lng: 15.5667 },
       { name: 'Bailundo', lat: -12.4500, lng: 15.8000 },
       { name: 'Bom Pastor', lat: -12.7800, lng: 15.7350 },
       { name: 'Académica', lat: -12.7700, lng: 15.7450 },
     ]
   },
   {
     city: 'Lubango',
     countryCode: 'AO',
     neighborhoods: [
       { name: 'Centro', lat: -14.9167, lng: 13.5000 },
       { name: 'Huíla', lat: -14.9200, lng: 13.5100 },
       { name: 'Mapunda', lat: -14.9100, lng: 13.4950 },
       { name: 'Lucrécia', lat: -14.9250, lng: 13.5050 },
     ]
   },
 ];
 
 // Check if we have coordinate data for a given city
 export function hasCityCoordinates(countryCode: string, cityName: string): boolean {
   return NEIGHBORHOOD_COORDINATES.some(
     c => c.countryCode === countryCode && c.city === cityName
   );
 }

 // Debug function: Get distances to all neighborhoods in a city
 export function getDistancesToAllNeighborhoods(
   lat: number,
   lng: number,
   countryCode: string,
   cityName: string
 ): { name: string; distance: number }[] {
   const cityData = NEIGHBORHOOD_COORDINATES.find(
     c => c.countryCode === countryCode && c.city === cityName
   );
   
   if (!cityData || !cityData.neighborhoods.length) {
     return [];
   }
   
   return cityData.neighborhoods
     .map(hood => ({
       name: hood.name,
       distance: calculateDistanceKm(lat, lng, hood.lat, hood.lng)
     }))
     .sort((a, b) => a.distance - b.distance);
 }