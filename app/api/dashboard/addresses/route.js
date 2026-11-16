// /api/dashboard/addresses
// GET  — the user's saved addresses (default first)
// POST — { label, address, landmark?, isDefault? } add one (the first address becomes the default)
import { NextResponse } from "next/server";
import { currentUser, failed, notSetUp, setUpLater, unauthorized } from "@/lib/dashboardServer";
import { clean, insertAddress, listAddresses, makeDefault, MAX_ADDRESSES, view } from "@/lib/addresses";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { data, error } = await listAddresses(user.sub);
  if (notSetUp(error)) return setUpLater();
  if (error) return failed();
  return NextResponse.json({ addresses: data.map(view), max: MAX_ADDRESSES });
}

export async function POST(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return failed("Invalid request.", 400);
  }
  const { value, error: invalid } = clean(body);
  if (invalid) return failed(invalid, 400);

  const existing = await listAddresses(user.sub);
  if (notSetUp(existing.error)) return setUpLater();
  if (existing.error) return failed();
  if (existing.data.length >= MAX_ADDRESSES) return failed(`You can save up to ${MAX_ADDRESSES} addresses.`, 400);

  const inserted = await insertAddress(user.sub, value);
  if (inserted.error) {
    console.error("address save failed:", inserted.error.message);
    return failed();
  }
  if (body?.isDefault || existing.data.length === 0) {
    const err = await makeDefault(user.sub, inserted.data.id);
    if (err) console.error("default address not set:", err.message);
  }
  const { data } = await listAddresses(user.sub);
  return NextResponse.json({ ok: true, addresses: (data || []).map(view), max: MAX_ADDRESSES });
}
