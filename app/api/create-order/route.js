// app/api/create-order/route.js
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth.js';

function getAuthToken(request) {
  return request.cookies?.get?.("auth_token")?.value || 
         request.headers?.get?.("cookie")?.match(/auth_token=([^;]+)/)?.[1] ||
         request.headers?.get?.("authorization")?.split?.(" ")?.[1] || "";
}
import { calculatePricing } from '../../../lib/pricing.js';

// Razorpay SDK imports
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

export async function POST(request) {
    try {
        const user = getUserFromRequest(request);
        if (!user) {
            return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
        }
        const token = getAuthToken(request);

        const { carId, pickupTime, returnTime, couponCode } = await request.json();

        // Validate required parameters
        if (!carId || !pickupTime || !returnTime) {
            return Response.json({
                error: 'carId, pickupTime, and returnTime are required'
            }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // 1. Fetch vehicle details and pricing from database
        const vehicleResponse = await fetch(
            `${supabaseUrl}/rest/v1/vehicles?id=eq.${carId}&select=*`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            }
        );

        if (!vehicleResponse.ok) {
            throw new Error('Failed to fetch vehicle details');
        }

        const vehicles = await vehicleResponse.json();
        if (vehicles.length === 0) {
            return Response.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        const vehicle = vehicles[0];

        // 2. Parse and validate dates
        const startDate = new Date(pickupTime);
        const endDate = new Date(returnTime);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return Response.json({ error: 'Invalid date format' }, { status: 400 });
        }

        if (endDate <= startDate) {
            return Response.json({ error: 'Return time must be after pickup time' }, { status: 400 });
        }

        const now = new Date();
        // Allow 5 min buffer
        const pastBuffer = 5 * 60 * 1000;
        if (startDate < new Date(now.getTime() - pastBuffer)) {
             return Response.json({ error: 'Pickup time cannot be in the past' }, { status: 400 });
        }

        const durationMs = endDate - startDate;
        const minDurationMs = 6 * 60 * 60 * 1000; // 6 hours

        if (durationMs < minDurationMs) {
             return Response.json({ error: 'Minimum booking duration is 6 hours' }, { status: 400 });
        }

        // 3. Get base daily rate from database
        const baseDailyRate = parseFloat(vehicle.base_daily_rate) || 0;

        if (baseDailyRate <= 0) {
            return Response.json({ error: 'Invalid base rate configuration' }, { status: 400 });
        }

        // --- Server-Side Pricing Calculation for Pre-Discount Total needed for validation ---
        // We calculate an initial price with 0 discount to check constraints
        const initialPricing = calculatePricing({
            baseDailyRate,
            pickupTime: startDate,
            returnTime: endDate,
            discount: 0,
        });
        const subtotal = initialPricing.costs.subtotalBeforeGST; // Used for coupon min_amount validation

        // 4. Validate Coupon and Calculate Discount (Server-Side)
        let validDiscount = 0;
        let appliedCouponCode = null;

        if (couponCode) {
            try {
                const couponResponse = await fetch(
                    `${supabaseUrl}/rest/v1/coupons?code=eq.${couponCode.toUpperCase()}&is_active=eq.true&select=*`,
                    {
                        headers: {
                            'apikey': supabaseKey,
                            'Authorization': token ? `Bearer ${token}` : '',
                        },
                    }
                );

                if (couponResponse.ok) {
                    const coupons = await couponResponse.json();
                    if (coupons.length > 0) {
                        const coupon = coupons[0];
                        console.log('🎫 create-order: Found coupon:', coupon.code, 'is_active:', coupon.is_active);
                        
                        // Validate Coupon Conditions
                        const now = new Date();
                        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
                        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
                        const minAmount = parseFloat(coupon.min_amount || 0);

                        let isValid = true;
                        if (!coupon.is_active) isValid = false;
                        if (validFrom && now < validFrom) isValid = false;
                        if (validUntil && now > validUntil) isValid = false;
                        if (initialPricing.total < minAmount) isValid = false;
                        if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) isValid = false;

                        // User-Specific Logic (Sequence API & Single Use)
                        if (isValid) {
                          try {
                            const bookingsRes = await fetch(
                               `${supabaseUrl}/rest/v1/bookings?user_id=eq.${user.sub}&select=id,applied_coupon&status=in.(confirmed,completed)`,
                               { headers: { 'apikey': supabaseKey, 'Authorization': token ? `Bearer ${token}` : '' } }
                            );
                            if (bookingsRes.ok) {
                              const pastBookings = await bookingsRes.json();
                              const pastCouponsUsedCount = pastBookings.filter(b => b.applied_coupon !== null).length;
                              const pastUsedCodes = pastBookings.map(b => b.applied_coupon).filter(Boolean);
                              console.log('🎫 create-order user history:', { pastCouponsUsedCount, pastUsedCodes });

                              // Single use
                              if (coupon.is_single_use && pastUsedCodes.includes(coupon.code)) {
                                isValid = false;
                                console.log('🎫 create-order: Blocked - single use already used');
                              }

                              // Sequence gating
                              const requiredCount = coupon.required_previous_coupons_used;
                              if (requiredCount !== undefined && requiredCount !== null && requiredCount >= 0) {
                                if (pastCouponsUsedCount !== requiredCount) {
                                  isValid = false;
                                  console.log('🎫 create-order: Blocked - sequence mismatch', { requiredCount, pastCouponsUsedCount });
                                }
                              }
                            } else {
                              console.warn('🎫 create-order: Failed to fetch user bookings, skipping user-specific checks');
                            }
                          } catch (userCheckErr) {
                            console.error('🎫 create-order: User-specific check error:', userCheckErr);
                            // Don't block the coupon - the validate API already checked this
                          }
                        }

                        console.log('🎫 create-order: Final isValid =', isValid);

                        if (isValid) {
                            appliedCouponCode = coupon.code;
                            const discountValue = parseFloat(coupon.discount_value || 0);
                            
                            if (coupon.discount_type === 'percentage') {
                                validDiscount = (subtotal * discountValue) / 100;
                                if (coupon.max_discount !== null) {
                                    validDiscount = Math.min(validDiscount, parseFloat(coupon.max_discount));
                                }
                            } else {
                                validDiscount = discountValue;
                            }
                            
                            // Cap discount at subtotal
                            validDiscount = Math.min(validDiscount, subtotal);
                            validDiscount = Math.round(validDiscount * 100) / 100;
                        }
                    }
                }
            } catch (couponError) {
                console.error("Coupon validation error during order creation:", couponError);
                // Fail safe: validDiscount remains 0
            }
        }

        // 5. Final Calculation with Validated Discount
        const pricing = calculatePricing({
            baseDailyRate,
            pickupTime: startDate,
            returnTime: endDate,
            discount: validDiscount,
        });

        // 6. Validate calculated prices (sanity checks)
        if (pricing.total <= 0 || pricing.total > 500000) { // Max 5 lakh INR
            return Response.json({ error: 'Invalid calculated price', total: pricing.total }, { status: 400 });
        }

        // 7. Create Razorpay order with server-calculated amount
        const orderOptions = {
            amount: Math.round(pricing.total * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `booking_${carId}_${Date.now()}`,
            notes: {
                vehicle_id: carId.toString(),
                user_id: user.sub,
                tier: pricing.tier.name,
                hours: pricing.hours.toString(),
                pickup_time: pickupTime,
                return_time: returnTime,
                discount: validDiscount.toString(),
                coupon_code: appliedCouponCode || "",
                calculated_total: pricing.total.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // 8. Return order details to client
        return Response.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: pricing.total,
            currency: 'INR',
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            pricing: {
                hours: pricing.hours,
                weekendHours: pricing.weekendHours,
                tier: pricing.tier,
                rates: pricing.rates,
                costs: pricing.costs,
                discount: validDiscount,
                total: pricing.total,
            },
            vehicle: {
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model,
                model_year: vehicle.model_year
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return Response.json({
            error: 'Failed to create payment order',
            details: error.message
        }, { status: 500 });
    }
}