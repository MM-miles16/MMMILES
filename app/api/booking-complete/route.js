// app/api/booking-complete/route.js
import { NextRequest } from 'next/server';
import { getUserFromAuthHeader } from '../../../lib/auth.js';

// Razorpay SDK for payment verification
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// POST /api/booking-complete - Handle post-booking tasks like buffer time and lock conversion
export async function POST(request) {
  try {
    const user = getUserFromAuthHeader(request.headers.get('authorization'));
    if (!user) {
      return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
    }

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
          'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
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

    // 2. Verify payment amount matches expected amount (Security check)
    if (expected_amount) {
      try {
        const payment = await razorpay.payments.fetch(payment_id);

        if (payment.status !== 'captured') {
          return Response.json({ error: 'Payment not completed' }, { status: 400 });
        }

        const paidAmount = payment.amount / 100; // Convert from paise to rupees
        const expectedAmount = parseFloat(expected_amount);

        if (Math.abs(paidAmount - expectedAmount) > 0.01) { // Allow 1 paisa difference for rounding
          console.error(`Payment verification failed: Paid ${paidAmount}, Expected ${expectedAmount}`);
          return Response.json({
            error: 'Payment amount mismatch',
            paid_amount: paidAmount,
            expected_amount: expectedAmount
          }, { status: 400 });
        }

        console.log(`Payment verified successfully: ${paidAmount} INR`);
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError);
        return Response.json({ error: 'Failed to verify payment' }, { status: 400 });
      }
    }

    // 3. Get vehicle details to get buffer_hours
    const vehicleResponse = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle_id}&select=buffer_hours,current_status`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': request.headers.get('authorization'),
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
    const bufferHours = vehicle.buffer_hours || 6;

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
          'Authorization': request.headers.get('authorization'),
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
          'Authorization': request.headers.get('authorization'),
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

    // 6. Trigger cleanup of any expired locks
    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/cleanup_expired_locks`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': request.headers.get('authorization'),
          'Content-Type': 'application/json'
        }
      });
    } catch (cleanupError) {
      console.warn('Warning: Cleanup function failed, but this is non-critical');
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
