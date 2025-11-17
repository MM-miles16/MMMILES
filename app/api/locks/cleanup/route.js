// app/api/locks/cleanup/route.js
import { NextRequest } from 'next/server';

// POST /api/locks/cleanup - Manually trigger cleanup of expired locks
export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Update expired locks to 'expired' status
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
      throw new Error('Failed to update expired locks');
    }

    // Clean up old locks (older than 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const cleanupResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?created_at=lt.${yesterday.toISOString()}&status=in.(expired,cancelled,converted)`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': request.headers.get('authorization'),
        },
      }
    );

    if (!cleanupResponse.ok) {
      console.warn('Warning: Failed to clean up old locks');
    }

    return Response.json({ 
      message: 'Lock cleanup completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during lock cleanup:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}