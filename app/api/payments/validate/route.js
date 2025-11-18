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
    const { vehicle_id } = body;

    if (!vehicle_id) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Vehicle ID is required' 
      }, { status: 400 });
    }

    // Check for active locks on this vehicle
    const { data: activeLocks, error } = await supabase
      .from('locks')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Lock validation error:', error);
      return NextResponse.json({ 
        valid: false, 
        message: 'Database error' 
      }, { status: 500 });
    }

    // Check if there's an active lock
    if (!activeLocks || activeLocks.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        message: 'No active payment session found' 
      }, { status: 400 });
    }

    const lock = activeLocks[0];
    const now = new Date();
    const expiresAt = new Date(lock.expires_at);
    const timeRemaining = Math.floor((expiresAt - now) / 1000); // in seconds

    if (timeRemaining <= 0) {
      // Lock has expired, update it
      await supabase
        .from('locks')
        .update({ status: 'expired' })
        .eq('id', lock.id);

      return NextResponse.json({ 
        valid: false, 
        message: 'Payment time has expired' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      message: 'Payment session is valid',
      timeRemaining: timeRemaining,
      lockId: lock.id
    });

  } catch (error) {
    console.error('Payment validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}