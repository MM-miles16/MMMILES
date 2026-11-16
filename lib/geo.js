// "Use my current location" for address forms (browser only): the device's position, turned into
// a street address with the Google Maps Geocoder (the same Maps key the search bar uses).
// Resolves { address, lat, lng }; rejects with a message that can be shown to the customer.

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ready = () => typeof window !== "undefined" && window.google?.maps?.Geocoder;

function loadMaps() {
  if (ready()) return Promise.resolve(true);
  if (!KEY) return Promise.resolve(false);
  return new Promise((resolve) => {
    // Another part of the site may already be loading the Maps script: wait for it
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&loading=async`;
      script.async = true;
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
    const started = Date.now();
    const poll = setInterval(() => {
      if (ready()) {
        clearInterval(poll);
        resolve(true);
      } else if (Date.now() - started > 10000) {
        clearInterval(poll);
        resolve(false);
      }
    }, 120);
  });
}

function position() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser can't share your location. Please type your address."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === 1
              ? "Location access is turned off. Allow it for this site in your browser, or type your address."
              : err.code === 3
                ? "Finding your location took too long. Please try again, or type your address."
                : "We couldn't find your location. Please type your address."
          )
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

export async function currentAddress() {
  const [coords, mapsReady] = await Promise.all([position(), loadMaps()]);
  if (!mapsReady) throw new Error("We found you, but couldn't look up the street address. Please type it.");
  const results = await new Promise((resolve) => {
    new window.google.maps.Geocoder().geocode({ location: coords }, (res, status) => resolve(status === "OK" ? res : []));
  });
  // Prefer a real street address over a plus code
  const best = results.find((r) => !r.types?.includes("plus_code")) || results[0];
  if (!best?.formatted_address) throw new Error("We found you, but couldn't read the street address. Please type it.");
  return { address: best.formatted_address.replace(/,\s*India$/i, ""), ...coords };
}
