// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service role key
);

function hashOTP(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch latest OTP record
    const { data: records, error: otpErr } = await supabase
      .from("otp_events")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpErr || !records?.length) {
      return NextResponse.json({ error: "No OTP found" }, { status: 400 });
    }

    const record = records[0];

    // Validate OTP expiry
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // Validate OTP hash
    if (hashOTP(otp) !== record.otp_hash) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Already used?
    if (record.consumed) {
      return NextResponse.json({ error: "OTP already used" }, { status: 400 });
    }

    // Mark consumed
    await supabase
      .from("otp_events")
      .update({ consumed: true })
      .eq("id", record.id);

    // 2️⃣ Fetch existing user
    let { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    // 3️⃣ Create user if not exists
    if (!user) {
      const { data: newUser, error: createErr } = await supabase
        .from("users")
        .insert([{ phone }])
        .select()
        .single();

      if (createErr) {
        console.error("User create error:", createErr);
        return NextResponse.json(
          { error: "Could not create user" },
          { status: 500 }
        );
      }

      user = newUser;
    }

    // 4️⃣ Update user row
    await supabase
      .from("users")
      .update({
        verified: true,
        last_login: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 5️⃣ Construct correct Supabase-compatible JWT
    const token = jwt.sign(
      {
        aud: "authenticated",
        role: "authenticated",
        sub: user.id, // 🔥 MOST IMPORTANT — REAL UUID
        phone_number: user.phone,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      process.env.SUPABASE_JWT_SECRET!
    );

    return NextResponse.json({
      success: true,
      token,
      user_id: user.id,
      phone: user.phone,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
