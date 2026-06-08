/**
 * Calculates the distance between two points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const calculateHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;
  // Logistics Adjustment: 
  // Straight line (great-circle) distance is always shorter than road distance.
  // A factor of 1.25 is a standard industry approximation for road winding.
  const roadDistance = straightLineDistance * 1.25;

  return parseFloat(roadDistance.toFixed(2));
};

module.exports = { calculateHaversine };