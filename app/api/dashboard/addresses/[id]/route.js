// /api/dashboard/addresses/:id
// PATCH  — { label?, address?, landmark?, isDefault? } edit one of the user's addresses
// DELETE — remove it (if it was the default, the newest remaining address becomes the default)
import { NextResponse } from "next/server";
import { currentUser, db, failed, notSetUp, setUpLater, unauthorized } from "@/lib/dashboardServer";
import { clean, listAddresses, makeDefault, MAX_ADDRESSES, view } from "@/lib/addresses";

export const dynamic = "force-dynamic";

async function owned(userId, id) {
  return db().from("customer_addresses").select("id, is_default").eq("user_id", userId).eq("id", id).maybeSingle();
}

async function respond(userId) {
  const { data } = await listAddresses(userId);
  return NextResponse.json({ ok: true, addresses: (data || []).map(view), max: MAX_ADDRESSES });
}

export async function PATCH(request, { params }) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return failed("Invalid request.", 400);
  }

  const found = await owned(user.sub, id);
  if (notSetUp(found.error)) return setUpLater();
  if (found.error) return failed();
  if (!found.data) return failed("Address not found.", 404);

  // Only "make default" — no field changes
  const onlyDefault = body && Object.keys(body).length === 1 && body.isDefault === true;
  if (!onlyDefault) {
    const { value, error: invalid } = clean(body);
    if (invalid) return failed(invalid, 400);
    const updated = await db().from("customer_addresses").update(value).eq("user_id", user.sub).eq("id", id);
    if (updated.error) return failed();
    if (found.data.is_default) await db().from("customers").update({ address: value.address }).eq("user_id", user.sub);
  }
  if (body?.isDefault && !found.data.is_default) {
    const err = await makeDefault(user.sub, Number(id));
    if (err) return failed();
  }
  return respond(user.sub);
}

export async function DELETE(request, { params }) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { id } = await params;

  const found = await owned(user.sub, id);
  if (notSetUp(found.error)) return setUpLater();
  if (found.error) return failed();
  if (!found.data) return failed("Address not found.", 404);

  const removed = await db().from("customer_addresses").delete().eq("user_id", user.sub).eq("id", id);
  if (removed.error) return failed();

  if (found.data.is_default) {
    const { data: rest } = await listAddresses(user.sub);
    if (rest?.length) await makeDefault(user.sub, rest[0].id);
  }
  return respond(user.sub);
}
