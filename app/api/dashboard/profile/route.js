import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch customer profile data
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching customer profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Transform data for frontend
    const profileData = {
      name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Guest',
      phone: customer?.phone || '',
      email: customer?.email || '',
      gender: customer?.gender || '',
      address: customer?.address || '',
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || ''
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Dashboard profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { userId, profileData } = body;
    
    if (!userId || !profileData) {
      return NextResponse.json({ error: 'User ID and profile data are required' }, { status: 400 });
    }

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .single();

    const customerData = {
      user_id: userId,
      first_name: profileData.firstName || profileData.first_name,
      last_name: profileData.lastName || profileData.last_name,
      gender: profileData.gender,
      phone: profileData.phone,
      email: profileData.email,
      address: profileData.address
    };

    let result;
    if (existingCustomer) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new customer
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Dashboard profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}