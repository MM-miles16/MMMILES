import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase storage base URL for car images
const STORAGE_BASE_URL = "https://tktfsjtlfjxbqfvbcoqr.supabase.co/storage/v1/object/public/car-images/";

// Helper to get full image URL
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return "/images/black.png";
  return imageUrl.startsWith("http") ? imageUrl : `${STORAGE_BASE_URL}${imageUrl}`;
};

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch bookings with vehicle details
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles (
          id,
          make,
          model,
          model_year,
          registration_number,
          vehicle_images (image_url, is_primary)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Transform data for frontend
    const transformedBookings = bookings.map(booking => {
      // Get the primary vehicle image using same logic as car/[id] page
      const rawImages = booking.vehicles?.vehicle_images || [];
      const sortedImages = [...rawImages].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      const primaryImage = sortedImages[0];

      // Use the same helper function as car/[id] page
      const imageUrl = primaryImage ? getFullImageUrl(primaryImage.image_url) : "/images/black.png";

      return {
        id: booking.id,
        title: `${booking.vehicles?.make} ${booking.vehicles?.model}`,
        img: imageUrl,
        rating: 4.5, // Default rating
        features: ['Serviced', `${booking.vehicles?.seating_capacity || 4} Seat`, 'AC'],
        details: [
          `${booking.vehicles?.model_year} model`,
          'good tyre condition',
          'Insurance covered',
          'Luggage space'
        ],
        status: booking.status,
        pickup: new Date(booking.start_time).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dropoff: new Date(booking.end_time).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        price: `₹${booking.total_amount || 0}`,
      };
    });

    return NextResponse.json(transformedBookings);

  } catch (error) {
    console.error('Dashboard bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}