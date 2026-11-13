import { getUserFromRequest } from '../../../lib/auth.js';

function getAuthToken(request) {
  return request.cookies?.get?.("auth_token")?.value || 
         request.headers?.get?.("cookie")?.match(/auth_token=([^;]+)/)?.[1] ||
         request.headers?.get?.("authorization")?.split?.(" ")?.[1] || "";
}
import { calculatePricing } from '../../../lib/pricing.js';

// Razorpay SDK for payment verification
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// POST /api/booking-complete - Handle post-booking tasks like buffer time and lock conversion
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
    }
    const token = getAuthToken(request);

    const { vehicle_id, booking_id, payment_id, expected_amount } = await request.json();

    if (!vehicle_id || !booking_id || !payment_id) {
      return Response.json({
        error: 'vehicle_id, booking_id, and payment_id are required'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Verify booking exists and belongs to user
    const bookingResponse = await fetch(
      `${supabaseUrl}/rest/v1/bookings?id=eq.${booking_id}&user_id=eq.${user.sub}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!bookingResponse.ok) {
      throw new Error('Failed to verify booking');
    }

    const bookings = await bookingResponse.json();
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found or unauthorized' }, { status: 404 });
    }

    const booking = bookings[0];

    // 2. VERIFY PAYMENT INTEGRITY (Security Gold Standard)
    // We fetch the payment AND the associated order from Razorpay to verify against
    // the metadata (notes) we stored securely during the 'create-order' step.
    let rzpOrder = null; // Hoisted so coupon tracking code can access it later
    try {
      // Fetch payment details
      const payment = await razorpay.payments.fetch(payment_id);

      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return Response.json({ error: 'Payment not successful' }, { status: 400 });
      }

      // Fetch the original order to get the tamper-proof metadata (notes)
      rzpOrder = await razorpay.orders.fetch(payment.order_id);
      const notes = rzpOrder.notes || {};

      const paidAmount = payment.amount / 100;
      const serverCalculatedAmount = parseFloat(notes.calculated_total || 0);
      const serverVehicleId = notes.vehicle_id;
      const serverUserId = notes.user_id;

      console.log(`Verifying Payment ${payment_id}:`, {
        paidAmount,
        expectedAmount: serverCalculatedAmount,
        vehicleId: vehicle_id,
        serverVehicleId,
        userId: user.sub,
        serverUserId
      });

      // 1. Verify Amount
      if (Math.abs(paidAmount - serverCalculatedAmount) > 0.01) {
        console.error(`❌ Security Violation: Amount Mismatch. Paid: ${paidAmount}, Expected: ${serverCalculatedAmount}`);
        return Response.json({ error: 'Security violation: Payment amount mismatch' }, { status: 400 });
      }

      // 2. Verify Vehicle ID
      if (serverVehicleId && serverVehicleId.toString() !== vehicle_id.toString()) {
        console.error(`❌ Security Violation: Vehicle Mismatch. Provided: ${vehicle_id}, Expected: ${serverVehicleId}`);
        return Response.json({ error: 'Security violation: Vehicle ID mismatch' }, { status: 400 });
      }

      // 3. Verify User ID
      if (serverUserId && serverUserId.toString() !== user.sub.toString()) {
        console.error(`❌ Security Violation: User Mismatch. Provided: ${user.sub}, Expected: ${serverUserId}`);
        return Response.json({ error: 'Security violation: User mismatch' }, { status: 400 });
      }

      console.log(`✅ Payment verified successfully against server-side order metadata.`);
    } catch (paymentError) {
      console.error('Razorpay verification error:', paymentError);
      return Response.json({ 
        error: 'Failed to verify payment with Razorpay',
        details: paymentError.message 
      }, { status: 400 });
    }

    // 3. Get vehicle details (UPDATED: Fetch all needed fields for notification)
    const vehicleResponse = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle_id}&select=buffer_hours,current_status,make,model,registration_number,city,location_name`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': token ? `Bearer ${token}` : '',
        },
      }
    );

    if (!vehicleResponse.ok) {
      throw new Error('Failed to get vehicle details');
    }

    const vehicles = await vehicleResponse.json();
    if (vehicles.length === 0) {
      return Response.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const vehicle = vehicles[0];
    const bufferHours = vehicle.buffer_hours || 3;

    // 2. Calculate next available time (end_time + buffer_hours)
    const endTime = new Date(booking.end_time);
    const nextAvailable = new Date(endTime.getTime() + (bufferHours * 60 * 60 * 1000));

    // 4. Update vehicle availability with buffer time
    const vehicleUpdateResponse = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          current_status: 'booked',
          next_available: nextAvailable.toISOString(),
          buffer_hours: bufferHours,
          last_status_change: new Date().toISOString(),
          lock_expires_at: null,
          reserved_for_user: null
        })
      }
    );

    if (!vehicleUpdateResponse.ok) {
      throw new Error('Failed to update vehicle availability');
    }

    // 5. Convert active lock to 'converted' status if exists
    const lockUpdateResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?vehicle_id=eq.${vehicle_id}&user_id=eq.${user.sub}&status=eq.active`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'converted',
          expires_at: new Date().toISOString() // Set to current time since it's converted
        })
      }
    );

    if (!lockUpdateResponse.ok) {
      console.warn('Warning: Failed to convert lock status, but booking was successful');
    }

    // 5.5 Update applied_coupon tracking & increment used_count if a coupon was used
    try {
      // Get the verified coupon code explicitly stored in Razorpay notes securely
      const appliedCouponCode = rzpOrder?.notes?.coupon_code;
      console.log('🎫 Coupon tracking: rzpOrder notes =', JSON.stringify(rzpOrder?.notes), 'appliedCouponCode =', appliedCouponCode);
      
      if (appliedCouponCode && appliedCouponCode.trim() !== '') {
        // A. Save it to the booking
        console.log(`🎫 Saving applied_coupon '${appliedCouponCode}' to booking ${booking_id}`);
        const bookingPatchRes = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${booking_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            applied_coupon: appliedCouponCode.trim()
          })
        });
        console.log(`🎫 Booking PATCH response: ${bookingPatchRes.status} ${bookingPatchRes.statusText}`);
        if (!bookingPatchRes.ok) {
          const errText = await bookingPatchRes.text();
          console.error(`🎫 Booking PATCH failed:`, errText);
        }

        // B. Increment the global used_count on the coupons table
        // B. Increment the global used_count via RPC (bypasses RLS)
        await fetch(`${supabaseUrl}/rest/v1/rpc/increment_coupon_usage`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ coupon_code: appliedCouponCode.trim() })
        });
        console.log(`🎫 Coupon used_count incremented via RPC for ${appliedCouponCode}`);
      } else {
        console.log('🎫 No coupon was applied for this booking.');
      }
    } catch (couponUsageErr) {
      console.error('Warning: Failed to log coupon usage or increment used counter', couponUsageErr);
    }

    // 6. Trigger cleanup of any expired locks
    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/cleanup_expired_locks`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
    } catch (cleanupError) {
      console.warn('Warning: Cleanup function failed, but this is non-critical');
    }

    // 7. SEND TELEGRAM NOTIFICATION (Non-blocking)
    try {
      // A. Fetch Customer Details
      const customerResponse = await fetch(
        `${supabaseUrl}/rest/v1/customers?user_id=eq.${user.sub}&select=first_name,last_name,phone`,
        {
          headers: {
             'apikey': supabaseKey,
             'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      const customers = await customerResponse.json();
      const customer = customers?.[0] || { first_name: 'Unknown', last_name: 'User', phone: 'N/A' };
      const customerName = `${customer.first_name} ${customer.last_name}`;
      const customerPhone = customer.phone || 'N/A';

      // B. Format Dates
      // IMPORTANT: We use UTC methods because we store "Face Value" dates (Fake UTC)
      // e.g. stored '2026-02-22T09:00:00Z' means 9:00 AM, so we extract 09:00 via getUTCHours
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        const hour = String(d.getUTCHours()).padStart(2, '0');
        const minute = String(d.getUTCMinutes()).padStart(2, '0');
        return `${day}/${month}/${year}, ${hour}:${minute}`;
      };

      const startTime = formatDate(booking.start_time);
      const endTime = formatDate(booking.end_time);

      // C. Calculate Duration
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / 3600000);
      const durationStr = `${diffHrs} Hours`;

      // D. Breakdown Pricing & Calculate Discount
      // To get exact breakdown of Rental vs Insurance vs ConvFee, we need to recalculate
      // because the DB only stores aggregated 'base_price' (which includes all 3).
      let rentalCost = 0;
      let insuranceCost = 0;
      let convFeeVal = 0;
      let gstVal = 0;
      let totalVal = 0;
      let discountVal = 0;

      try {
        // We need base_daily_rate to recalculate precise breakdown
        const vehicleRateResponse = await fetch(
          `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle_id}&select=base_daily_rate,make,model,registration_number,city,location_name`,
           { headers: { 'apikey': supabaseKey, 'Authorization': request.headers.get('authorization') } }
        );
        const rateData = await vehicleRateResponse.json();
        const baseDailyRate = parseFloat(rateData[0]?.base_daily_rate || 0);

        // Recalculate pricing breakdown
        // We use new Date(booking.start_time) which works because start_time is ISO string
        const pricing = calculatePricing({
          baseDailyRate,
          pickupTime: new Date(booking.start_time),
          returnTime: new Date(booking.end_time),
          discount: 0, // Get base pricing first
          faceValueTimes: true, // bookings store IST clock time as UTC (formatDateTimeForDB)
        });

        rentalCost = pricing.costs.rentalCost;
        insuranceCost = pricing.costs.insuranceCost;
        
        // Use DB values for trusted totals and tax
        convFeeVal = parseFloat(booking.conv_fee || 0);
        gstVal = parseFloat(booking.gst || 0);
        const dbTotal = parseFloat(booking.total_amount || 0);
        
        // Calculate Discount = (Rental + Insurance + Conv + GST) - Total Paid
        const subtotal = rentalCost + insuranceCost + convFeeVal + gstVal;
        discountVal = subtotal - dbTotal;
        if (discountVal < 1) discountVal = 0;
        discountVal = Math.round(discountVal);
        
        totalVal = dbTotal;

      } catch (err) {
        console.error("Pricing breakdown calculation error", err);
        // Fallback to aggregated
        totalVal = parseFloat(booking.total_amount || 0);
        gstVal = parseFloat(booking.gst || 0);
        convFeeVal = parseFloat(booking.conv_fee || 0);
        rentalCost = (parseFloat(booking.base_price || 0) - convFeeVal); 
      }

      // E. Construct Message
      const message = `
🚗 *New Booking Alert* 🚗

*Booking Details*
🆔 *Booking ID:* \`${booking_id}\`
📅 *Start:* \`${startTime}\`
📅 *End:* \`${endTime}\`

*Customer Details*
👤 *Name:* \`${customerName}\`
📞 *Phone:* \`${customerPhone}\`

*Vehicle Details*
🚘 *Car:* \`${vehicle.make} ${vehicle.model}\`
🔢 *Reg No:* \`${vehicle.registration_number}\`
📍 *Car Address:* \`${vehicle.location_name || vehicle.city}\`

*Pricing Breakdown*
⏳ *Duration:* \`${durationStr}\`
💵 *Rental Cost:* \`₹${rentalCost}\`
🛡️ *Insurance:* \`₹${insuranceCost}\`
yi *Conv. Fee:* \`₹${convFeeVal}\`
tax *GST:* \`₹${gstVal}\`
${discountVal > 0 ? `🎫 *Discount:* \`-₹${discountVal}\`\n` : ''}💰 *Total Amount:* \`₹${totalVal}\`
      `.trim();

      // F. Send to Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
          })
        });
        console.log('✅ Telegram notification sent.');
      } else {
        console.warn('⚠️ Telegram config missing. Notification skipped.');
      }

        // 8. SEND WHATSAPP CONFIRMATION VIA GUPSHUP (Non-blocking)
        try {
          const gApiKey = process.env.GUPSHUP_API_KEY;
          const gSource = process.env.GUPSHUP_SOURCE;
          const tId = process.env.BOOKING_COMPLETE_TEMPLETE_ID;

          if (gApiKey && gSource && tId && customerPhone && customerPhone !== 'N/A') {
            // DB already stores '91xxxxxxxxxx' so we just strip any accidental spaces/dashes
            const formattedPhone = customerPhone.replace(/\D/g, '');

            // Set up the exact 5 parameters requested by the user's template
            const waParams = [
              customerName,
              `${vehicle.make} ${vehicle.model} | Pickup: ${startTime} | Return: ${endTime}`,
              booking_id.toString(),
              "MMMiles",
              "MMMiles"
            ];

            // Match the exact payload format used by the working OTP flow
            const formData = new URLSearchParams();
            formData.append('channel', 'whatsapp');
            formData.append('source', gSource);
            formData.append('destination', formattedPhone);
            formData.append('src.name', process.env.GUPSHUP_APP_NAME || 'MMMiles');
            formData.append('template', JSON.stringify({
              id: tId,
              params: waParams
            }));

            const waResponse = await fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
              method: 'POST',
              headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': gApiKey
              },
              body: formData.toString()
            });

            if (waResponse.ok) {
               const waBody = await waResponse.text();
               console.log(`✅ WhatsApp confirmation sent to ${formattedPhone}. Response:`, waBody);
            } else {
               const errText = await waResponse.text();
               console.error(`❌ WhatsApp API Error:`, errText);
            }
          } else {
            console.warn('⚠️ WhatsApp config or customer phone missing. WhatsApp Notification skipped.');
          }
        } catch (waError) {
          console.error('❌ Failed to send WhatsApp notification:', waError);
        }

    } catch (telegramError) {
      console.error('❌ Failed to send Telegram notification (or Fetch customer error):', telegramError);
      // Do not block the booking response
    }


    return Response.json({
      message: 'Booking completion handled successfully',
      data: {
        booking_id,
        payment_id,
        vehicle_id,
        buffer_hours: bufferHours,
        next_available: nextAvailable.toISOString(),
        buffer_until: nextAvailable.toISOString()
      }
    });

  } catch (error) {
    console.error('Error completing booking:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
