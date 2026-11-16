// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { recordReferral } from "@/lib/referrals";

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

    // SECURITY: Validate OTP format (only digits, correct length)
    const otpLength = Number(process.env.OTP_LENGTH || 4);
    const otpRegex = new RegExp(`^[0-9]{${otpLength}}$`);
    if (!otpRegex.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
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

    // Already used?
    if (record.consumed) {
      return NextResponse.json({ error: "OTP already used" }, { status: 400 });
    }

    // Validate OTP hash with 3-strikes lock
    if (hashOTP(otp) !== record.otp_hash) {
      (global as any).otpAttempts = (global as any).otpAttempts || {};
      const attempts = ((global as any).otpAttempts[record.id] || 0) + 1;
      (global as any).otpAttempts[record.id] = attempts;

      if (attempts >= 3) {
        // Lock OTP permanently in DB by marking consumed
        await supabase.from("otp_events").update({ consumed: true }).eq("id", record.id);
        delete (global as any).otpAttempts[record.id];
        return NextResponse.json({ 
          error: "Invalid OTP. This verification code has been locked due to too many failed attempts." 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        error: `Invalid OTP. ${3 - attempts} attempt(s) remaining.` 
      }, { status: 400 });
    }

    // Success - clear rate limit tracking
    if ((global as any).otpAttempts) {
      delete (global as any).otpAttempts[record.id];
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

    // 3️⃣ Create user if not exists (edge case: send-otp already upserts, but guard anyway)
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

    // Detect first-time login: send-otp upserts the user row BEFORE OTP verification,
    // so checking "if (!user)" is unreliable. Instead, check last_login — it's only set
    // here in verify-otp AFTER successful verification. A NULL last_login means the user
    // has never completed a login before.
    const isFirstTimeLogin = user.last_login === null || user.last_login === undefined;

    // 4️⃣ Update user row
    await supabase
      .from("users")
      .update({
        verified: true,
        last_login: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 5️⃣ Construct correct Supabase-compatible JWT
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        aud: "authenticated",
        role: "authenticated",
        sub: user.id, // REAL UUID (enables auth.uid())
        phone_number: user.phone,
        iat: now,
        exp: now + 7 * 24 * 60 * 60, // 7 days expiration
      },
      process.env.SUPABASE_JWT_SECRET!
    );

    const response = NextResponse.json({
      success: true,
      token, // Keep token in body for client backward compatibility
      user_id: user.id,
      phone: user.phone,
      message: "OTP verified successfully",
    });

    // Set secure HttpOnly cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Referral: a first login that arrived through mmmiles.com/?ref=CODE (never blocks login)
    if (isFirstTimeLogin) {
      const refCode = (req.headers.get("cookie") || "").match(/(?:^|;\s*)mm_ref=([A-Za-z0-9]{6,12})/)?.[1];
      if (refCode) {
        try {
          await recordReferral(supabase, refCode, user.id);
        } catch (refErr) {
          console.error("Referral capture error:", refErr);
        }
        response.cookies.delete("mm_ref");
      }
    }

    // 6️⃣ Send Marketing Welcome Message for First-Time Users (Non-blocking)
    if (isFirstTimeLogin) {
      try {
        const markApiKey = process.env.MARKGUPSHUP_API_KEY;
        const markSource = process.env.MARKGUPSHUP_SOURCE;
        const markAppName = process.env.MARKGUPSHUP_APP_NAME;
        const markTemplateId = process.env.MARKGUPSHUP_TEMPLATE_ID;
        
        if (markApiKey && markSource && markTemplateId) {
          const formData = new URLSearchParams();
          formData.append('channel', 'whatsapp');
          formData.append('source', markSource);
          formData.append('destination', phone);
          formData.append('src.name', markAppName || 'MMMilesMarketing');
          formData.append('template', JSON.stringify({
            id: markTemplateId,
            params: []
          }));
          
          fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
            method: 'POST',
            headers: {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/x-www-form-urlencoded',
              'apikey': markApiKey,
            },
            body: formData.toString()
          }).then(async res => {
            if (!res.ok) console.error("Gupshup Marketing failed:", await res.text());
          }).catch(err => console.error("Gupshup Marketing exception:", err));
        }
      } catch (markErr) {
        console.error("Marketing message setup error:", markErr);
      }
    }

    return response;
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
