// One line for delivery: "12 Lake View Road, Chennai, near Tower Park". Used when a saved address
// is copied to the customer's profile (the address delivery uses) from the dashboard or checkout.
// Kept separate from lib/addresses.js, which is server-only.
export function deliveryText(address, landmark) {
  const a = String(address || "").trim();
  const l = String(landmark || "").trim();
  return l ? `${a}, near ${l}` : a;
}
