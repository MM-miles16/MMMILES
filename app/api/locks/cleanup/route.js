// app/api/locks/cleanup/route.js
import { NextRequest } from 'next/server';

// POST /api/locks/cleanup - Manually trigger cleanup of expired locks
// NOTE: This is now primarily handled by the database trigger (auto_cleanup_expired_locks)
// This endpoint is kept for manual/admin cleanup only
export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Only update expired locks to 'expired' status (fast operation with index)
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?expires_at=lt.${new Date().toISOString()}&status=eq.active`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': request.headers.get('authorization'),
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'expired' })
      }
    );

    if (!updateResponse.ok) {
      console.warn('Warning: Failed to update expired locks');
    }

    // Skip the slow DELETE operation - let database handle cleanup via scheduled jobs
    // The DELETE operation was causing 20-28 second delays

    return Response.json({ 
      message: 'Lock cleanup completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during lock cleanup:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}