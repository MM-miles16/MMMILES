// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function hashOTP(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
    }

    // Get latest OTP
    const { data: records, error } = await supabase
      .from("otp_events")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !records?.length) {
      return NextResponse.json({ error: "No OTP found" }, { status: 400 });
    }

    const record = records[0];

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    if (hashOTP(otp) !== record.otp_hash) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (record.consumed) {
      return NextResponse.json({ error: "OTP already used" }, { status: 400 });
    }

    // Mark OTP consumed
    await supabase.from("otp_events").update({ consumed: true }).eq("id", record.id);

    // Update user record
    await supabase
      .from("users")
      .update({ verified: true, last_login: new Date().toISOString() })
      .eq("phone", phone);

    // Generate Supabase-compatible JWT
    const token = jwt.sign(
      {
        aud: "authenticated",
        role: "authenticated",
        sub: phone,
        phone_number: phone,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      process.env.SUPABASE_JWT_SECRET!
    );

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      token,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
