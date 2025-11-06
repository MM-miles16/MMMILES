// app/api/auth/utils/whatsapp.ts
import axios from "axios";

export async function sendWhatsAppOTP(phone: string, otp: string) {
  try {
    const { GUPSHUP_API_KEY, GUPSHUP_BASE_URL, GUPSHUP_SOURCE, GUPSHUP_APP_NAME } = process.env;

    if (!GUPSHUP_API_KEY || !GUPSHUP_BASE_URL || !GUPSHUP_SOURCE || !GUPSHUP_APP_NAME) {
      throw new Error("Missing Gupshup environment variables");
    }

    // ✅ build WhatsApp text message body (same as curl)
    const messageBody = JSON.stringify({
      type: "text",
      text: `Your MM Miles OTP is *${otp}*. Valid for 2 minutes.`,
    });

    // ✅ form data like curl
    const payload = new URLSearchParams({
      channel: "whatsapp",
      source: GUPSHUP_SOURCE!,            // your sandbox number like 917834811114
      destination: phone,                 // target phone number (91xxxxxxxxxx)
      message: messageBody,               // the JSON string
      "src.name": GUPSHUP_APP_NAME!,      // your app name (Milesotp)
    });

    // ✅ make API call
    const response = await axios.post(`${GUPSHUP_BASE_URL}/wa/api/v1/msg`, payload.toString(), {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: GUPSHUP_API_KEY!,
      },
    });

    if (response.data?.status === "submitted" || response.data?.status === "success") {
      console.log(`✅ WhatsApp OTP sent successfully to ${phone}`);
      return true;
    } else {
      console.error("❌ Gupshup response:", response.data);
      return false;
    }
  } catch (error: any) {
    console.error("❌ Failed to send WhatsApp OTP:", error.message);
    if (error.response) console.error("Response Data:", error.response.data);
    return false;
  }
}