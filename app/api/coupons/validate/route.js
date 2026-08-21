import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../../../../lib/auth.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// This route runs server-side, so use the service role only for the
// user-specific booking-history lookup after the request JWT is verified.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Coupon code is required' 
      }, { status: 400 });
    }

    // Query coupons table directly (active_coupons view lacks new columns)
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      }, { status: 400 });
    }

    // 1. Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json({ 
        valid: false, 
        message: 'This coupon is no longer active' 
      }, { status: 400 });
    }

    // 2. Date validation
    const now = new Date();
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (validFrom && now < validFrom) {
       return NextResponse.json({ 
        valid: false, 
        message: 'Coupon is not yet active' 
      }, { status: 400 });
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Coupon has expired' 
      }, { status: 400 });
    }

    // 3. Minimum amount validation
    const minAmount = parseFloat(coupon.min_amount || 0);
    // Determine which amount to check against (orderTotal is pre-discount gross total, subtotal is basePrice)
    const amountToCheck = body.orderTotal || body.subtotal || subtotal; 
    
    if (amountToCheck < minAmount) {
      return NextResponse.json({ 
        valid: false, 
        message: `Minimum order amount of ₹${minAmount} required to use this coupon` 
      }, { status: 400 });
    }

    // 4. Global Usage limit validation
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Coupon usage limit exceeded across the platform' 
      }, { status: 400 });
    }

    // 5. User-Specific Logic (Fetch past bookings)
    const user = getUserFromRequest(request);
    if (user?.sub) {
      try {
        // Fetch all confirmed/completed bookings for this user to calculate their history.
        const { data: pastBookings, error: bookingsError } = await supabaseAdmin
          .from('bookings')
          .select('id, applied_coupon')
          .eq('user_id', user.sub)
          .in('status', ['confirmed', 'completed']);

        if (!bookingsError) {
          const pastCouponsUsedCount = pastBookings.filter(b => b.applied_coupon !== null).length;
          const pastUsedCodes = pastBookings.map(b => b.applied_coupon).filter(Boolean);

          // A. Single Use Enforcement
          if (coupon.is_single_use && pastUsedCodes.includes(coupon.code)) {
            return NextResponse.json({
              valid: false,
              message: 'You have already used this coupon'
            }, { status: 400 });
          }

          // B. Sequence Gating Enforcement
          const requiredCount = coupon.required_previous_coupons_used;
          if (requiredCount !== undefined && requiredCount !== null && requiredCount >= 0) {
            if (pastCouponsUsedCount !== requiredCount) {
              // Formatting a friendly error message
              let errorMsg = 'This coupon is not valid for your current sequence';
              if (requiredCount === 0) errorMsg = 'This coupon is for first-time coupon users only';
              else if (requiredCount === 1) errorMsg = 'This coupon is unlocked for your second coupon use';
              else errorMsg = `This coupon requires exactly ${requiredCount} previous coupon uses`;

              return NextResponse.json({ valid: false, message: errorMsg }, { status: 400 });
            }
          }
        }
      } catch (e) {
        console.error("Error verifying user for coupon usage checks:", e);
        // Fail open or closed? If token provided but fails to parse, we should probably evaluate carefully.
        // For now, we skip user-specific blockage if we can't identify the user.
      }
    }

    // 6. Calculate discount
    let discount = 0;
    const discountValue = parseFloat(coupon.discount_value || 0);

    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * discountValue) / 100;
      // Apply max discount cap if it exists
      if (coupon.max_discount !== null) {
        discount = Math.min(discount, parseFloat(coupon.max_discount));
      }
    } else {
      // Fixed discount
      discount = discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);
    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({ 
      valid: true, 
      message: 'Coupon applied successfully',
      discount: discount,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: discountValue,
        description: coupon.description
      }
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      message: 'Internal server error during validation' 
    }, { status: 500 });
  }
}
