// GET /api/dashboard/referrals — the user's invite code and link, the friends who joined with it,
// and the ₹200 bonuses earned (one per friend whose first trip is done). Settles any bonuses that
// are due first. Invited friends get the ₹350 first-trip offer every new customer gets.
import { NextResponse } from "next/server";
import { currentUser, db, failed, notSetUp, setUpLater, unauthorized } from "@/lib/dashboardServer";
import { WELCOME_OFF } from "@/lib/offers";
import { ensureReferralCode, listBonuses, REFERRAL_REWARD, settleReferrals } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const client = db();

  let code;
  try {
    code = await ensureReferralCode(client, user.sub);
  } catch (err) {
    if (notSetUp(err)) return setUpLater({ reward: REFERRAL_REWARD, friendOffer: WELCOME_OFF });
    console.error("referral code failed:", err.message);
    return failed();
  }
  await settleReferrals(client, user.sub).catch((err) => console.error("referral settle failed:", err.message));

  const [{ data: rows, error }, { data: mine }] = await Promise.all([
    client.from("referrals").select("referred_id, status, created_at, rewarded_at, referrer_coupon").eq("referrer_id", user.sub).order("created_at", { ascending: false }),
    client.from("referrals").select("status").eq("referred_id", user.sub).maybeSingle(),
  ]);
  if (error) return failed();

  // Friends are shown by first name only
  const ids = rows.map((r) => r.referred_id);
  const { data: names } = ids.length ? await client.from("customers").select("user_id, first_name").in("user_id", ids) : { data: [] };
  const firstName = new Map((names || []).map((n) => [n.user_id, (n.first_name || "").trim()]));

  const bonuses = await listBonuses(client, user.sub, rows).catch((err) => {
    console.error("referral bonuses failed:", err.message);
    return [];
  });
  const rewarded = rows.filter((r) => r.status === "rewarded").length;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  return NextResponse.json({
    reward: REFERRAL_REWARD,
    friendOffer: WELCOME_OFF,
    code,
    link: `${origin.replace(/\/$/, "")}/?ref=${code}`,
    stats: {
      joined: rows.length,
      completed: rewarded,
      earned: rewarded * REFERRAL_REWARD,
      ready: bonuses.filter((b) => !b.used).length,
    },
    bonuses,
    friends: rows.map((r) => ({
      name: firstName.get(r.referred_id) || "A friend",
      status: r.status,
      joinedAt: r.created_at,
      rewardedAt: r.rewarded_at,
    })),
    invitedBy: mine ? { status: mine.status } : null,
  });
}
