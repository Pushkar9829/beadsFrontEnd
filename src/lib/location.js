import api from '../api/client';

export function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new Error('Allow location access to fill your current address.'));
        else if (err.code === 2) reject(new Error('Could not find your current location.'));
        else reject(new Error('Location request timed out. Try again.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
}

export async function detectCurrentAddress() {
  const { lat, lng } = await getBrowserPosition();
  const { data } = await api.get(`/geo/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
  const address = data.address || {};
  if (!address.pincode) {
    address.needsPincode = true;
  }
  return {
    ...address,
    lat,
    lng,
    source: 'gps',
    label: address.label || 'Current location',
  };
}
