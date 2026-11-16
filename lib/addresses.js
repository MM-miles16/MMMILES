// Saved addresses (server): validation, listing and the one-default rule. The default address is
// copied to customers.address, which checkout reads.
import { deliveryText } from "./addressText";
import { db } from "./dashboardServer";

export const MAX_ADDRESSES = 10;
const FIELDS = "id, label, address, landmark, is_default, created_at";

export const view = (a) => ({ id: a.id, label: a.label, address: a.address, landmark: a.landmark || "", isDefault: a.is_default, createdAt: a.created_at });

export function clean(body) {
  const label = String(body?.label || "").trim().slice(0, 30);
  const address = String(body?.address || "").trim().slice(0, 300);
  const landmark = String(body?.landmark || "").trim().slice(0, 120);
  if (!label) return { error: "Please choose a label, like Home or Work." };
  if (address.length < 5) return { error: "Please enter the full address." };
  return { value: { label, address, landmark: landmark || null } };
}

export function listAddresses(userId) {
  return db().from("customer_addresses").select(FIELDS).eq("user_id", userId).order("is_default", { ascending: false }).order("created_at", { ascending: false });
}

export async function insertAddress(userId, value) {
  return db().from("customer_addresses").insert({ ...value, user_id: userId, is_default: false }).select(FIELDS).single();
}

// Make one address the default and copy it to the customer profile
export async function makeDefault(userId, id) {
  const unset = await db().from("customer_addresses").update({ is_default: false }).eq("user_id", userId).eq("is_default", true).neq("id", id);
  if (unset.error) return unset.error;
  const set = await db().from("customer_addresses").update({ is_default: true }).eq("user_id", userId).eq("id", id).select("address, landmark").single();
  if (set.error) return set.error;
  await db().from("customers").update({ address: deliveryText(set.data.address, set.data.landmark) }).eq("user_id", userId);
  return null;
}
