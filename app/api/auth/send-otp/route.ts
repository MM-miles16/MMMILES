// app/api/auth/send-otp/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function hashOTP(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOTP(): string {
  const length = Number(process.env.OTP_LENGTH || 4); // default 4 digits
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 🔹 generate OTP based on env config
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 min expiry

    // upsert user record (create if not exists)
    await supabase.from('users').upsert({ phone }, { onConflict: 'phone' });

    // insert OTP entry
    await supabase.from('otp_events').insert({
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt
    });

    // (for now) show OTP in console
    console.log(`🔹 OTP for ${phone}: ${otp}`);

    return NextResponse.json({ success: true, message: 'OTP generated successfully',otp });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
