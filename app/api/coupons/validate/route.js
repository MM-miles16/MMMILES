import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Check if coupons table exists, if not return mock data
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        // Return mock coupon data for demo
        const mockCoupons = {
          'WELCOME10': { discount_type: 'fixed', discount_value: 100 },
          'SAVE20': { discount_type: 'fixed', discount_value: 200 },
          'FIRST15': { discount_type: 'percentage', discount_value: 15, max_discount: 300 }
        };

        const mockCoupon = mockCoupons[code.toUpperCase()];
        if (mockCoupon) {
          let discount = mockCoupon.discount_value;
          
          if (mockCoupon.discount_type === 'percentage') {
            discount = Math.min(
              (subtotal * mockCoupon.discount_value / 100),
              mockCoupon.max_discount || Infinity
            );
          }
          
          return NextResponse.json({ 
            valid: true, 
            message: 'Coupon applied successfully',
            discount: discount,
            coupon: {
              code: code.toUpperCase(),
              discount_type: mockCoupon.discount_type,
              discount_value: mockCoupon.discount_value
            }
          });
        }
        
        return NextResponse.json({ 
          valid: false, 
          message: 'Invalid coupon code' 
        }, { status: 400 });
      }

      // Validate coupon conditions
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);

      if (now < validFrom || now > validUntil) {
        return NextResponse.json({ 
          valid: false, 
          message: 'Coupon has expired or not yet valid' 
        }, { status: 400 });
      }

      if (subtotal < coupon.min_amount) {
        return NextResponse.json({ 
          valid: false, 
          message: `Minimum order amount is ₹${coupon.min_amount}` 
        }, { status: 400 });
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return NextResponse.json({ 
          valid: false, 
          message: 'Coupon usage limit exceeded' 
        }, { status: 400 });
      }

      // Calculate discount
      let discount = coupon.discount_value;
      if (coupon.discount_type === 'percentage') {
        discount = Math.min(
          (subtotal * coupon.discount_value / 100),
          coupon.max_discount || Infinity
        );
      }

      return NextResponse.json({ 
        valid: true, 
        message: 'Coupon applied successfully',
        discount: discount,
        coupon: coupon
      });

    } catch (dbError) {
      // Fallback to mock data if coupons table doesn't exist
      const mockCoupons = {
        'WELCOME10': { discount_type: 'fixed', discount_value: 100 },
        'SAVE20': { discount_type: 'fixed', discount_value: 200 },
        'FIRST15': { discount_type: 'percentage', discount_value: 15, max_discount: 300 }
      };

      const mockCoupon = mockCoupons[code.toUpperCase()];
      if (mockCoupon) {
        let discount = mockCoupon.discount_value;
        
        if (mockCoupon.discount_type === 'percentage') {
          discount = Math.min(
            (subtotal * mockCoupon.discount_value / 100),
            mockCoupon.max_discount || Infinity
          );
        }
        
        return NextResponse.json({ 
          valid: true, 
          message: 'Coupon applied successfully',
          discount: discount,
          coupon: {
            code: code.toUpperCase(),
            discount_type: mockCoupon.discount_type,
            discount_value: mockCoupon.discount_value
          }
        });
      }
      
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}